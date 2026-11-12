import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';

const input = process.argv[2] || 'index.html';
const wasd = process.argv.includes('--wasd');
const selection = process.argv.includes('--selecao');
const creator = process.argv.includes('--criador');
const menu = process.argv.includes('--menu');
const manual = process.argv.includes('--postos');
const alignment = process.argv.includes('--alinhamento');
const benches = process.argv.includes('--bancadas');
const mapProduct = process.argv.includes('--map');
const checkConsole = mapProduct || wasd || selection || creator || menu || manual || alignment || benches;
const html = await readFile(input);
const tempRoot = resolve(tmpdir());
const profile = await mkdtemp(join(tempRoot, 'virtual-factory-test-'));
const server = createServer((req, res) => {
  const path=resolve(dirname(input),'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!path.startsWith(resolve(dirname(input)))){res.writeHead(403);res.end();return;}
  if(req.url==='/'||req.url==='/index.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
  readFile(path).then(data=>{res.writeHead(200,{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'image/svg+xml'});res.end(data)}).catch(()=>{res.writeHead(404);res.end()});
}).listen(0, '127.0.0.1');
await once(server, 'listening');
const url = process.argv.includes('--file') ? pathToFileURL(input).href : 'http://127.0.0.1:' + server.address().port;
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless', '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--no-proxy-server',
  '--remote-debugging-port=0', '--user-data-dir=' + profile, '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ...(process.env.CHROME_TEST_NO_SANDBOX === '1' ? ['--disable-gpu-sandbox', '--no-sandbox'] : []), 'about:blank'
], { windowsHide: true, stdio: ['ignore','ignore',process.env.TRACE_CDP?'inherit':'ignore'] });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100 && !port; attempt++) {
    await sleep(100);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]; } catch {}
  }
  assert.ok(port, 'Chrome não abriu a porta DevTools');
  const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const page = pages.find(target => target.type === 'page' && target.url === 'about:blank');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', event => reject(new Error(event.message)), { once: true });
  });
  let seq = 0;
  const pending = new Map(), errors = [], events = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      if (!pending.has(message.id)) return;
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description);
    if (checkConsole && message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map(arg => arg.description || arg.value).join(' '));
    }
    if (checkConsole && message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push(message.params.entry.text);
    }
    events.get(message.method)?.(message.params);
  });
  const rawSend = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('DevTools sem resposta: ' + method)); }, 30000);
    if(process.env.TRACE_CDP)console.log(method);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const send = async (method,params={})=>{
    if(method!=='Page.reload')return rawSend(method,params);
    let timer;const loaded=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('Recarga sem load event')),45000);events.set('Page.loadEventFired',()=>{clearTimeout(timer);events.delete('Page.loadEventFired');resolve()})});
    await rawSend(method,params);await loaded;return {};
  };
  const js = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, ms = 12000) => {
    const deadline = Date.now() + ms;
    do {
      if (await js(expression)) return;
      await sleep(80);
    } while (Date.now() < deadline);
    throw new Error('Tempo excedido: ' + expression);
  };
  const boot = async () => {
    try {
      await until('typeof E !== "undefined" && typeof animateLinks === "function" && rd.info.render.frame > 1', 25000);
    } catch (error) {
      const state=await js('JSON.stringify({readyState:document.readyState,three:typeof THREE,editor:typeof E,text:document.body?.innerText.slice(-700)})').catch(()=> 'DevTools indisponível');
      throw new Error(error.message+'\nEstado de inicialização: '+state+'\nExceções/console: '+errors.join('\n'));
    }
  };
  events.set('Page.javascriptDialogOpening', () => void send('Page.handleJavaScriptDialog', { accept: true }));
  socket.addEventListener('close', event => { for (const task of pending.values()) task.reject(new Error('DevTools desconectado ' + event.code)); });
  await send('Page.enable');
  await send('Runtime.enable');
  if (checkConsole) await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1800, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await boot();
  console.log(await js(`JSON.stringify({chrome:navigator.userAgent, three:THREE.REVISION,
    renderer:(()=>{const gl=rd.getContext(),ext=gl.getExtension("WEBGL_debug_renderer_info");
      return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})(),
    areas:AL.length,machines:MS.length})`));
  if (process.env.VF_TEST_SCREENSHOT) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.VF_TEST_SCREENSHOT, Buffer.from(data, 'base64'));
  }
  if (process.argv.includes('--boot-only')) process.exitCode = 0;
  else {
    const { run } = await import(mapProduct ? './regressao-map.mjs' : benches ? './regressao-bancadas.mjs' : alignment ? './regressao-alinhamento.mjs' : manual ? './regressao-postos.mjs' : menu ? './regressao-menu.mjs' : creator ? './regressao-criador.mjs' : selection ? './regressao-selecao.mjs' : wasd ? './regressao-wasd.mjs' : './regressao-cenarios.mjs');
    events.set('Input.dragIntercepted', event => run.onDrag?.(event));
    await run({ assert, send, js, until, boot, sleep, errors });
  }
} finally {
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  server.close();
  await sleep(300);
  if (dirname(profile) === tempRoot && basename(profile).startsWith('virtual-factory-test-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 }).catch(() => {});
  }
}
