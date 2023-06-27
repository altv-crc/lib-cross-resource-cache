import * as crypto from 'crypto';
import sjcl from 'sjcl';

/**
 * Hash a plain text password with pbkdf2 hash and salt.
 *
 * Returns a pbkdf2 key, and salt. Which can be seperated by the `$` sign.
 *
 * ```ts
 * const result = crc.utility.crypto.hashPassword('somePassword');
 * ```
 *
 * @param  {string} plainTextPassword
 * @returns {string}
 */
export function create(plainTextPassword: string): string {
    const saltBits = sjcl.random.randomWords(128, 0);
    const salt = sjcl.codec.base64.fromBits(saltBits);
    const key = sjcl.codec.base64.fromBits(sjcl.misc.pbkdf2(plainTextPassword, saltBits, 2000, 256));
    return `${key}$${salt}`;
}

/**
 * Test a plain text password against a stored pbkdf2 string.
 *
 * ```ts
 * const result = crc.utility.crypto.checkPassword('somePassword', someStoredHash);
 * ```
 *
 * @param  {string} plainTextPassword
 * @param  {string} pbkdf2Hash
 * @returns {boolean}
 */
export function check(plainTextPassword: string, pbkdf2Hash: string): boolean {
    const [_key, _salt] = pbkdf2Hash.split('$');
    const saltBits = sjcl.codec.base64.toBits(_salt);
    const derivedKey = sjcl.misc.pbkdf2(plainTextPassword, saltBits, 2000, 256);
    const derivedBaseKey = sjcl.codec.base64.fromBits(derivedKey);
    return _key === derivedBaseKey;
}
