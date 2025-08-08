const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
// Handle both PORT 80 and 8080 for Azure compatibility
const port = parseInt(process.env.PORT) || parseInt(process.env.WEBSITES_PORT) || 8080;

console.log(`Server configuration: dev=${dev}, hostname=${hostname}, port=${port}`);
console.log(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, WEBSITES_PORT=${process.env.WEBSITES_PORT}, HOST=${process.env.HOST}`);
console.log(`All env vars:`, Object.keys(process.env).filter(k => k.includes('PORT') || k.includes('HOST')).reduce((acc, k) => ({ ...acc, [k]: process.env[k] }), {}));

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Process ID: ${process.pid}`);
  });
}).catch((ex) => {
  console.error('Failed to start server:', ex);
  process.exit(1);
});
