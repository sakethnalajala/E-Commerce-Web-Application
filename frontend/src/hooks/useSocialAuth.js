import { useCallback, useState } from 'react';
import { authApi } from '@/api';
import useApiResource from '@/hooks/useApiResource';
import useAuth from '@/hooks/useAuth';

const GOOGLE_SDK = 'https://accounts.google.com/gsi/client';
const APPLE_SDK = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

/** Loads a third-party SDK once; resolves when its global is ready. */
const loadScript = (src, isReady) =>
  new Promise((resolve, reject) => {
    if (isReady()) return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    const script = existing ?? Object.assign(document.createElement('script'), { src, async: true, defer: true });
    const onLoad = () => (isReady() ? resolve() : reject(new Error('Sign-in SDK failed to initialise.')));
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('Could not load the sign-in SDK. Check your connection.')), { once: true });
    if (!existing) document.head.appendChild(script);
    return undefined;
  });

/**
 * Real Google / Apple sign-in for the storefront.
 *
 *  - Google: the Identity Services popup *code* flow. The browser gets a
 *    one-time authorization code and posts it to /auth/google, where the
 *    server exchanges it (with the client secret) and verifies the ID token.
 *  - Apple: Sign in with Apple JS popup. The identity token Apple returns is
 *    posted to /auth/apple and verified against Apple's public keys.
 *
 * Neither flow puts a secret in the browser; the server decides who is who.
 * `providers` tells the UI which flows are actually configured.
 */
const useSocialAuth = () => {
  const { loginWithProvider } = useAuth();
  const providers = useApiResource(() => authApi.providers(), []);
  const [busy, setBusy] = useState(null);

  const google = providers.data?.google;
  const apple = providers.data?.apple;

  const signInWithGoogle = useCallback(async () => {
    if (!google?.enabled) throw new Error('Google sign-in is not configured on this server.');
    await loadScript(GOOGLE_SDK, () => Boolean(window.google?.accounts?.oauth2));

    const payload = await new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: google.clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        callback: (response) => {
          if (response?.code) resolve({ code: response.code });
          else reject(new Error(response?.error_description || 'Google sign-in was cancelled.'));
        },
        error_callback: (error) => {
          const cancelled = error?.type === 'popup_closed' || error?.type === 'popup_failed_to_open';
          reject(new Error(cancelled ? 'Google sign-in was cancelled.' : error?.message || 'Google sign-in failed.'));
        },
      });
      client.requestCode();
    });

    return loginWithProvider('google', payload);
  }, [google, loginWithProvider]);

  const signInWithApple = useCallback(async () => {
    if (!apple?.enabled) throw new Error('Apple sign-in is not configured on this server.');
    await loadScript(APPLE_SDK, () => Boolean(window.AppleID?.auth));

    window.AppleID.auth.init({
      clientId: apple.clientId,
      scope: 'name email',
      redirectURI: apple.redirectUri,
      usePopup: true,
    });

    let result;
    try {
      result = await window.AppleID.auth.signIn();
    } catch (error) {
      const cancelled = error?.error === 'popup_closed_by_user' || error?.error === 'user_cancelled_authorize';
      throw new Error(cancelled ? 'Apple sign-in was cancelled.' : 'Apple sign-in failed. Please try again.');
    }

    return loginWithProvider('apple', {
      identityToken: result?.authorization?.id_token,
      // Apple only includes the name on the first authorisation.
      user: result?.user ? { name: result.user.name } : undefined,
    });
  }, [apple, loginWithProvider]);

  /** Runs the provider flow with a busy flag so buttons can show progress. */
  const signIn = useCallback(
    async (providerId) => {
      if (busy) return null;
      setBusy(providerId);
      try {
        return await (providerId === 'google' ? signInWithGoogle() : signInWithApple());
      } finally {
        setBusy(null);
      }
    },
    [busy, signInWithGoogle, signInWithApple]
  );

  return {
    providers: providers.data,
    loading: providers.loading,
    error: providers.error,
    busy,
    signIn,
  };
};

export default useSocialAuth;
