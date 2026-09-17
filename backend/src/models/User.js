import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ROLES } from '../utils/constants.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    addressLine: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      // Accounts created through Google/Apple have no local password until
      // the user sets one via the reset flow.
      required: [
        function passwordRequired() {
          return this.authProvider === 'local';
        },
        'Password is required',
      ],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned unless explicitly requested
    },
    /** How the account was created; social accounts can still add a password later. */
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    /** Stable subject IDs from the identity providers, used to match returning users. */
    googleId: { type: String, index: true, sparse: true },
    appleId: { type: String, index: true, sparse: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    // Security fields — stripped from every API response by toJSON below.
    passwordChangedAt: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('isAdmin').get(function isAdmin() {
  return this.role === ROLES.ADMIN;
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);

  // 1s backdate guards against the token being issued in the same millisecond.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);

  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  // Social-only accounts have no hash to compare against.
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

/** True when the account can sign in with an email + password. */
userSchema.virtual('hasPassword').get(function hasPassword() {
  // `password` is select:false, so this is only meaningful when it was selected.
  return Boolean(this.password);
});

/**
 * True when the password changed after the JWT was issued, which invalidates
 * every token minted before the change.
 */
userSchema.methods.passwordChangedAfter = function passwordChangedAfter(jwtIssuedAtSeconds) {
  if (!this.passwordChangedAt) return false;
  const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedAtSeconds > jwtIssuedAtSeconds;
};

const User = mongoose.model('User', userSchema);

export default User;
