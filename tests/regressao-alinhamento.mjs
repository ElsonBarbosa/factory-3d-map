import {writeFile} from 'node:fs/promises';

export async function run({assert,send,js,until,boot,sleep,errors}){
  const q=JSON.stringify,paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const capture=async suffix=>{if(process.env.VF_TEST_ALIGNMENT_SCREENSHOT){const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(process.env.VF_TEST_ALIGNMENT_SCREENSHOT.replace(/\.png$/,'-'+suffix+'.png'),Buffer.from(data,'base64'))}};
  const check=async(name,fn)=>{if(process.env.VF_TEST_FILTER&&!name.includes(process.env.VF_TEST_FILTER))return;await fn();console.log('OK  '+name)};
  const mouse=(type,[x,y],props={})=>send('Input.dispatchMouseEvent',{type,x,y,...props});
  const move=(p,pressed=false)=>mouse('mouseMoved',p,{button:pressed?'left':'none',buttons:pressed?1:0});
  const down=p=>mouse('mousePressed',p,{button:'left',buttons:1,clickCount:1});
  const up=p=>mouse('mouseReleased',p,{button:'left',buttons:0,clickCount:1});
  const center=async selector=>{
    await paint();return js(`(()=>{const el=document.querySelector(${q(selector)});if(!el)throw Error('Ausente '+${q(selector)});
      for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
      if(el.closest('#edDrawer,#edInstallOverlay'))el.scrollIntoView({block:'nearest',inline:'nearest'});
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(document.elementFromPoint(x,y)))throw Error('Encoberto '+${q(selector)});
      return[x,y]})()`);
  };
  const click=async selector=>{const p=await center(selector);await move(p);await down(p);await up(p)};
  const tool=async mode=>{if(await js('!!document.querySelector("#edBack")'))await click('#edBack');await click('[data-edtab="'+mode+'"]')};
  const project=(x,z,y=.136)=>js(`(()=>{const v=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();return[r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height]})()`);
  const reload=async()=>{await send('Page.reload');await until('document.readyState==="complete"');await boot()};
  const area={id:'custom-1',n:'Alinhamento',x:0,z:0,w:80,d:54,hue:210,custom:true};
  const machine=(id,x,z,{rot=0,station=false,kind=station?'BAN':'SPI',side=1}={})=>({
    id,n:id,a:area.id,dx:x,dz:z,w:station?5:kind==='NXT'?6:4,h:station?2.3:2.6,d:station?5:4,rot,kind,station,
    ...(station?{side,lineRot:0,manualType:'inspection'}:{})
  });
  const load=async machines=>{
    const data={version:3,blank:true,process:{x:0,z:0,w:100,d:70},areas:[area],machines,links:[],flowDir:0};
    await js(`localStorage.setItem('factory3dmap.layout.v1',${q(JSON.stringify(data))})`);await reload();await click('#editToggle');
    await js('stopCameraKeys();cam.th=.2;cam.ph=.8;cam.d=goal.d=75;goal.t.set(0,0,0);cam.t.copy(goal.t);void 0');await paint();
  };
  const port=(id,side)=>'.flow-port[data-machine="'+id+'"][data-side="'+side+'"]';
  const orthogonal=expression=>js(`(${expression}).every((p,i,list)=>!i||Math.abs(p.x-list[i-1].x)<1e-5||Math.abs(p.z-list[i-1].z)<1e-5)`);
  const select=async id=>{
    await paint();const position=await js(`(()=>{const p=M[${q(id)}].mesh.children[0].getWorldPosition(new THREE.Vector3());return[p.x,p.z,p.y]})()`);
    const p=await project(...position);await move(p);await down(p);await up(p);await until(`E.machineSelected===${q(id)}`);
  };
  const escape=async()=>{await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})};
  let interceptedDrag;
  run.onDrag=event=>interceptedDrag?.(event);

  await check('diferença de uma fileira usa segmentos ortogonais, sem diagonal residual',async()=>{
    await load([machine('SPI-A',-18,0),machine('SPI-B',0,1)]);
    assert.ok(await orthogonal('pathFor(M["SPI-A"],M["SPI-B"])'),'Uma diferença de uma unidade gerou um segmento diagonal');
    await tool('flow');await click(port('SPI-A','out'));await move(await center(port('SPI-B','in')));
    await until('flowPreview.target==="SPI-B" && !!flowPreview.ribbon');
    assert.ok(await orthogonal('flowPreview.points'));
    const geometry=await js('Array.from(flowPreview.ribbon.geometry.attributes.position.array)'),points=await js('flowPreview.points.map(p=>p.toArray())');
    assert.equal(await js('E.links.length'),0);assert.equal(await js('E.flowDir'),0);
    await click(port('SPI-B','in'));await until('E.links.length===1 && !flowPreview.ribbon');
    assert.deepEqual(await js('E.links[0].points.map(p=>p.toArray())'),points);
    assert.deepEqual(await js('Array.from(E.links[0].ribbon.geometry.attributes.position.array)'),geometry);
    assert.ok(await js('E.links[0].curve.curves.some(c=>c.type==="QuadraticBezierCurve3")'));
  });

  await check('projeção do cursor acompanha o grid em visão rasante',async()=>{
    await load([machine('REF',-18,0)]);await tool('machines');await click('[data-edcatalog="0"]');
    await js('cam.ph=1.4');await paint();await move(await project(0,0));await paint();
    assert.deepEqual(await js('[ghost.position.x,ghost.position.z]'),[0,0],'O plano de raycast abaixo do grid deslocou o snap');
    await escape();
  });

  await check('prévia reta, centro nas portas, guia verde e marcador no snap do cursor',async()=>{
    await load([machine('SPI-A',-18,0),machine('SPI-B',0,0)]);await tool('flow');
    const camera=await js('[cam.th,cam.ph,cam.d,...goal.t.toArray()]');
    await click(port('SPI-A','out'));await move(await center(port('SPI-B','in')));
    await until('flowPreview.target==="SPI-B" && alignmentGuides.some(l=>l.visible)');
    assert.equal(await js('alignmentMaterial.color.getHex()'),0x35bd80);
    assert.equal(await js('alignmentGuides.filter(l=>l.visible).length'),1);
    assert.equal(await js('alignmentGuides.find(l=>l.visible).userData.axis'),'z');
    assert.deepEqual(await js('flowPreviewMarker.position.toArray()'),await js('(()=>{const p=portsFor(M["SPI-B"]).in;return[p.x,.18,p.z]})()'));
    assert.ok(await js('(()=>{const g=flowPreview.ribbon.geometry;g.computeBoundingBox();return Math.abs(g.boundingBox.min.z+.525)<1e-6&&Math.abs(g.boundingBox.max.z-.525)<1e-6&&flowPreview.ribbon.position.length()===0})()'));
    await capture('preview');
    const count=await js('rd.info.memory.geometries');await sleep(350);await paint();assert.equal(await js('rd.info.memory.geometries'),count);
    await move(await project(5.4,2.4));await paint();
    assert.deepEqual(await js('flowPointer.point'),{x:5,z:2});assert.deepEqual(await js('flowPreviewMarker.position.toArray()'),[5,.18,2]);
    assert.ok(await orthogonal('flowPreview.points'));
    assert.deepEqual(await js('[cam.th,cam.ph,cam.d,...goal.t.toArray()]'),camera);
    await move(await center(port('SPI-B','in')));await click(port('SPI-B','in'));
    assert.ok(await orthogonal('E.links[0].points'));
    if(process.env.VF_TEST_ALIGNMENT_SCREENSHOT){const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(process.env.VF_TEST_ALIGNMENT_SCREENSHOT,Buffer.from(data,'base64'))}
  });

  await check('equipamento girado mantém pegada e centro; guias não adicionam magnetismo',async()=>{
    await load([machine('REF',-18,0)]);await tool('machines');await click('[data-edcatalog="1"]');
    await js('E.placing.rot=1');await move(await project(0,0));await paint();
    assert.deepEqual(await js('[ghost.geometry.parameters.width,ghost.geometry.parameters.depth]'),[4,6]);
    assert.deepEqual(await js('[ghost.position.x,ghost.position.z,ghostModel.position.x,ghostModel.position.z]'),[0,0,0,0]);
    assert.ok(Math.abs(await js('ghostModel.rotation.y')-Math.PI/2)<1e-10);
    assert.ok(Math.abs(await js('ghost.position.y-ghost.geometry.parameters.height/2')-.12)<1e-10);
    await js('cam.ph=1.4');await paint();await move(await project(0,0));await paint();
    assert.deepEqual(await js('[ghost.position.x,ghost.position.z]'),[0,0],'A projeção precisa usar a altura do grid mesmo em visão rasante');
    await js('cam.ph=.8');await paint();
    await move(await project(0,.49));await paint();assert.equal(await js('ghost.position.z'),0);
    assert.ok(await js('alignmentGuides.some(l=>l.visible)'));
    await capture('equipamento');
    await move(await project(0,.51));await paint();assert.equal(await js('ghost.position.z'),1);
    assert.ok(await js('alignmentGuides.every(l=>!l.visible)'));
    await escape();await paint();assert.ok(await js('!ghost.visible && alignmentGuides.every(l=>!l.visible)'));
  });

  await check('drag-and-drop nativo usa guias e confirma o mesmo centro do preview',async()=>{
    await load([machine('REF',-18,0)]);await tool('machines');
    await send('Input.setInterceptDrags',{enabled:true});
    const start=await center('[data-edcatalog="0"]'),finish=await project(0,0);
    try{
      const intercepted=new Promise(resolve=>interceptedDrag=resolve);
      await move(start);await down(start);await move([start[0]+20,start[1]+5],true);
      const {data}=await Promise.race([intercepted,sleep(2500).then(()=>{throw Error('Drag não iniciou')})]);
      const [x,y]=finish;
      await send('Input.dispatchDragEvent',{type:'dragEnter',x,y,data});await send('Input.dispatchDragEvent',{type:'dragOver',x,y,data});await paint();
      assert.deepEqual(await js('[ghost.position.x,ghost.position.z]'),[0,0]);
      assert.ok(await js('alignmentGuides.some(l=>l.visible)'));
      await send('Input.dispatchDragEvent',{type:'drop',x,y,data});await up(finish);
    }finally{await send('Input.setInterceptDrags',{enabled:false})}
    await until('!!installPending');assert.deepEqual(await js('[installPending.x,installPending.z]'),[0,0]);
    assert.ok(await js('alignmentGuides.every(l=>!l.visible)'));
    await js('document.querySelector("#edInstallId").value="SPI-NOVO"');await click('#edInstallConfirm');
    assert.deepEqual(await js('[M["SPI-NOVO"].pos.x,M["SPI-NOVO"].pos.z]'),[0,0]);
  });

  await check('portas giradas produzem conexão vertical e guia de coluna',async()=>{
    await load([machine('VERT-A',0,10,{rot:1}),machine('VERT-B',0,-10,{rot:1}),machine('SPI-A',-18,20),machine('SPI-B',0,20)]);
    await tool('flow');await click(port('SPI-A','out'));await click(port('SPI-B','in'));
    await click(port('VERT-A','out'));await move(await center(port('VERT-B','in')));await paint();
    assert.ok(await js('flowPreview.valid && alignmentMaterial.color.getHex()===0x35bd80'));
    assert.ok(await js('alignmentGuides.some(l=>l.visible&&l.userData.axis==="x")'));
    assert.ok(await orthogonal('flowPreview.points'));
    const points=await js('flowPreview.points.map(p=>p.toArray())');await click(port('VERT-B','in'));
    assert.deepEqual(await js('E.links.find(l=>l.from==="VERT-A").points.map(p=>p.toArray())'),points);
  });

  await check('movimentação por clique e arrasto mostra fileira/coluna e limpa as guias',async()=>{
    await load([machine('REF',-18,0),machine('MOVEL',6,8,{kind:'NXT'})]);await select('MOVEL');await click('#edMoveMachine');
    const point=await project(6,0);await move(point);await paint();assert.ok(await js('alignmentGuides.some(l=>l.visible&&l.userData.axis==="z")'));
    await down(point);await up(point);await paint();
    assert.deepEqual(await js('[M.MOVEL.pos.x,M.MOVEL.pos.z]'),[6,0]);assert.ok(await js('alignmentGuides.every(l=>!l.visible)'));
    await select('MOVEL');
    const start=await project(6,0,1.5);await move(start);await down(start);await until('E.drag?.kind==="machine-move"');
    const offset=await js('[E.drag.offsetX,E.drag.offsetZ]');
    await move(await project(-18-offset[0],12-offset[1]),true);await paint();
    assert.ok(await js('alignmentGuides.some(l=>l.visible&&l.userData.axis==="x")'));
    const end=await project(-16-offset[0],13-offset[1]);await move(end,true);await paint();assert.ok(await js('alignmentGuides.every(l=>!l.visible)'));
    await up(end);await paint();assert.ok(await js('!E.drag && alignmentGuides.every(l=>!l.visible)'));
  });

  await check('estações alinham o corredor; prévia e confirmação manual usam a mesma geometria',async()=>{
    await load([machine('POSTO-A',-10,8,{station:true}),machine('POSTO-B',10,12,{station:true})]);
    await select('POSTO-B');await click('#edMoveMachine');await move(await project(10,8));await paint();
    assert.ok(await js('alignmentGuides.some(l=>l.visible) && alignmentMaterial.color.getHex()===0x35bd80'));
    const p=await project(10,8);await down(p);await up(p);await tool('flow');await click(port('POSTO-A','out'));await move(await center(port('POSTO-B','in')));
    await until('flowPreview.target==="POSTO-B" && flowPreview.valid');
    assert.equal(await js('alignmentMaterial.color.getHex()'),0x35bd80);
    await capture('postos');
    const points=await js('flowPreview.points.map(p=>p.toArray())');
    await click(port('POSTO-B','in'));await until('E.links.length===1 && !flowPreview.ribbon');
    assert.deepEqual(await js('E.links[0].points.map(p=>p.toArray())'),points);
    await reload();assert.equal(await js('E.links.length'),1);assert.deepEqual(await js('E.links[0].points.map(p=>p.toArray())'),points);
  });

  await check('prévia inválida não altera dados; saída, troca de ferramenta e exclusão não deixam resíduos',async()=>{
    await load([machine('SPI-A',-18,0),machine('SPI-B',0,0)]);await tool('flow');await click(port('SPI-A','out'));await move(await center(port('SPI-B','in')));await paint();
    await move(await center('#edBack'));await paint();assert.ok(await js('!flowPreview.ribbon && alignmentGuides.every(l=>!l.visible)'));
    const baseline=await js('rd.info.memory.geometries');
    for(let i=0;i<12;i++){await move(await center(port('SPI-B','in')));await paint();await move(await center('#edBack'));await paint()}
    assert.equal(await js('rd.info.memory.geometries'),baseline);
    await click(port('SPI-B','in'));await until('E.links.length===1');
    await click(port('SPI-A','out'));await move(await center(port('SPI-B','in')));await paint();
    assert.equal(await js('flowPreview.valid'),false);assert.equal(await js('flowPreviewMaterial.color.getHex()'),0xd95655);assert.equal(await js('E.links.length'),1);
    await click('#edCancelFlow');await paint();assert.ok(await js('!flowPreview.ribbon && alignmentGuides.every(l=>!l.visible)'));
    await click('#themeSwitch');await paint();assert.equal(await js('document.documentElement.dataset.theme'),'dark');
    await tool('machines');assert.ok(await js('!flowPreview.ribbon && alignmentGuides.every(l=>!l.visible)'));
  });
  assert.deepEqual(errors,[]);console.log('OK  console sem erros');
}
