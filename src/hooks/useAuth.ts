import { useEffect } from 'react';
import { useAuthStore } from '@store/auth.store';
import { authService } from '@services/auth.service';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // 1) Proactive initial session check — guarantees isLoading becomes false
    (async () => {
      try {
        const session = await authService.getSession();
        if (!mounted) return;
        if (session) {
          const currentUser = await authService.getCurrentUser();
          if (mounted) setUser(currentUser);
        } else {
          if (mounted) setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      }
    })();

    // 2) React to future auth changes (login/logout/signup)
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (mounted) setUser(currentUser);
        } catch {
          if (mounted) setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, logout]);

  return { user, isLoading, isAuthenticated };
}
