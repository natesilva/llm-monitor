## 1. Update Comparison Chart Tooltip

- [x] 1.1 In `src/web/static/app.js`, update the `label` callback in the comparison chart tooltip config to extract the config label from `ctx.dataset.label` (strip ` errors` suffix) and prefix it to error messages: `<config label>: Error: <message>` for errors with messages, `<config label>: HTTP <status>` for errors without messages
