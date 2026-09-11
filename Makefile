# HRMS dev convenience commands (Windows + Unix friendly via npm scripts)

.PHONY: install dev dev-web dev-server build test typecheck migrate seed up down

install:
	npm install --workspaces

dev:
	@echo "Run in two terminals: 'make dev-server' and 'make dev-web'"

dev-server:
	npm run dev:server

dev-web:
	npm run dev:web

build:
	npm run build

test:
	npm test

typecheck:
	npm run typecheck

migrate:
	cd apps/server && npx prisma migrate dev

seed:
	cd apps/server && npx prisma db seed

infra:
	docker compose up -d postgres redis minio rabbitmq

up:
	docker compose --profile full up --build

down:
	docker compose down
