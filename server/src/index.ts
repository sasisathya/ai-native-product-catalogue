import { createApp } from './app.js';
import { loadConfig } from './config/config.js';

const config = loadConfig();
const server = createApp({ config }).listen(config.port, '0.0.0.0', () => {
  console.info(`Product catalogue listening on 0.0.0.0:${config.port}`);
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Received ${signal}; closing HTTP server`);

  const forceClose = setTimeout(() => {
    console.error('Graceful shutdown timed out; closing remaining connections');
    server.closeAllConnections();
  }, 10_000);
  forceClose.unref();

  server.close((error) => {
    clearTimeout(forceClose);
    if (error) {
      console.error('HTTP server shutdown failed', error.message);
      process.exitCode = 1;
      return;
    }
    console.info('HTTP server closed');
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
server.on('error', (error) => {
  console.error('HTTP server failed', error.message);
  process.exitCode = 1;
});
