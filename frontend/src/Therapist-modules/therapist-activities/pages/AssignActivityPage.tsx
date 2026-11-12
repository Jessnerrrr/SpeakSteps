import { TherapistShell } from '@/components/therapist/TherapistShell';
import { AssignActivity } from '@/Therapist-modules/therapist-activities/components/AssignActivity';

export default function AssignActivityPage() {
  return (
    <TherapistShell active="activities">
      <AssignActivity />
    </TherapistShell>
  );
}
