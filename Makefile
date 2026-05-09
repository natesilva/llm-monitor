.PHONY: bench bench-setup web test fmt typecheck

bench:
	bun run src/bench/index.ts

bench-setup:
	bun run src/bench/setup-cron.ts

web:
	bun run src/web/index.ts

test:
	bun test

fmt:
	npx prettier --write "src/**/*.ts" "src/**/*.js"

typecheck:
	bunx tsc --noEmit
