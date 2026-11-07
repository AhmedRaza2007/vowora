import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema } from './auth';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    fullName: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: 'supersecret',
    confirmPassword: 'supersecret',
  };

  it('accepts matching passwords of sufficient length', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a short password', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' }).success).toBe(false);
  });

  it('rejects mismatched passwords on the confirmPassword path', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'different' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
});

describe('resetPasswordSchema', () => {
  it('requires matching passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: 'longenough', confirmPassword: 'longenough' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: 'longenough', confirmPassword: 'nope' }).success).toBe(false);
  });
});