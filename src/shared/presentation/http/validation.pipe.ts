import { BadRequestException, Injectable, ValidationPipe, type ValidationError } from '@nestjs/common';

/**
 * Validates every request DTO. Unknown fields are removed, and the error message
 * is the first broken constraint, e.g. "nickname must be a string", or "race.p1 must be a string" in a nested object.
 */
@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(firstMessage(errors) ?? 'Invalid request'),
    });
  }
}

/** The first broken constraint, searching nested objects; their messages get the path of the parent, e.g. "race.". */
function firstMessage(errors: ValidationError[], path = ''): string | undefined {
  for (const error of errors) {
    const message = Object.values(error.constraints ?? {})[0];
    if (message !== undefined) {
      return `${path}${message}`;
    }
    const nested = firstMessage(error.children ?? [], `${path}${error.property}.`);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}
