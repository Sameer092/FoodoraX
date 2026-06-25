import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { authService } from '@services/auth.service';
import type { User, UserRole } from '@types/index';

// Build a usable User instantly from the auth session (no network needed),
// so the app can route immediately instead of blocking on a DB fetch.
function userFromSession(session: any): User {
  const u = session.user;
  const m = (u.user_metadata ?? {}) as Record<string, string>;
  return {
    id: u.id,
    email: u.email ?? m.email ?? '',
    full_name: m.full_name ?? 'User',
    phone: m.phone,
    role: (m.role as UserRole) ?? 'customer',
    is_active: true,
    created_at: u.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
}

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    // Safety net: never sit on the loading screen forever.
    const timeout = setTimeout(() => {
      if (mounted && useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, 5000);

    const resolve = async (session: any) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        return;
      }
      // 1) Route instantly from session metadata (flips isLoading off immediately)
      setUser(userFromSession(session));
      // 2) Refine with the real DB profile in the background
      try {
        const fresh = await authService.getCurrentUser();
        if (mounted && fresh) setUser(fresh);
      } catch {
        // keep the session-derived user
      }
    };

    // React to all auth events — INITIAL_SESSION fires once on startup.
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        logout();
      } else {
        await resolve(session); // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
        // When the token (re)appears, refetch data so RLS-backed queries that
        // may have returned empty with a stale token reload with valid auth.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries();
        }
      }
    });

    // Proactive check too, in case the listener is slow on cold start.
    authService.getSession()
      .then((s) => { if (mounted) void resolve(s); })
      .catch(() => { if (mounted) setUser(null); });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, logout, queryClient]);

  return { user, isLoading, isAuthenticated };
}
