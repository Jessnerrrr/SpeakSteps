import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ReviewRecord } from '@/Therapist-modules/therapist-reviews/data/reviewData';
import { getReviews, saveReview as saveReviewRequest } from '@/services/user-api';

type ReviewsContextValue = {
  reviews: ReviewRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateReview: (id: string, patch: Partial<ReviewRecord>) => void;
  updateTarget: (reviewId: string, targetId: string, patch: Partial<ReviewRecord['targets'][number]>) => void;
  saveEvaluation: (id: string) => Promise<void>;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

function mapReview(item: Awaited<ReturnType<typeof getReviews>>[number]): ReviewRecord {
  return {
    id: item.id,
    submissionId: item.submissionId || item.id,
    assignmentId: item.assignmentId || undefined,
    student: item.student,
    initial: item.initial || item.student.charAt(0).toUpperCase(),
    avatar: '#D7E7C8',
    activity: item.activity,
    sound: item.sound,
    level: item.level,
    language: item.language || '',
    status: item.status,
    targets: item.targets.map((target) => ({ ...target, notesOpen: false })),
    observations: item.observations,
    parentFeedback: item.parentFeedback,
    homePractice: item.homePractice,
    audioRecordingUrl: item.audioRecordingUrl,
  };
}

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews((await getReviews()).map(mapReview));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load clinical reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateReview = useCallback((id: string, patch: Partial<ReviewRecord>) => {
    setReviews((current) => current.map((review) => review.id === id ? { ...review, ...patch } : review));
  }, []);

  const updateTarget = useCallback((
    reviewId: string,
    targetId: string,
    patch: Partial<ReviewRecord['targets'][number]>,
  ) => {
    setReviews((current) => current.map((review) => review.id === reviewId
      ? {
        ...review,
        targets: review.targets.map((target) => target.id === targetId ? { ...target, ...patch } : target),
      }
      : review));
  }, []);

  const saveEvaluation = useCallback(async (id: string) => {
    const review = reviews.find((item) => item.id === id);
    if (!review?.submissionId) throw new Error('This review is no longer available.');
    if (!review.parentFeedback.trim()) throw new Error('Add written feedback for the guardian before saving.');
    if (review.targets.some((target) => target.score === null)) {
      throw new Error('Score every target before saving the evaluation.');
    }

    setError(null);
    try {
      await saveReviewRequest({
        submissionId: review.submissionId,
        observations: review.observations.trim(),
        parentFeedback: review.parentFeedback.trim(),
        homePractice: review.homePractice.trim(),
        targets: review.targets.map(({ text, position, score, feedback, remarks }) => ({
          text,
          position,
          score,
          feedback,
          remarks,
        })),
      });
      setReviews((current) => current.map((item) => item.id === id ? { ...item, status: 'Reviewed' } : item));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this clinical review.');
      throw saveError;
    }
  }, [reviews]);

  const value = useMemo(
    () => ({ reviews, loading, error, refresh, updateReview, updateTarget, saveEvaluation }),
    [reviews, loading, error, refresh, updateReview, updateTarget, saveEvaluation],
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const value = useContext(ReviewsContext);
  if (!value) throw new Error('useReviews must be used inside ReviewsProvider');
  return value;
}
