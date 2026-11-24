import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const firstSegment = segments[0];
    if (firstSegment !== '(admin)') {
      router.replace('/(admin)/admin-login');
    }
  }, [segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}