import { useLocation } from 'react-router-dom';
import cn from '@/utils/cn';
import useReveal from '@/hooks/useReveal';

/**
 * Scroll-triggered entrance. Wrap any block; `delay` (ms) staggers siblings.
 * Renders a plain <div> by default — pass `as` for semantic elements.
 */
export const Reveal = ({ as: Tag = 'div', delay = 0, className, children, ...props }) => {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={cn('reveal', className)} style={{ '--reveal-delay': `${delay}ms` }} {...props}>
      {children}
    </Tag>
  );
};

/**
 * Route-level entrance: remounts on every pathname change so each page fades
 * up once. Cheap (opacity + transform only) and reduced-motion aware via CSS.
 */
export const PageTransition = ({ children, className }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className={cn('animate-fade-up', className)}>
      {children}
    </div>
  );
};

/**
 * Animated aurora backdrop for dark surfaces (hero, auth panel, admin brand
 * area). Three blurred blobs drift on long, offset loops — pure transforms, so
 * it composites on the GPU and costs nothing on the main thread.
 */
export const Aurora = ({ className, intensity = 1 }) => (
  <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
    <div
      className="absolute -left-[10%] -top-[20%] h-[60%] w-[55%] rounded-full bg-brand-600 blur-[110px] animate-aurora-a"
      style={{ opacity: 0.55 * intensity }}
    />
    <div
      className="absolute -right-[12%] top-[5%] h-[55%] w-[50%] rounded-full bg-fuchsia-600 blur-[120px] animate-aurora-b"
      style={{ opacity: 0.32 * intensity }}
    />
    <div
      className="absolute bottom-[-25%] left-[25%] h-[55%] w-[45%] rounded-full bg-sky-500 blur-[130px] animate-aurora-c"
      style={{ opacity: 0.22 * intensity }}
    />
    {/* Soft top light + gentle vignette so the blobs read as lighting, not shapes */}
    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(7_10_18/0.55)_100%)]" />
  </div>
);

export default Reveal;
