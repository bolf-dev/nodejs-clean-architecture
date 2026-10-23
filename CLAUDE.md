# CLAUDE.md

F1 Prediction League: a NestJS + PostgreSQL portfolio project showing Clean Architecture, CQRS and ports & adapters, built with spec-driven development.

## Read first

- [docs/constitution.md](docs/constitution.md): rules every change must follow
- [docs/product/mission.md](docs/product/mission.md): what the product is and the game rules
- [docs/product/tech-stack.md](docs/product/tech-stack.md): technologies and open decisions
- [docs/product/roadmap.md](docs/product/roadmap.md): features and their status

## Workflow

Follow the spec-driven workflow from the constitution:

1. Pick the next roadmap item and write `docs/specs/NNN-feature-name/spec.md`. Stop for approval.
2. Write `plan.md` and check it against the constitution. Stop for approval.
3. Write `tasks.md`. Stop for approval.
4. Implement one task at a time, tick it off, keep tests and lint green.
5. Check off the roadmap item.

Never write production code for a feature without an approved spec, plan and task list.

## Commands

Never run `node`, `npm` or `npx` on the host. Use `make` (see `make help`), e.g. `make up`, `make test`, `make test-e2e`, `make lint`, `make npm c="install <package>"`.

## Communication

The project owner is a PHP / Symfony developer new to Node.js. Talk to them in Slovak and explain Node.js and NestJS concepts with Symfony analogies. Code and documentation are in English.
