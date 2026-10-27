import { BadRequestException, Injectable, ValidationPipe } from '@nestjs/common';

/**
 * Validates every request DTO. Unknown fields are removed, and the error message
 * is the first broken constraint, e.g. "nickname must be a string".
 */
@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const message = Object.values(errors[0]?.constraints ?? {})[0] ?? 'Invalid request';
        return new BadRequestException(message);
      },
    });
  }
}
