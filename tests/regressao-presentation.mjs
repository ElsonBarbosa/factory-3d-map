import {mkdir, writeFile} from 'node:fs/promises';
export async function run({assert, send, js, until, boot, sleep, errors}) {
  const paint = () => js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const click = async selector => {
    await paint();
    const [x,y] = await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Encoberto: '+${JSON.stringify(selector)});return[x,y]})()`);
    for (const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
  };
  const capture = async name => {await paint();const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile('evidence/presentation-'+name+'.png',Buffer.from(data,'base64'))};
  const key = async (name,code,vk) => {for(const type of ['rawKeyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:name,code,windowsVirtualKeyCode:vk})};
  const stop = async () => {await click('#presentationExit');await until('!factoryPresentation.active && !factoryPresentation.restoring')};
  const reload = async () => {await send('Page.reload');await boot();await until('!!window.factoryPresentation')};
  const pose = () => js('[...cam.t.toArray(),cam.d,cam.th,cam.ph,...goal.t.toArray(),goal.d,cam3.far]');
  const fit = () => js(`(()=>{const s=factoryPresentation.scenes[factoryPresentation.index];return s.corners.every(p=>{const v=p.clone().project(cam3);return Math.abs(v.x)<.92&&Math.abs(v.y)<.88&&v.z>-1&&v.z<1})})()`);
  const denyFullscreen = () => js('document.querySelector(".app").requestFullscreen=()=>Promise.reject(new Error("Negado para testar fallback"));void 0');
  const storage = () => js('JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))');
  await mkdir('evidence',{recursive:true});
  await until('!!window.factoryPresentation');await denyFullscreen();
  await js('setEdit(true);openEditorTool("machines");E.machineSelected="SPI-01";drawEditor();cam.t.set(2,0,-3);goal.t.copy(cam.t);cam.d=goal.d=75;cam.th=8*Math.PI+.3;cam.ph=.72;saveLayout()');
  await js('document.getElementById("edEditName").value="Nome ainda em edição"');
  await paint();const before=await pose(),beforeStorage=await storage();
  await click('#presentationStart');await until('factoryPresentation.active');
  assert.equal(await js('factoryPresentation.scenes[0].kind'),'process');
  assert.ok(await fit());
  assert.ok(await js(`getComputedStyle(editorDrawer).display==='none'&&getComputedStyle(document.querySelector('.map-tools')).display==='none'&&getComputedStyle(panel).display==='none'&&getComputedStyle(document.querySelector('.production-strip')).display==='none'&&stage.clientWidth===innerWidth&&stage.clientHeight===innerHeight`));
  await capture('process');await click('#presentationPause');assert.ok(await js('factoryPresentation.paused'));
  const paused=await pose();await key('w','KeyW',87);await key('Delete','Delete',46);await sleep(180);await paint();
  assert.deepEqual(await pose(),paused);assert.ok(await js('!!M["SPI-01"]'));
  assert.equal(await storage(),beforeStorage);
  await click('#presentationNext');assert.equal(await js('factoryPresentation.scenes[factoryPresentation.index].kind'),'area');assert.ok(await fit());
  await capture('area');await click('#presentationNext');assert.equal(await js('factoryPresentation.scenes[factoryPresentation.index].kind'),'equipment');assert.ok(await fit());
  assert.ok(await js('sc.getObjectByName("presentation-highlight").children.length>0'));
  await capture('equipment');
  await click('#presentationPause');
  const playback=await js(`(()=>{const p=factoryPresentation,seen=[],issues=[];let t=performance.now();p.navigate(0);for(let i=0;i<4000&&!p.finished;i++){t+=100;p.update(t);const scene=p.scenes[p.index];if(!seen.includes(p.index))seen.push(p.index);if(cam3.position.y<p.safeHeight-1e-7)issues.push('altitude');if(p.phase==='hold'&&!scene.corners.every(c=>{const v=c.clone().project(cam3);return Math.abs(v.x)<.92&&Math.abs(v.y)<.88&&v.z>-1&&v.z<1}))issues.push('corte:'+p.index)}return{seen,issues,count:p.scenes.length,finished:p.finished,paused:p.paused,order:p.scenes.map(s=>[s.kind,s.object?.id||null])}})()`);
  assert.deepEqual(playback.issues,[]);assert.equal(playback.seen.length,playback.count);assert.ok(playback.finished&&playback.paused);
  const expected=await js(`[['process',null],...AL.flatMap(a=>[['area',a.id],...a.ms.map(m=>['equipment',m.id])]),['process',null]]`);
  assert.deepEqual(playback.order,expected);
  await click('#presentationPause');assert.equal(await js('factoryPresentation.index'),0);assert.ok(await js('!factoryPresentation.finished&&!factoryPresentation.paused'));
  await key('Escape','Escape',27);await until('!factoryPresentation.restoring');await paint();
  assert.deepEqual(await pose(),before);assert.equal(await storage(),beforeStorage);
  assert.ok(await js('E.on&&E.mode==="machines"&&E.machineSelected==="SPI-01"&&machineOutline.parent===M["SPI-01"].mesh'));
  assert.equal(await js('document.getElementById("edEditName").value'),'Nome ainda em edição');
  console.log('OK  partida direta, fallback de tela cheia, isolamento de edição, todas as cenas automáticas e restauração exata');

  const data={version:3,blank:true,processReady:true,processName:'Unidade deslocada',process:{x:210,z:-155,w:150,d:80},areas:[{id:'custom-1',n:'Célula real',x:200,z:-155,w:50,d:40,hue:150,custom:true},{id:'custom-2',n:'Área vazia',x:255,z:-155,w:20,d:40,hue:35,custom:true}],machines:[{id:'RF-REAL',n:'Forno rotacionado',a:'custom-1',dx:0,dz:0,w:8,h:2.4,d:4,rot:1,kind:'RF'},{id:'TST-REAL',n:'Teste manual',a:'custom-1',dx:12,dz:8,w:5,h:2.3,d:5,rot:3,kind:'TST',station:true,side:1,manualType:'test',lineRot:3}],links:[]};
  await js(`localStorage.setItem(storageKey,${JSON.stringify(JSON.stringify(data))})`);await reload();await denyFullscreen();
  const customStorage=await storage();await click('#presentationStart');await click('#presentationPause');
  assert.ok(await fit());assert.ok(await js('Math.abs(cam.t.x-210)<1&&Math.abs(cam.t.z+155)<1'));
  for(let i=1;i<await js('factoryPresentation.scenes.length');i++){
    await click('#presentationNext');assert.ok(await fit());
  }
  await stop();assert.equal(await storage(),customStorage);
  console.log('OK  processo deslocado, equipamentos rotacionados, estação com operador e área vazia usam geometria real');

  await js(`localStorage.setItem(storageKey,JSON.stringify({version:3,blank:true,processReady:true,process:{x:0,z:0,w:800,d:400},areas:[],machines:[],links:[]}))`);await reload();await denyFullscreen();
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await paint();
  await click('#presentationStart');await click('#presentationPause');assert.ok(await fit());
  assert.ok(await js('cam3.far>1200&&factoryPresentation.scenes.length===1'));
  await capture('mobile-large-process');
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});await paint();assert.ok(await fit());
  assert.ok(await js(`(()=>{const r=document.querySelector('.presentation-controls').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`));
  await stop();assert.equal(await js('cam3.far'),1200);
  console.log('OK  processo 800×400 sem áreas enquadrado em celular e paisagem, com plano distante adaptativo');

  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await js(`localStorage.removeItem(storageKey)`);await reload();await denyFullscreen();
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('#presentationStart');const reducedPose=await pose();await sleep(180);await paint();assert.deepEqual(await pose(),reducedPose);
  assert.ok(await js(`(()=>{factoryPresentation.update(performance.now()+4500);return factoryPresentation.index===1&&factoryPresentation.phase==='hold'})()`));
  await stop();await send('Emulation.setEmulatedMedia',{features:[]});
  console.log('OK  movimento reduzido remove órbita e transições animadas sem interromper a sequência');

  await reload();await click('#presentationStart');await until('factoryPresentation.active');await sleep(200);
  const fullscreen=await js('document.fullscreenElement===document.querySelector(".app")');
  await stop();assert.equal(await js('!!document.fullscreenElement'),false);
  console.log('OK  pedido nativo de tela cheia e saída: '+(fullscreen?'aceito pelo Chrome':'fallback permitido pelo navegador'));
  await js(`window.mockPresentationFS=null;window.mockPresentationExits=0;
    Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>window.mockPresentationFS});
    document.exitFullscreen=()=>{window.mockPresentationFS=null;window.mockPresentationExits++;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve()};
    document.querySelector('.app').requestFullscreen=()=>{window.mockPresentationFS=document.querySelector('.app');document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve()};void 0`);
  await click('#presentationStart');await until('document.fullscreenElement===document.querySelector(".app")');await stop();
  assert.equal(await js('window.mockPresentationExits'),1);
  await js(`document.querySelector('.app').requestFullscreen=()=>new Promise(resolve=>{window.acceptPresentationFS=()=>{window.mockPresentationFS=document.querySelector('.app');document.dispatchEvent(new Event('fullscreenchange'));resolve()}});void 0`);
  await click('#presentationStart');await click('#presentationExit');
  await js('window.acceptPresentationFS();void 0');await until('!factoryPresentation.restoring');
  assert.equal(await js('window.mockPresentationExits'),2);assert.equal(await js('document.fullscreenElement'),null);
  await js(`delete document.fullscreenElement;delete document.exitFullscreen;delete document.querySelector('.app').requestFullscreen;void 0`);
  console.log('OK  contrato de tela cheia aceita, saída e aceitação tardia após cancelar (API simulada)');
  assert.deepEqual(errors,[]);console.log('OK  console sem erros e referência externa sem dependência de execução');
}
