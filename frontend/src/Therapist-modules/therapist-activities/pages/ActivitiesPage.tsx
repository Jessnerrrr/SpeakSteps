import { TherapistShell } from '@/components/therapist/TherapistShell';
import { ActivityLibrary } from '@/Therapist-modules/therapist-activities/components/ActivityLibrary';

export default function ActivitiesPage() {
  return (
    <TherapistShell active="activities">
      <ActivityLibrary />
    </TherapistShell>
  );
}
