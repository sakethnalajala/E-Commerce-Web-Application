import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, issuer: 'ecommerce-api' }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.secret, { issuer: 'ecommerce-api' });

/**
 * Password-reset tokens: the raw token is emailed to the user, only its SHA-256
 * digest is stored. A leaked database therefore cannot be used to reset accounts.
 */
export const createPasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + env.passwordReset.expiresInMinutes * 60 * 1000);
  return { rawToken, hashedToken, expiresAt };
};

export const hashResetToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');
