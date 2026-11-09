import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import type { Password } from '../../domain/password.value-object.js';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const ALGORITHM = 'scrypt';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
// Cost settings for new hashes. They are stored in every hash, so raising them later keeps old hashes working.
const COST = { N: 16384, r: 8, p: 1 };

/**
 * PasswordHasher with scrypt from node:crypto, a slow and salted password hashing function.
 * The stored hash is `scrypt$N=16384,r=8,p=1$<salt>$<key>`, salt and key in base64.
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: Password): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scryptAsync(password.reveal(), salt, KEY_LENGTH, COST);
    const cost = `N=${COST.N},r=${COST.r},p=${COST.p}`;
    return [ALGORITHM, cost, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, cost, salt, key] = hash.split('$');
    const options = parseCost(cost);
    if (algorithm !== ALGORITHM || options === null || salt === undefined || key === undefined) {
      return false;
    }
    const expected = Buffer.from(key, 'base64');
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, options);
    // Constant-time comparison, so the time of a failed check reveals nothing about the hash
    return timingSafeEqual(actual, expected);
  }
}

/** `N=16384,r=8,p=1` → scrypt options, or null when the part is missing or malformed. */
function parseCost(cost: string | undefined): ScryptOptions | null {
  const match = cost?.match(/^N=(\d+),r=(\d+),p=(\d+)$/);
  return match ? { N: Number(match[1]), r: Number(match[2]), p: Number(match[3]) } : null;
}
