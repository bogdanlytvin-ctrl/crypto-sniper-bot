const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);

// Ignore SIGHUP to survive shell exit
process.on('SIGHUP', () => {});
process.on('SIGPIPE', () => {});

const app = next({ dev: false, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} already in use, retrying in 2s...`);
      setTimeout(() => {
        server.close();
        server.listen(port, '0.0.0.0');
      }, 2000);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log('> SecureScope ready on http://0.0.0.0:' + port);
  });
}).catch(err => {
  console.error('Prepare error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (err.code !== 'EADDRINUSE') {
    console.error('Uncaught:', err.message);
  }
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
