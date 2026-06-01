import { useEffect } from 'react';
import { useAuthStore } from '@store/auth.store';
import { authService } from '@services/auth.service';
import { notificationService } from '@services/notification.service';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);

          const pushToken = await notificationService.registerForPushNotifications();
          if (pushToken && currentUser) {
            await authService.updatePushToken(currentUser.id, pushToken);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    init();

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        logout();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, logout]);

  return { user, isLoading, isAuthenticated };
}
