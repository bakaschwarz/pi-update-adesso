# @bakaschwarz/pi-update-adesso

pi extension for syncing providers/models from the Adesso AI Hub and viewing usage spend.

## Commands

- `/update-adesso` — sync providers/models from the Adesso AI Hub to `~/.pi/agent/models.json`
- `/update-adesso --dry-run` — preview changes without writing
- `/spend` — show Today and MTD spend (UTC time windows)

## Requirements

- Set `ADESSO_API_KEY` in environment

## Installation

```bash
pi install npm:@bakaschwarz/pi-update-adesso
```

## Local Development

```bash
npm install
npm run build    # compile TypeScript
npm test         # run tests
```

Then in pi, run `/reload` (if added to `~/.pi/agent/extensions`) or `pi -e ./update-adesso/index.ts`
