/**
 * Error categories of the domain. A domain error extends one of them,
 * and the presentation layer maps each category to an HTTP status.
 */

/** A value breaks a business rule, e.g. an invalid nickname. */
export abstract class ValidationError extends Error {}

/** The action conflicts with existing data, e.g. a taken nickname. */
export abstract class ConflictError extends Error {}

/** A referenced resource does not exist, e.g. an unknown player. */
export abstract class NotFoundError extends Error {}

/** The caller is not authenticated, e.g. wrong login credentials or an invalid access token. */
export abstract class UnauthorizedError extends Error {}
