import cn from '@/utils/cn';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import { EmptyState, ErrorState } from '@/components/ui/States';

/**
 * Responsive product grid: 2 columns on phones, scaling to 4 on desktop.
 * Cards stagger in on mount. Owns its loading, error and empty states so
 * pages stay declarative.
 */
const ProductGrid = ({
  products,
  loading,
  error,
  onRetry,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
  columns = 4,
  className,
}) => {
  // `columns` is the desktop maximum; 'auto' lets wide screens go to five.
  const gridClass = cn(
    'grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-5 md:grid-cols-3',
    columns === 3 && 'lg:grid-cols-3',
    columns === 4 && 'lg:grid-cols-3 xl:grid-cols-4',
    columns === 'auto' && 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    className
  );

  if (loading) {
    return (
      <div className={gridClass} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (!products?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={gridClass}>
      {products.map((product, index) => (
        <div
          key={product._id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
        >
          <ProductCard product={product} className="h-full" />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
