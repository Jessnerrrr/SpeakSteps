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
  const [reviews, setReviews] = useState<ReviewRecord[]>(sampleReviews);

  const updateReview = useCallback((id: string, patch: Partial<ReviewRecord>) => {
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, ...patch } : review)));
  }, []);

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
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, status: 'Reviewed' } : review)));
  }, []);

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
