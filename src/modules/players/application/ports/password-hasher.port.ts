import type { Password } from '../../domain/password.value-object.js';

/** Port for hashing passwords and checking them against a stored hash, implemented in infrastructure. */
export abstract class PasswordHasher {
  /** A salted hash of the password, safe to store (R6 of spec 004). */
  abstract hash(password: Password): Promise<string>;

  /** Whether the plain password matches the stored hash. */
  abstract verify(password: string, hash: string): Promise<boolean>;
}
