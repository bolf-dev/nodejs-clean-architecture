import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConflictError, NotFoundError, ValidationError } from '../../domain/errors.js';

/**
 * Turns every error into a response with the body { "error": "<message>" }.
 * Domain error categories are mapped to their status, unexpected errors become 500 and are logged.
 */
@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, message } = this.toError(exception);
    host.switchToHttp().getResponse<Response>().status(status).json({ error: message });
  }

  private toError(exception: unknown): { status: number; message: string } {
    if (exception instanceof ValidationError) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message };
    }
    if (exception instanceof NotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: exception.message };
    }
    if (exception instanceof ConflictError) {
      return { status: HttpStatus.CONFLICT, message: exception.message };
    }
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), message: exception.message };
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}
