import { RoleGuard } from '@/components/auth/RoleGuard';
import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <RoleGuard role="teacher" loginRoute="/teacher-login">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
