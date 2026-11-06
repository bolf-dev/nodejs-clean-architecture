import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import type { Password } from '../../domain/password.value-object.js';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const ALGORITHM = 'scrypt';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * PasswordHasher with scrypt from node:crypto, a slow and salted password hashing function.
 * The stored hash is `scrypt$<salt>$<key>`, both in base64.
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: Password): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scryptAsync(password.reveal(), salt, KEY_LENGTH);
    return [ALGORITHM, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, salt, key] = hash.split('$');
    if (algorithm !== ALGORITHM || salt === undefined || key === undefined) {
      return false;
    }
    const expected = Buffer.from(key, 'base64');
    const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length);
    // Constant-time comparison, so the time of a failed check reveals nothing about the hash
    return timingSafeEqual(actual, expected);
  }
}
