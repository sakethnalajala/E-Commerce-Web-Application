import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional className helper used across every component.
 *
 * clsx joins the classes; twMerge then resolves Tailwind conflicts so a caller's
 * `className` reliably beats a component's own defaults. Without the merge step
 * `bg-brand-600` and `bg-white` would both survive and stylesheet order — not the
 * caller — would decide the winner.
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

export default cn;
