import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import net from 'node:net';

export class SingBoxManager {
  constructor() {
    this.process = null;
    this.logs = [];
    this.state = 'stopped';
  }

  async start(binaryPath, configPath) {
    await access(binaryPath);
    if (this.process) {
      await this.stop();
    }

    return new Promise((resolve, reject) => {
      const child = spawn(binaryPath, ['run', '-c', configPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.process = child;
      this.state = 'starting';

      child.stdout.on('data', (data) => this.pushLog(data.toString()));
      child.stderr.on('data', (data) => this.pushLog(data.toString()));

      child.once('spawn', async () => {
        try {
          await waitForController('127.0.0.1', 19090, 8000);
          this.state = 'running';
          resolve();
        } catch (error) {
          this.state = 'running';
          resolve();
        }
      });

      child.once('error', (error) => {
        this.state = 'error';
        this.process = null;
        reject(error);
      });

      child.once('exit', (code) => {
        this.pushLog(`sing-box exited with code ${code}`);
        this.state = 'stopped';
        this.process = null;
      });
    });
  }

  async stop() {
    if (!this.process) {
      this.state = 'stopped';
      return;
    }

    const current = this.process;
    return new Promise((resolve) => {
      current.once('exit', () => resolve());
      current.kill();
    });
  }

  getStatus() {
    return {
      state: this.state,
      running: Boolean(this.process),
      logs: this.logs.slice(-200)
    };
  }

  pushLog(message) {
    const lines = message.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      this.logs.push(`${new Date().toISOString()} ${line}`);
    }
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
}

async function waitForController(host, port, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ready = await canConnect(host, port);
    if (ready) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`controller ${host}:${port} not ready within ${timeoutMs}ms`);
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}
