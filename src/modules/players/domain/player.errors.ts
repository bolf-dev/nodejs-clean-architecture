import { ConflictError, ValidationError } from '../../../shared/domain/errors.js';
import type { Nickname } from './nickname.value-object.js';

export class InvalidNickname extends ValidationError {}

export class NicknameAlreadyTaken extends ConflictError {
  constructor(nickname: Nickname) {
    super(`Nickname "${nickname.value}" is already taken`);
  }
}
