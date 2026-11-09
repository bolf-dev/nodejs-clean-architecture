import { ValidationError } from '../../../shared/domain/errors.js';

export class InvalidDriverCode extends ValidationError {
  constructor(code: string) {
    super(`Driver code "${code}" must be 1 to 3 upper case letters`);
  }
}
