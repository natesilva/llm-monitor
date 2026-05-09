.PHONY: bench bench-setup web web-dev test lint fmt typecheck

bench:
	bun run src/bench/index.ts

bench-setup:
	bun run src/bench/setup-cron.ts

web:
	bun run src/web/index.ts

web-dev:
	bun --hot src/web/index.ts

test:
	bun test

lint:
	bunx biome check src/

fmt:
	bunx biome check --write src/

typecheck:
	bunx tsc --noEmit
