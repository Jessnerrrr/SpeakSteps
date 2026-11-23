import { Stack } from 'expo-router';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { PatientLearningProvider } from '@/components/patient/PatientLearningProvider';

export default function PatientLayout() {
  return (
    <RoleGuard role="parent" loginRoute="/patient-login">
      <PatientLearningProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PatientLearningProvider>
    </RoleGuard>
  );
}
