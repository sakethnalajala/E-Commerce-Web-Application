import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '@/api';
import { formatRelativeTime, initials } from '@/utils/format';
import { reviewValidators } from '@/utils/validators';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import useForm from '@/hooks/useForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { Rating, RatingInput } from '@/components/ui/Rating';
import { Alert, EmptyState } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ui/Modal';
import cn from '@/utils/cn';

const ReviewItem = ({ review, currentUserId, onEdit, onDelete, index }) => {
  const isOwn = review.user?._id === currentUserId;

  return (
    <li
      className={cn(
        'rounded-2xl border p-5 transition animate-fade-up',
        isOwn ? 'border-brand-200 bg-brand-50/40' : 'border-ink-200/80 bg-surface'
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow-sm">
          {review.user?.avatar?.url ? (
            <img src={review.user.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initials(review.user?.name)
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink-900">{review.user?.name ?? 'Customer'}</p>
            {review.isVerifiedPurchase && (
              <Badge tone="success" className="text-[11px]">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10.5l3.5 3.5L15 7" /></svg>
                Verified purchase
              </Badge>
            )}
            {isOwn && <Badge tone="brand" className="text-[11px]">Your review</Badge>}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Rating value={review.rating} size="xs" />
            <span className="text-xs text-ink-400">{formatRelativeTime(review.createdAt)}</span>
          </div>

          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{review.comment}</p>

          {isOwn && (
            <div className="mt-3 flex gap-1">
              <Button variant="ghost" size="xs" onClick={() => onEdit(review)}>Edit</Button>
              <Button variant="ghost" size="xs" className="text-danger-600 hover:bg-danger-50" onClick={() => onDelete(review)}>Delete</Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

/**
 * Product reviews: distribution summary, the review list, and a form that
 * doubles as the edit form for the viewer's own review.
 */
const ReviewSection = ({ product, reviews = [], viewer, onReviewsChanged }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const ownReview = reviews.find((review) => review.user?._id === user?._id);

  const form = useForm({
    initialValues: { rating: 0, comment: '' },
    validators: reviewValidators,
    onSubmit: async (values) => {
      if (editing) {
        await reviewApi.update(editing._id, values);
        toast.success('Your review was updated.');
      } else {
        await reviewApi.create(product._id, values);
        toast.success('Thanks for your review!');
      }

      form.reset({ rating: 0, comment: '' });
      setEditing(null);
      setFormOpen(false);
      await onReviewsChanged?.();
    },
  });

  const startEdit = (review) => {
    setEditing(review);
    setFormOpen(true);
    form.reset({ rating: review.rating, comment: review.comment });
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reviewApi.remove(deleteTarget._id);
      toast.success('Review deleted.');
      setDeleteTarget(null);
      await onReviewsChanged?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));

  const average = Number(product.ratingsAverage ?? 0);

  return (
    <section className="card overflow-hidden" id="reviews">
      <div className="grid gap-8 border-b border-ink-100 p-6 sm:p-8 lg:grid-cols-[280px,1fr]">
        {/* Score card */}
        <div className="rounded-3xl bg-night-400 p-6 text-white noise relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Customer rating</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-6xl font-extrabold leading-none tracking-tight">{average.toFixed(1)}</span>
              <span className="pb-1.5 text-white/50">/ 5</span>
            </div>
            <div className="mt-3">
              <Rating value={average} size="md" />
            </div>
            <p className="mt-2 text-sm text-white/60">
              Based on {product.ratingsCount ?? 0} review{product.ratingsCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-xl font-bold">Ratings & reviews</h2>
          <p className="mt-1 text-sm text-ink-500">What customers say after living with this product.</p>

          <div className="mt-5 space-y-2">
            {distribution.map(({ rating, count }) => {
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <span className="w-8 shrink-0 font-semibold text-ink-700">{rating}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-[width] duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-ink-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {!isAuthenticated ? (
          <Alert tone="info">
            <Link to="/login" className="link">Log in</Link> to share your experience with this product.
          </Alert>
        ) : ownReview && !formOpen ? (
          <Alert tone="success">You have already reviewed this product — you can edit it below.</Alert>
        ) : !formOpen ? (
          <Button onClick={() => setFormOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>
            Write a review
          </Button>
        ) : null}

        {formOpen && isAuthenticated && (
          <form id="review-form" onSubmit={form.handleSubmit} className="mt-5 rounded-3xl border border-brand-200 bg-brand-50/40 p-5 animate-scale-in">
            <h3 className="text-base font-bold">{editing ? 'Edit your review' : 'Share your experience'}</h3>

            <div className="mt-4 space-y-4">
              <RatingInput
                value={form.values.rating}
                onChange={(rating) => form.setValue('rating', rating)}
                error={form.touched.rating ? form.errors.rating : undefined}
              />

              <Textarea
                label="Your review"
                name="comment"
                rows={4}
                placeholder="What did you like or dislike? How did you use this product?"
                {...form.fieldProps('comment')}
              />

              {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

              <div className="flex gap-2">
                <Button type="submit" loading={form.submitting}>
                  {editing ? 'Update review' : 'Submit review'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormOpen(false);
                    setEditing(null);
                    form.reset({ rating: 0, comment: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6">
          {reviews.length === 0 ? (
            <EmptyState compact className="border-0 bg-transparent" title="No reviews yet" description="Be the first to review this product." />
          ) : (
            <ul className="space-y-3">
              {reviews.map((review, index) => (
                <ReviewItem
                  key={review._id}
                  index={index}
                  review={review}
                  currentUserId={user?._id}
                  onEdit={startEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete your review?"
        description="This removes your rating and comment from this product. You can write a new review afterwards."
        confirmLabel="Delete review"
      />
    </section>
  );
};

export default ReviewSection;
