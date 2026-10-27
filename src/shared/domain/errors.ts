/**
 * Error categories of the domain. A domain error extends one of them,
 * and the presentation layer maps each category to an HTTP status.
 */

/** A value breaks a business rule, e.g. an invalid nickname. */
export abstract class ValidationError extends Error {}

/** The action conflicts with existing data, e.g. a taken nickname. */
export abstract class ConflictError extends Error {}
