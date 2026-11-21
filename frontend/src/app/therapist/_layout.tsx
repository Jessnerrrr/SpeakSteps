import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { TherapistProvider } from '@/components/therapist/TherapistProvider';
import { ActivitiesProvider } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';
import { ReviewsProvider } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';

export default function TherapistLayout() {
  return (
    <RoleGuard role="therapist" loginRoute="/therapist-login">
      <SafeAreaProvider>
        <TherapistProvider>
          <ActivitiesProvider>
            <ReviewsProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
            </ReviewsProvider>
          </ActivitiesProvider>
        </TherapistProvider>
      </SafeAreaProvider>
    </RoleGuard>
  );
}
