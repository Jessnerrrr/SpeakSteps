import { ChildProfileStore } from './child-profile-store';
import { learningCategory, useLearningAssignments } from './learning-workflow';
import type { AssignedActivity } from './parent-tasks-mock';

export function useAssignedActivities(): AssignedActivity[] {
  const assignments = useLearningAssignments();
  const studentId = ChildProfileStore.getProfile().id;
  return assignments.filter((item) => item.studentId === studentId).map((item): AssignedActivity => ({
      id: item.id,
      title: item.title,
      level: item.level,
      category: learningCategory(item.level),
      assignedBy: item.assignedBy,
      status: item.feedback ? 'completed' : 'pending',
      thumbnail: require('../../assets/images/trophy.png'),
      description: item.instructions,
      guidance: item.guidance,
      source: item.source,
      attempts: 0,
      bestScore: '—',
      stars: '—',
      dueDate: item.dueDate,
      linked: true,
      submitted: Boolean(item.submittedAt),
    }));
}
