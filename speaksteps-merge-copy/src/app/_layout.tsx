import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* This tells the app to load index.tsx and hide the default top header bar */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}