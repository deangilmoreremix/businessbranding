// Serves the production build for the e2e runs (programmatic `next start`, so the process is a plain `node` process).
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const next = require('next');
// log (and survive) stray async failures so one bad request can never take the whole e2e server down; the log lands in <E2E_OUT>/app.log
process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
process.on('uncaughtException', (e) => console.error('uncaughtException', e));
const port = Number(process.argv[2] || 5240);
const app = next({ dev: false, dir: process.cwd() });
const handle = app.getRequestHandler();
await app.prepare();
http.createServer((req, res) => handle(req, res)).listen(port, '127.0.0.1', () => console.log(`e2e app server on ${port}`));
