# Constitution

Non-negotiable rules of this project. Every spec, plan and change is checked against them. When a plan needs to break a rule, the rule is changed here first, explicitly, or the plan changes.

The architecture combines **Clean / Hexagonal / Onion architecture**, **Domain-Driven Design** and **CQRS** the way they are commonly applied in NestJS.

## 1. Spec-driven workflow

1. No production code without an approved spec, plan and task list for it.
2. Every feature lives in `docs/specs/NNN-feature-name/`, with `NNN` matching its item in [roadmap.md](product/roadmap.md):
   - `spec.md`: **what** and **why**. User stories, business rules, acceptance criteria, API contract. No implementation details.
   - `plan.md`: **how**. Affected modules and files per layer, database changes, ports and adapters, test strategy. Checked against this constitution.
   - `tasks.md`: ordered, small, verifiable steps with checkboxes
3. Each document is approved by the project owner before the next one is written: spec → plan → tasks → implementation.
4. Implementation follows `tasks.md` one task at a time and ticks tasks off as they are done.
5. When behavior has to change, the spec changes first, then the code.
6. A feature is done when all tasks are ticked, tests and lint pass, and the roadmap item is checked off.

## 2. Modules

- The application is a **modular monolith**. Every bounded context is a NestJS module in `src/modules/<context>/`, e.g. `players`, `seasons`, `predictions`.
- Code shared by all modules (base classes for aggregates and domain events, the `Clock` port, the exception filter, database setup) lives in `src/shared/`, split into the same layers.
- A module uses another module only through its public API: commands, queries and domain events. It never imports another module's domain, infrastructure or presentation code.

## 3. Layers

Every module is split into four layers. Dependencies point inwards only: presentation and infrastructure → application → domain.

| Layer            | Contains                                                                                                  | May depend on                                                     |
|------------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `domain`         | Aggregates, entities, value objects, domain events, domain errors, domain services, repository ports      | `shared/domain` only                                              |
| `application`    | Command and query handlers, event handlers, ports for external services and read models, read model types | `domain`, `@nestjs/common` (dependency injection), `@nestjs/cqrs` |
| `infrastructure` | Adapters implementing ports: repositories, ORM mapping, mappers, read model queries, HTTP clients, clock  | `application`, `domain`, any library                              |
| `presentation`   | HTTP controllers, request and response DTOs                                                               | `application`, NestJS, validation library                         |

- `domain` is plain TypeScript. It imports no framework, no ORM and no other third-party library, and it does not know how it is persisted.
- `application` uses NestJS only for dependency injection and CQRS. It imports no ORM, no HTTP client and nothing from Express.
- `presentation` talks to the application only through the command bus and the query bus. It never imports infrastructure.
- The module class (`<context>.module.ts`) is the composition root. It is the only place that binds ports to adapters.
- These rules are enforced by an automated check in lint, not only by review.

## 4. Ports and adapters

- Handlers depend only on ports, never on their implementations.
- Ports are **abstract classes** without implementation, used directly as dependency injection tokens. TypeScript interfaces disappear at runtime, so they cannot be tokens without an extra `@Inject()` token.
- Repository ports belong to the domain, one repository per aggregate. Ports for external services and read models belong to the application.
- Adapters implement ports with `implements` and live in `infrastructure`.
- Every port has an in-memory or fake adapter for tests.

## 5. CQRS

- Commands, queries and events are dispatched through `@nestjs/cqrs` (`CommandBus`, `QueryBus`, `EventBus`). Each command and each query has exactly one handler.
- **Commands** change state: load an aggregate through its repository, call a domain method, save the aggregate. A command returns nothing or the identifier of the created resource.
- **Queries** never load aggregates or call repositories. They read through read model ports that return flat, serializable read models and may use plain SQL.
- One command changes one aggregate. Reactions in other aggregates or modules happen in event handlers.
- Write side and read side share the same database. Separate read storage is introduced only when a spec asks for it.

## 6. Domain model

- Business rules live in the domain, not in controllers, handlers or SQL.
- An aggregate is a consistency boundary. It references other aggregates by id only.
- Aggregates, entities and value objects are always valid. Invalid state is rejected in factory methods and constructors.
- State changes through intention-revealing methods (`register`, `submitPrediction`, `finish`), not through setters.
- Value objects are immutable and compared by value.
- Aggregates record domain events. Events are published after the aggregate has been saved.
- The domain never reads the current time or generates identifiers itself. Both are passed in by the application.
- Persistence mapping (ORM schema) lives in infrastructure. Mappers convert between the domain model and the persistence model.

## 7. API conventions

- All endpoints are under `/v1` and use JSON.
- Request DTOs validate the **shape** of a request (required fields, types) with the global validation pipe. **Business rules** are enforced by the domain. A business rule is never only in a DTO.
- Responses are response DTOs, never domain objects.
- Errors are returned as `{ "error": "<message>" }`. A global exception filter maps errors to status codes:

| Status | When                                                                        |
|--------|-----------------------------------------------------------------------------|
| 400    | Invalid request shape, or a value rejected by a value object                |
| 404    | A referenced resource does not exist                                        |
| 409    | Conflict with existing data, e.g. a unique value is taken                   |
| 422    | A business rule prevents the action                                         |

- Unexpected errors return 500 without internal details.

## 8. Testing

- Every business rule has a unit test of the domain, without NestJS.
- Every handler has a unit test with in-memory and fake adapters.
- Every endpoint has a functional test running against a real PostgreSQL database.
- Tests never call external services. External APIs are replaced by fake adapters with recorded fixtures.
- Time-dependent behavior is tested with a fixed clock.

## 9. Tooling

- Everything runs in Docker. Nothing besides Docker and `make` is required or used on the host.
- Commands are run through `make` targets. A new recurring command gets a new target.
- A new runtime dependency is recorded in [tech-stack.md](product/tech-stack.md) with the reason it was added.
- Code, comments, documentation and commit messages are in English.

## Amendments

Changes to this document are explicit decisions of the project owner and are listed here with their date.

- 2026-10-23: initial version
