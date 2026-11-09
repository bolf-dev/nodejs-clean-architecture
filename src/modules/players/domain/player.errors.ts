import { ConflictError, ValidationError } from '../../../shared/domain/errors.js';
import type { Email } from './email.value-object.js';
import type { Nickname } from './nickname.value-object.js';

export class InvalidNickname extends ValidationError {}

export class InvalidEmail extends ValidationError {}

export class InvalidPassword extends ValidationError {}

export class NicknameAlreadyTaken extends ConflictError {
  constructor(nickname: Nickname) {
    super(`Nickname "${nickname.value}" is already taken`);
  }
}

export class EmailAlreadyRegistered extends ConflictError {
  constructor(email: Email) {
    super(`Email "${email.value}" is already registered`);
  }
}
