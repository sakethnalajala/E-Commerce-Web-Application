import { useEffect, useRef } from 'react';

/**
 * Adds `is-visible` to an element once it scrolls into view, driving the
 * `.reveal` CSS transition. One shared IntersectionObserver serves every
 * element, so a page with dozens of reveals costs a single observer.
 */
let observer = null;
const callbacks = new WeakMap();

const getObserver = () => {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        callbacks.get(entry.target)?.();
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  return observer;
};

export const useReveal = ({ onVisible } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    // No observer support or reduced motion: show immediately.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      element.classList.add('is-visible');
      return undefined;
    }

    if (onVisible) callbacks.set(element, onVisible);
    const io = getObserver();
    io.observe(element);

    return () => {
      io.unobserve(element);
      callbacks.delete(element);
    };
  }, [onVisible]);

  return ref;
};

export default useReveal;
