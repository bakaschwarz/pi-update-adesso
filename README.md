# pi-update-adesso

pi extension for syncing providers/models from the Adesso AI Hub and viewing usage spend.

Commands:
- `/update-adesso` — sync providers/models from the Adesso AI Hub to `~/.pi/agent/models.json`
- `/update-adesso --dry-run` — preview changes without writing
- `/spend` — show Today and MTD spend (UTC time windows)

Requirements:
- Set ADESSO_API_KEY in environment

Install (local dev):
- In pi, run `/reload` (if added to `~/.pi/agent/extensions`) or `pi -e ./src/index.ts`
