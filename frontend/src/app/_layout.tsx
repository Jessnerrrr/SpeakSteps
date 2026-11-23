// OTA test

import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const allowedWebRoutes = [
        '/admin-login',
        '/admin-dashboard',
        '/admin-forgot-password',
      ];

      const isAllowed =
        allowedWebRoutes.includes(pathname) ||
        pathname.startsWith('/accounts');

      if (!isAllowed) {
        router.replace('/admin-login');
      }
    }
  }, [pathname, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}