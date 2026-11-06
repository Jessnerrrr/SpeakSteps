import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TherapistProvider } from '@/components/therapist/TherapistProvider';
import { ActivitiesProvider } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';
import { ReviewsProvider } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';

export default function TherapistLayout() {
  return (
    <SafeAreaProvider>
      <TherapistProvider>
        <ActivitiesProvider>
          <ReviewsProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </ReviewsProvider>
        </ActivitiesProvider>
      </TherapistProvider>
    </SafeAreaProvider>
  );
}
