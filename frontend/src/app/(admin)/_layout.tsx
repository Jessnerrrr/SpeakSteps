import { RoleGuard } from '@/components/auth/RoleGuard';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <RoleGuard
      role="admin"
      loginRoute="/(admin)/admin-login"
      publicRoutes={['admin-login', 'admin-forgot-password']}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
