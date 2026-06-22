const http = require('node:http');
const { spawn } = require('node:child_process');

const host = '127.0.0.1';
const port = 4200;
const baseUrl = `http://${host}:${port}`;
const nodeBin = process.execPath;
const playwrightBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const server = spawn(
  nodeBin,
  ['./node_modules/@angular/cli/bin/ng.js', 'serve', '--host', host, '--port', String(port)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

server.stdout.on('data', (chunk) => process.stdout.write(chunk));
server.stderr.on('data', (chunk) => process.stderr.write(chunk));

let serverExited = false;
server.on('exit', (code, signal) => {
  serverExited = true;
  if (code !== null && code !== 0) {
    console.error(`E2E dev server exited with code ${code}.`);
  }
  if (signal) {
    console.error(`E2E dev server exited via ${signal}.`);
  }
});

process.on('exit', () => stopServer());
process.on('SIGINT', () => {
  stopServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(143);
});

run().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});

async function run() {
  await waitForServer();

  const exitCode = await runPlaywright();
  stopServer();
  process.exit(exitCode);
}

function waitForServer() {
  const deadline = Date.now() + 120_000;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (serverExited) {
        reject(new Error('E2E dev server stopped before it became reachable.'));
        return;
      }

      requestRoot()
        .then(resolve)
        .catch((error) => {
          if (Date.now() >= deadline) {
            reject(error);
            return;
          }

          setTimeout(attempt, 1000);
        });
    };

    attempt();
  });
}

function requestRoot() {
  return new Promise((resolve, reject) => {
    const request = http.get(baseUrl, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode < 500) {
        resolve();
      } else {
        reject(new Error(`E2E dev server returned HTTP ${response.statusCode}.`));
      }
    });

    request.setTimeout(3000, () => {
      request.destroy(new Error('Timed out waiting for E2E dev server.'));
    });
    request.on('error', reject);
  });
}

function runPlaywright() {
  return new Promise((resolve) => {
    const child = spawn(playwrightBin, ['playwright', 'test'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: process.env.CI ?? '1',
        PLAYWRIGHT_SKIP_WEB_SERVER: '1',
      },
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function stopServer() {
  if (!serverExited) {
    server.kill();
  }
}
