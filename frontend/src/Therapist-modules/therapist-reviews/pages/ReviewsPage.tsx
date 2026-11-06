import { TherapistShell } from '@/components/therapist/TherapistShell';
import { ReviewList } from '@/Therapist-modules/therapist-reviews/components/ReviewList';

export default function ReviewsPage() {
  return (
    <TherapistShell active="reviews">
      <ReviewList />
    </TherapistShell>
  );
}
