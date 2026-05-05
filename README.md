# pi-update-adesso

pi extension scaffold for Adesso AI Hub integration.

Commands:
- /update-adesso — update providers/models from hub
- /spend — show Today/MTD spend

Requirements:
- Set ADESSO_API_KEY in environment

Install (local dev):
- Run `npm run build`
- In pi, run `/reload` (if added to ~/.pi/agent/extensions) or `pi -e ./dist/index.js`
