import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ReviewRecord, ReviewTarget } from '@/Therapist-modules/therapist-reviews/data/reviewData';
import { getReviews, saveReview as saveReviewRequest } from '@/services/user-api';

type ReviewsContextValue = {
  reviews: ReviewRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateReview: (id: string, patch: Partial<ReviewRecord>) => void;
  updateTarget: (reviewId: string, targetId: string, patch: Partial<ReviewTarget>) => void;
  saveEvaluation: (id: string) => Promise<void>;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saved = await getReviews();
      setReviews(saved.map((item) => ({
        ...item,
        avatar: '#D5E5F4',
        targets: item.targets.map((target) => ({ ...target, notesOpen: false })),
      })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load therapist reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateReview = useCallback((id: string, patch: Partial<ReviewRecord>) => {
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, ...patch } : review)));
  }, []);

  const updateTarget = useCallback((reviewId: string, targetId: string, patch: Partial<ReviewTarget>) => {
    setReviews((current) => current.map((review) =>
      review.id === reviewId
        ? {
          ...review,
          targets: review.targets.map((target) => (target.id === targetId ? { ...target, ...patch } : target)),
        }
        : review,
    ));
  }, []);

  const saveEvaluation = useCallback(async (id: string) => {
    const review = reviews.find((item) => item.id === id);
    if (!review) throw new Error('This review is no longer available.');
    setError(null);
    try {
      await saveReviewRequest({
        submissionId: review.id,
        observations: review.observations,
        parentFeedback: review.parentFeedback,
        homePractice: review.homePractice,
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
      setError(saveError instanceof Error ? saveError.message : 'Could not save this evaluation.');
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
