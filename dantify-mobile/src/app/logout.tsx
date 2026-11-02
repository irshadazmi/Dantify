// src/app/logout.tsx

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import { AppText } from '@/components/ui/app-text';

export default function LogoutScreen() {
  const COLORS = useAppColors();
  const styles = useStyles();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        if (mounted) {
          router.replace('/login');
        }
      }
    };

    void performLogout();

    return () => {
      mounted = false;
    };
  }, [logout, router]);

  return (
    <View style={[styles.settingsCenter, styles.container]}>
      <ActivityIndicator size="large" color={COLORS.primary} />

      <AppText variant="muted" style={styles.settingsLoadingText}>
        Logging out...
      </AppText>
    </View>
  );
}