import { useState } from 'react';
import cn from '@/utils/cn';
import { SOCIAL_PROVIDERS } from '@/constants';
import useSocialAuth from '@/hooks/useSocialAuth';
import useToast from '@/hooks/useToast';
import Spinner from '@/components/ui/Spinner';

const ICONS = {
  google: (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#4285F4" d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.2 1.1-.9 2.1-1.9 2.7l3 2.3c1.7-1.6 2.7-3.9 2.7-7.3z" />
      <path fill="#FBBC05" d="M6 14.2A5.9 5.9 0 0 1 5.6 12c0-.8.1-1.5.4-2.2L2.9 7.4A9.6 9.6 0 0 0 2.4 12c0 1.6.4 3.1 1 4.4L6 14.2z" />
      <path fill="#34A853" d="M12 21.6c2.6 0 4.8-.9 6.4-2.3l-3-2.3c-.9.6-2 1-3.4 1-3.9 0-5.2-2.6-5.4-3.9L3.4 16.4C5 19.5 8.2 21.6 12 21.6z" />
    </svg>
  ),
  apple: (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.2-1.2 3.1-2.4 1-1.4 1.4-2.8 1.4-2.8s-2.9-1.1-2.9-4.2zM14 5.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  ),
};

/**
 * "Continue with Google / Apple". Each button runs the real OAuth popup flow
 * (see useSocialAuth) and hands the signed-in user to `onSuccess`. A provider
 * whose credentials are not configured on the server is shown disabled with
 * an honest explanation — never a fake sign-in.
 */
const SocialLogin = ({ intent = 'Continue', onSuccess, onError, disabled = false, className }) => {
  const toast = useToast();
  const { providers, loading, busy, signIn } = useSocialAuth();
  const [notice, setNotice] = useState(null);

  const isEnabled = (id) => Boolean(providers?.[id]?.enabled);
  const anyEnabled = SOCIAL_PROVIDERS.some((provider) => isEnabled(provider.id));

  const handleClick = async (provider) => {
    if (!isEnabled(provider.id)) {
      // Honest, non-technical message: the button is real, the provider just is
      // not configured on this deployment yet.
      const message = `${provider.label} sign-in is currently being configured. Please use your email and password for now.`;
      setNotice(message);
      toast.info(message);
      return;
    }
    try {
      const user = await signIn(provider.id);
      if (user) onSuccess?.(user, provider.id);
    } catch (error) {
      const message = error.message || `${provider.label} sign-in failed.`;
      setNotice(message);
      onError?.(error, provider.id);
      if (!/cancelled/i.test(message)) toast.error(message);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-ink-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">or</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOCIAL_PROVIDERS.map((provider) => {
          const isBusy = busy === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleClick(provider)}
              disabled={disabled || loading || (busy && !isBusy)}
              aria-busy={isBusy}
              aria-describedby="social-login-note"
              title={`${intent} with ${provider.label}`}
              className={cn(
                'group relative inline-flex h-12 items-center justify-center gap-3 overflow-hidden rounded-xl border text-[15px] font-semibold transition-all duration-200',
                'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                provider.id === 'google'
                  ? 'border-ink-200 bg-surface text-ink-900 shadow-soft hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card'
                  : 'border-ink-900 bg-ink-900 text-surface shadow-soft hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-card'
              )}
            >
              {/* soft highlight sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-shine opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" aria-hidden="true" />
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', provider.id === 'google' ? 'bg-surface' : 'text-surface')}>
                {isBusy ? <Spinner size="sm" className={provider.id === 'google' ? 'text-ink-500' : 'text-surface'} /> : ICONS[provider.id]}
              </span>
              <span className="relative">{isBusy ? 'Waiting for ' + provider.label + '…' : `${intent} with ${provider.label}`}</span>
            </button>
          );
        })}
      </div>

      <p id="social-login-note" className="mt-2.5 text-center text-xs text-ink-400" aria-live="polite">
        {notice ?? (loading ? 'Checking sign-in options…' : anyEnabled ? 'A secure popup opens — we never see your password.' : 'Sign in securely with your Google or Apple account.')}
      </p>
    </div>
  );
};

export default SocialLogin;
