import {mkdir,writeFile} from 'node:fs/promises';
export async function run({assert,send,js,until,boot,errors}){
 const paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
 const click=async selector=>{await paint();const [x,y]=await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Encoberto '+${JSON.stringify(selector)});return[x,y]})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1})};
 const reload=async()=>{await send('Page.reload');await boot()};
 await js(`localStorage.setItem('virtualFactoryEditorV1','dados que pertencem à outra aplicação');localStorage.removeItem(storageKey)`);await reload();
 assert.deepEqual(await js('[AL.length,MS.length,E.blank]'),[7,28,false]);
 assert.equal(await js("localStorage.getItem('virtualFactoryEditorV1')"),'dados que pertencem à outra aplicação');
 assert.equal(await js('storageKey'),'factory3dmap.layout.v1');
 console.log('OK  isolamento: dados originais não são lidos, alterados ou migrados');
 await click('.project-library>summary');await js('document.querySelector("#snapshotName").value="Fábrica Norte"');await click('#saveSnapshot');
 assert.equal(await js('readMapProjects().length'),1);
 await click('#newMapProject');await until('E.blank && AL.length===0');await reload();
 assert.ok(await js('E.blank && AL.length===0 && readMapProjects()[0].name==="Fábrica Norte"'));
 await click('.project-library>summary');await click('#savedProjects button');await until('typeof E!=="undefined" && !E.blank && AL.length===7 && rd.info.render.frame>1');
 assert.equal(await js('MS.length'),28);
 console.log('OK  cópia nomeada, novo projeto e reabertura após recarga');
 const silhouettes=await js(`(()=>{const codes=['SPI','NXT','AOI','RF','ICT','FCT','CUT'];return codes.map(code=>{const c=catalogue.find(c=>c[0]===code),model=previewModel(c,false);model.updateMatrixWorld(true);const bound=new THREE.Box3().setFromObject(model),signature=model.children.map(o=>[o.geometry?.type,o.geometry?.parameters?.width,o.geometry?.parameters?.height,o.position.toArray()]);const result={code,signature:JSON.stringify(signature),width:bound.max.x-bound.min.x,depth:bound.max.z-bound.min.z,w:c[2],d:c[4]};disposeModel(model);return result})})()`);
 assert.equal(new Set(silhouettes.map(m=>m.signature)).size,7);
 for(const m of silhouettes){assert.ok(m.width<=m.w+.001,m.code+' ultrapassou largura');assert.ok(m.depth<=m.d+.001,m.code+' ultrapassou profundidade')}
 assert.ok(await js(`(()=>{const m=previewModel(stations.find(c=>c[0]==='TST'),true);const ok=m.userData.jigs.length===3&&m.userData.operator.children.some(o=>o.geometry?.type==='IcosahedronGeometry');disposeModel(m);return ok})()`));
 console.log('OK  sete silhuetas próprias dentro da pegada e bancada com três jigs e operador novo');
 await click('#topView');assert.ok(await js('cam.ph<.08'));await click('#overview');await click('[data-tool="machines"]');assert.equal(await js('E.mode'),'machines');
 assert.ok(await js('[...document.querySelectorAll(".edcatalog-card strong")].some(e=>e.textContent==="CUT")'));
 await click('#cancelTool');assert.ok(await js('E.editorHome && !E.placing && !E.from'));await click('#edExit');
 await mkdir('evidence',{recursive:true});
 for(const [width,height] of [[1440,900],[1024,768],[390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await paint();
  assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'));
  await click('#editToggle');await click('[data-edtab="machines"]');await paint();
  const toolbar=await js(`(()=>{const a=document.querySelector('.map-tools').getBoundingClientRect(),b=editorDrawer.getBoundingClientRect();return a.left>=0&&a.bottom<=innerHeight&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight})()`);assert.ok(toolbar);
  const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(`evidence/construction-${width}.png`,Buffer.from(data,'base64'));
  await click('#edExit');
 }
 console.log('OK  ferramentas, catálogo CUT, planta e interface em 1440, 1024 e 390 pixels');
 assert.deepEqual(errors,[]);console.log('OK  console sem erros');
}
