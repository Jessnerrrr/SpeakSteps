import { useMemo } from 'react';

import { usePatientLearning } from '@/components/patient/PatientLearningProvider';
import type { AssignedActivity, ActivityCategory } from '@/data/parent-tasks-mock';

function categoryFromLevel(level: string): ActivityCategory {
  if (/syllable/i.test(level)) return 'Syllables';
  if (/phrase/i.test(level)) return 'Phrases';
  if (/sentence|conversation/i.test(level)) return 'Sentences';
  if (/word/i.test(level)) return 'Words';
  return 'Sound';
}

export function useAssignedActivities(): AssignedActivity[] {
  const { assignments, feedback } = usePatientLearning();
  return useMemo(() => assignments.map((assignment): AssignedActivity => {
    const activity = assignment.activity;
    const review = feedback.find((item) => item.assignmentId === assignment.id);
    const level = activity.level;
    return {
      id: assignment.id,
      activityId: assignment.activityId,
      patientId: assignment.patientId,
      patientCode: assignment.patientCode,
      title: activity.title,
      level,
      category: categoryFromLevel(level),
      assignedBy: 'Therapist',
      status: review ? 'completed' : 'pending',
      completedDate: review?.reviewedAt,
      dueDate: assignment.dueDate || undefined,
      linked: true,
      submitted: assignment.status === 'Completed',
      thumbnail: require('../../assets/images/trophy.png'),
      description: activity.instructions,
      guidance: activity.guide,
      source: 'Therapist',
      language: activity.language,
      sound: activity.sound,
      prompts: activity.words.map((word) => ({
        text: word.phrase || word.text,
        position: word.position,
      })),
      modelAudioUrls: activity.words.flatMap((word) => word.modelAudioUrl ? [word.modelAudioUrl] : []),
      assignmentStatus: assignment.status,
      attempts: 0,
      bestScore: '—',
      stars: '—',
    };
  }), [assignments, feedback]);
}
