export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

RUN := docker compose run --rm --no-deps app
RUN_WITH_DB := docker compose run --rm app

.PHONY: help init up down restart logs install npm migration migrate migrate-down test test-e2e lint format shell psql prod-build

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

init: install up migrate ## First-time setup: build image, install dependencies, start the app, migrate the database

up: ## Start the app on http://localhost:3000 (with PostgreSQL)
	docker compose up -d --build

down: ## Stop the app
	docker compose down

restart: down up ## Restart the app

logs: ## Follow app logs
	docker compose logs -f app

install: ## Install npm dependencies from package-lock.json
	docker compose build app
	$(RUN) npm ci

npm: ## Run any npm command, e.g. make npm c="install @nestjs/config"
	$(RUN) npm $(c)

migration: ## Create a migration from the difference between the mapping and the database
	$(RUN_WITH_DB) npx mikro-orm migration:create

migrate: ## Apply pending migrations
	$(RUN_WITH_DB) npx mikro-orm migration:up

migrate-down: ## Revert the last migration
	$(RUN_WITH_DB) npx mikro-orm migration:down

test: ## Run unit tests
	$(RUN) npm test

test-e2e: ## Run e2e tests
	$(RUN) npm run test:e2e

lint: ## Lint the code
	$(RUN) npm run lint

format: ## Format the code
	$(RUN) npm run format

shell: ## Open a shell in the app container
	$(RUN) sh

psql: ## Open psql in the running database container
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

prod-build: ## Build the production image
	docker build --target production -f .docker/Dockerfile -t nodejs-clean-architecture .
