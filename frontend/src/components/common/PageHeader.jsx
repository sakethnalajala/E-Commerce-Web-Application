import { Link } from 'react-router-dom';
import cn from '@/utils/cn';
import BackButton from './BackButton';

/** Page title block with optional eyebrow, breadcrumbs and a right-hand action slot. */
const PageHeader = ({ title, description, eyebrow, breadcrumbs = [], actions, back, backLabel = 'Back', className }) => (
  <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      {back && (
        <div className="-ml-2 mb-3">
          <BackButton fallback={back} label={backLabel} />
        </div>
      )}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <svg className="h-3.5 w-3.5 text-ink-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7.2 15.7a1 1 0 010-1.4L11.5 10 7.2 5.7a1 1 0 011.4-1.4l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4 0z" />
                  </svg>
                )}
                {crumb.to ? (
                  <Link to={crumb.to} className="rounded-md transition hover:text-brand-600">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate font-semibold text-ink-800">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      {title && <h1 className="text-balance">{title}</h1>}
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">{description}</p>}
    </div>

    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
