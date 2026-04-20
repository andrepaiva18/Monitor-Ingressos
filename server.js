const http = require('http');
const { HOST, PORT } = require('./src/config');
const { nowLabel } = require('./src/utils');
const { loadState, setAppState } = require('./src/state');
const { requestHandler, sendText } = require('./src/routes');
const { MonitorWorker, setStopRequested } = require('./src/monitor');

async function main() {
  setAppState(await loadState());

  const server = http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      console.error(`[${nowLabel()}] Erro na requisicao:`, error);
      sendText(res, 500, 'Erro interno');
    });
  });

  const worker = new MonitorWorker();

  const shutdown = async () => {
    setStopRequested(true);
    server.close();
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(PORT, HOST, () => {
    console.log(`[${nowLabel()}] Web app rodando em http://${HOST}:${PORT}`);
  });

  await worker.start();
}

main().catch((error) => {
  console.error(`[${nowLabel()}] Falha fatal:`, error);
  process.exit(1);
});
