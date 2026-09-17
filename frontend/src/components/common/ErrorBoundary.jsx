import { Component } from 'react';
import Button from '@/components/ui/Button';

/**
 * Last-resort boundary: a render crash shows a recoverable screen instead of a
 * blank page. Route-level failures are handled by each page's error state.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="card w-full max-w-lg p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" strokeLinecap="round" />
              <path d="M12 16.5v.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-600">
            The page hit an unexpected error. Reloading usually clears it.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-ink-100 p-3 text-left text-xs text-ink-700">
              {error.message}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button onClick={() => window.location.assign('/')}>Go home</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
