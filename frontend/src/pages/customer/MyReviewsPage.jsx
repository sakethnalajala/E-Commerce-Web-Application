import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '@/api';
import { formatDate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import ProductImage from '@/components/product/ProductImage';
import { Rating } from '@/components/ui/Rating';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';

/** Everything the customer has written, newest first, with the option to remove a review. */
const MyReviewsPage = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const resource = useApiResource(() => reviewApi.mine({ page, limit: 8 }), [page]);
  const reviews = resource.data?.reviews ?? [];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reviewApi.remove(deleteTarget._id);
      toast.success('Review removed.');
      setDeleteTarget(null);
      await resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Account"
        title="My reviews"
        description="Reviews you have written. Verified purchases carry a badge on the product page."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Dashboard', to: '/dashboard' }, { label: 'Reviews' }]}
      />

      <div className="mt-6">
        {resource.loading && !resource.data ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        ) : resource.error ? (
          <ErrorState title="Could not load your reviews" error={resource.error} onRetry={resource.reload} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Once an order is delivered you can rate the products from their pages."
            action={<Button to="/orders">View my orders</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => {
              const product = review.product;
              const href = product ? `/products/${product.slug ?? product._id}` : null;
              return (
                <li key={review._id} className="card p-4 sm:p-5">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-100 sm:h-20 sm:w-20">
                      <ProductImage src={product?.images?.[0]} alt="" compact />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {href ? (
                            <Link to={href} className="block truncate font-semibold text-ink-900 hover:text-brand-700">{product.name}</Link>
                          ) : (
                            <p className="truncate font-semibold text-ink-900">Product no longer available</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Rating value={review.rating} size="xs" />
                            <span className="text-xs text-ink-400">{formatDate(review.createdAt)}</span>
                            {review.isVerifiedPurchase && <Badge tone="success" dot>Verified purchase</Badge>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {href && <Button to={href} variant="outline" size="xs">View product</Button>}
                          <Button variant="ghost" size="xs" className="text-danger-600" onClick={() => setDeleteTarget(review)}>Remove</Button>
                        </div>
                      </div>
                      {review.comment && <p className="mt-2 text-sm leading-relaxed text-ink-600">{review.comment}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {resource.meta?.totalPages > 1 && (
          <Pagination meta={resource.meta} onPageChange={setPage} className="mt-6" />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove this review?"
        description="The product's average rating will be recalculated. This cannot be undone."
        confirmLabel="Remove review"
      />
    </div>
  );
};

export default MyReviewsPage;
