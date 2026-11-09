import { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import type { Password } from '../../domain/password.value-object.js';

/** PasswordHasher adapter for unit tests: fast and readable, never used outside tests. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(password: Password): Promise<string> {
    return `hashed:${password.reveal()}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}
