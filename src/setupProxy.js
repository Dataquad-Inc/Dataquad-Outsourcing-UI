/*
 * Routes API calls to the locally running microservices during development.
 *
 * In production a single origin (https://mymulya.com) fronts every service and
 * dispatches on the path prefix. Locally each service listens on its own port,
 * so this file reproduces that dispatch for the dev server.
 *
 * Only relative request URLs reach this proxy. Components that hardcode the
 * absolute production host bypass it and continue to talk to production.
 *
 * Creating this file disables the "proxy" field in package.json.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

const USER_REGISTER = 'http://localhost:8083';
const CANDIDATE = 'http://localhost:8085';
const HOTLIST = 'http://localhost:8092';
const REQUIREMENTS = 'http://localhost:8222';
const TIMESHEET = 'http://localhost:7071';
const TIMESHEET_US = 'http://localhost:7073';

// No local service implements /api/us/requirements/*. The India requirements
// repos expose an unrelated set of routes (/bdm, /assignJob, /inprogress), so
// forwarding there silently matched /{jobId} and returned misleading 200s.
// These calls go to production until that service is available locally.
const PRODUCTION = 'https://mymulya.com';

const routes = [
  { path: '/users', target: USER_REGISTER },
  { path: '/candidate', target: CANDIDATE },
  { path: '/hotlist', target: HOTLIST },
  { path: '/api/c2c-employers', target: HOTLIST },
  { path: '/requirements', target: REQUIREMENTS },
  { path: '/api/us/timesheet', target: TIMESHEET_US },
  { path: '/timesheet', target: TIMESHEET },
  { path: '/api/us/requirements', target: PRODUCTION },
];

module.exports = function (app) {
  routes.forEach(({ path, target, pathRewrite }) => {
    app.use(
      path,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        logLevel: 'warn',
        onError(err, req, res) {
          console.error(`[proxy] ${req.method} ${req.url} -> ${target}: ${err.message}`);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
          }
          res.end(
            JSON.stringify({
              error: 'Local service unreachable',
              service: target,
              path: req.url,
            })
          );
        },
      })
    );
  });
};
