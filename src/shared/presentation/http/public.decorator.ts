import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marks an endpoint that needs no access token. Every other endpoint requires one (R10 of spec 004). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
