import { validateEnvironment } from './environment.js';

const VALID = {
  DATABASE_URL: 'postgresql://app:app@db:5432/app',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnvironment', () => {
  it('accepts a valid configuration and fills in the defaults', () => {
    expect(validateEnvironment(VALID)).toEqual({ ...VALID, PORT: 3000, NODE_ENV: 'development' });
  });

  it.each([
    ['missing', undefined],
    ['shorter than 32 characters', 'a'.repeat(31)],
  ])('refuses to start when JWT_SECRET is %s (T1 of spec 004)', (_, jwtSecret) => {
    expect(() => validateEnvironment({ ...VALID, JWT_SECRET: jwtSecret })).toThrow(
      'JWT_SECRET is required and must be at least 32 characters long',
    );
  });
});
