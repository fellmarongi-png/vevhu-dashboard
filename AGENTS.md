# Vevhu Web Dashboard — Agent Rules

## Mandatory Rules for All Agents

1. **Worker PIN Hashing**: All worker creation and PIN updates in the web dashboard MUST generate `pin_hash = bcrypt.hashSync(values.pin, 10)` in pure JavaScript (`bcryptjs`) so the mobile app's `worker-auth` Edge Function can authenticate workers.
2. **MANDATORY AUTO-PUSH & VERIFICATION RULE**: After ANY code or configuration changes, ALWAYS run Biome / linter and type checks (`npx @biomejs/biome check`, `npm run build`) to verify 100% accuracy, then immediately git commit and `git push` to GitHub (`fellmarongi-png/vevhu-dashboard`).
