import { TherapistShell } from '@/components/therapist/TherapistShell';
import { ActivityEditor } from '@/Therapist-modules/therapist-activities/components/ActivityEditor';

export default function ActivityEditPage() {
  return (
    <TherapistShell active="activities">
      <ActivityEditor />
    </TherapistShell>
  );
}
