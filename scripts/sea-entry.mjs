process.env.SUB2SOCKS5_SEA_BOOTSTRAP = '1';

const mod = await import('../src/server.js');
await mod.startServer();
