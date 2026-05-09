.PHONY: bench cron-register cron-unregister cron-status web web-dev test lint fmt typecheck

bench:
	bun run src/bench/index.ts

cron-register:
	bun run src/bench/cron.ts register

cron-unregister:
	bun run src/bench/cron.ts unregister

cron-status:
	bun run src/bench/cron.ts status

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
