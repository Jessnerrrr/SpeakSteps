import { useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { RecordingReview } from '@/Therapist-modules/therapist-reviews/components/RecordingReview';

export default function ReviewDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="reviews">
      <RecordingReview reviewId={id || ''} />
    </TherapistShell>
  );
}
