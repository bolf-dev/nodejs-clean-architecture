let counter = 0;

/**
 * A valid registration body for POST /v1/players. Every call gets its own email,
 * so tests about nicknames never collide on the email. `overrides` replaces any field.
 */
export function registration(nickname: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  counter += 1;
  return { email: `player${counter}@example.com`, nickname, password: 'correct-horse', ...overrides };
}
