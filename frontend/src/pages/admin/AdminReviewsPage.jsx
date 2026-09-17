import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, reviewApi } from '@/api';
import { ADMIN_PAGE_SIZE } from '@/constants';
import { formatDateTime, initials, truncate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useDebounce from '@/hooks/useDebounce';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import { Rating } from '@/components/ui/Rating';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import ProductImage from '@/components/product/ProductImage';

/**
 * Moderation view over every review. Listing comes from GET /admin/reviews;
 * removal reuses DELETE /reviews/:id, which already permits admins and re-syncs
 * the product's rating aggregate.
 */
const AdminReviewsPage = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const params = useMemo(
    () => ({ page, limit: ADMIN_PAGE_SIZE, ...(debouncedSearch && { search: debouncedSearch }), ...(rating && { rating }) }),
    [page, debouncedSearch, rating]
  );

  const resource = useApiResource(() => adminApi.reviews(params), [params]);
  const reviews = resource.data?.reviews ?? [];
  const histogram = resource.data?.histogram ?? [];
  const totalReviews = histogram.reduce((sum, entry) => sum + entry.count, 0);
  const average = totalReviews
    ? (histogram.reduce((sum, entry) => sum + entry.rating * entry.count, 0) / totalReviews).toFixed(1)
    : '0.0';

  const remove = async () => {
    setDeleting(true);
    try {
      await reviewApi.remove(deleteTarget._id);
      toast.success('Review removed and the product rating was recalculated.');
      setDeleteTarget(null);
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reviews & ratings" description="Everything customers have written, newest first. Removing a review re-syncs the product's average." />

      <div className="mt-6 grid gap-5 lg:grid-cols-[320px,1fr]">
        {/* Overview */}
        <section className="card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Store-wide rating</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-5xl font-extrabold tracking-tight text-ink-900">{average}</span>
            <span className="pb-1.5 text-ink-400">/ 5</span>
          </div>
          <Rating value={Number(average)} size="sm" className="mt-2" />
          <p className="mt-1 text-sm text-ink-500">{totalReviews} review{totalReviews === 1 ? '' : 's'} in total</p>

          <div className="mt-5 space-y-2">
            {histogram.map((entry) => {
              const pct = totalReviews ? (entry.count / totalReviews) * 100 : 0;
              return (
                <button
                  key={entry.rating}
                  type="button"
                  onClick={() => {
                    setRating(rating === String(entry.rating) ? '' : String(entry.rating));
                    setPage(1);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-sm transition hover:bg-ink-50"
                  aria-pressed={rating === String(entry.rating)}
                >
                  <span className="w-8 font-semibold text-ink-700">{entry.rating}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-8 text-right text-xs text-ink-500">{entry.count}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div>
          <div className="card p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr,180px]">
              <Input
                placeholder="Search by product name…"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                aria-label="Search reviews by product"
                leadingIcon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" strokeLinecap="round" /></svg>}
              />
              <Select value={rating} onChange={(event) => { setRating(event.target.value); setPage(1); }} aria-label="Filter by rating">
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            {resource.loading ? (
              <LoadingBlock label="Loading reviews…" />
            ) : resource.error ? (
              <ErrorState error={resource.error} onRetry={resource.reload} />
            ) : reviews.length === 0 ? (
              <EmptyState title="No reviews match" description="Try a different rating or search term." />
            ) : (
              <ul className="space-y-3">
                {reviews.map((review, index) => (
                  <li key={review._id} className="card p-5 animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Link to={`/products/${review.product?.slug ?? review.product?._id}`} className="flex shrink-0 items-center gap-3 sm:w-56">
                        <span className="h-12 w-12 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
                          <ProductImage src={review.product?.images?.[0]} alt="" compact />
                        </span>
                        <span className="min-w-0 text-sm font-semibold text-ink-900 hover:text-brand-700">{truncate(review.product?.name ?? 'Deleted product', 40)}</span>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">{initials(review.user?.name)}</span>
                          <span className="text-sm font-semibold text-ink-900">{review.user?.name ?? 'Deleted user'}</span>
                          <span className="text-xs text-ink-400">{review.user?.email}</span>
                          {review.isVerifiedPurchase && <Badge tone="success" className="text-[11px]">Verified purchase</Badge>}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Rating value={review.rating} size="xs" />
                          <span className="text-xs text-ink-400">{formatDateTime(review.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>
                      </div>

                      <div className="shrink-0 sm:self-start">
                        <Button variant="ghost" size="xs" className="text-danger-600 hover:bg-danger-50" onClick={() => setDeleteTarget(review)}>Remove</Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {resource.meta && <Pagination meta={resource.meta} onPageChange={setPage} className="mt-6" />}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Remove this review?"
        description={`The ${deleteTarget?.rating}-star review by ${deleteTarget?.user?.name ?? 'this customer'} will be deleted and the product rating recalculated.`}
        confirmLabel="Remove review"
      />
    </div>
  );
};

export default AdminReviewsPage;
