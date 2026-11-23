import { useLearningAssignments, saveLearningFeedback } from '@/data/learning-workflow';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { sampleReviews, type ReviewRecord, type ReviewTarget } from '@/Therapist-modules/therapist-reviews/data/reviewData';

type ReviewsContextValue = {
  reviews: ReviewRecord[];
  updateReview: (id: string, patch: Partial<ReviewRecord>) => void;
  updateTarget: (reviewId: string, targetId: string, patch: Partial<ReviewTarget>) => void;
  saveEvaluation: (id: string) => void;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { profile } = useTherapist();
  const assignments = useLearningAssignments();
  const [storedReviews, setReviews] = useState<ReviewRecord[]>(sampleReviews);
  const reviews = useMemo<ReviewRecord[]>(() => [
    ...assignments.filter((assignment) => assignment.submittedAt).map((assignment): ReviewRecord => {
      const id = 'submission:' + assignment.id;
      const draft = storedReviews.find((item) => item.id === id);
      return {
        id,
        assignmentId: assignment.id,
        student: assignment.studentName,
        initial: assignment.studentName.charAt(0),
        avatar: '#D7E7C8',
        activity: assignment.title,
        sound: '',
        level: assignment.level,
        language: assignment.language,
        status: assignment.feedback ? 'Reviewed' : 'Pending',
        targets: [],
        practicePrompts: assignment.prompts,
        observations: draft?.observations ?? assignment.feedback?.observations ?? '',
        parentFeedback: draft?.parentFeedback ?? assignment.feedback?.message ?? '',
        homePractice: draft?.homePractice ?? assignment.feedback?.homePractice ?? '',
      };
    }),
    ...storedReviews.filter((review) => !review.assignmentId),
  ], [assignments, storedReviews]);

  const updateReview = useCallback((id: string, patch: Partial<ReviewRecord>) => {
    const existing = reviews.find((review) => review.id === id);
    if (!existing) return;
    setReviews((current) => current.some((review) => review.id === id)
      ? current.map((review) => review.id === id ? { ...review, ...patch } : review)
      : [...current, { ...existing, ...patch }]);
  }, [reviews]);

  const updateTarget = useCallback((reviewId: string, targetId: string, patch: Partial<ReviewTarget>) => {
    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId
          ? { ...review, targets: review.targets.map((target) => (target.id === targetId ? { ...target, ...patch } : target)) }
          : review,
      ),
    );
  }, []);

  const saveEvaluation = useCallback((id: string) => {
    const review = reviews.find((item) => item.id === id);
    if (!review) throw new Error('This review is no longer available.');
    if (review.assignmentId) {
      if (!review.parentFeedback.trim()) throw new Error('Add written feedback for the guardian before saving.');
      const saved = saveLearningFeedback(review.assignmentId, {
        message: review.parentFeedback.trim(),
        homePractice: review.homePractice.trim(),
        observations: review.observations.trim(),
        reviewedBy: profile.fullName,
        date: new Date().toISOString(),
      });
      if (!saved) throw new Error('This submission is no longer available.');
      return;
    }
    if (review.targets.length === 0 || review.targets.some((target) => target.score === null)) {
      throw new Error('Score every target before saving the evaluation.');
    }
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, status: 'Reviewed' } : review)));
  }, [reviews, profile.fullName]);

  const value = useMemo(
    () => ({ reviews, updateReview, updateTarget, saveEvaluation }),
    [reviews, updateReview, updateTarget, saveEvaluation],
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const value = useContext(ReviewsContext);
  if (!value) throw new Error('useReviews must be used inside ReviewsProvider');
  return value;
}
