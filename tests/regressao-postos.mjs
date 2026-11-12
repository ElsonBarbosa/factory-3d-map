import { writeFile } from 'node:fs/promises';

export async function run({assert,send,js,until,boot,sleep,errors}){
  const q=JSON.stringify,paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const check=async(name,fn)=>{await fn();console.log('OK  '+name)};
  const mouse=(type,[x,y],props={})=>send('Input.dispatchMouseEvent',{type,x,y,...props});
  const move=(p,pressed=false)=>mouse('mouseMoved',p,{button:pressed?'left':'none',buttons:pressed?1:0});
  const down=p=>mouse('mousePressed',p,{button:'left',buttons:1,clickCount:1});
  const up=p=>mouse('mouseReleased',p,{button:'left',buttons:0,clickCount:1});
  const center=async selector=>{
    await paint();
    return js(`(()=>{const el=document.querySelector(${q(selector)});if(!el)throw Error('Ausente '+${q(selector)});
      for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
      if(el.closest('#edDrawer,#edInstallOverlay'))el.scrollIntoView({block:'nearest',inline:'nearest'});
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(document.elementFromPoint(x,y)))throw Error('Encoberto '+${q(selector)}+' por '+document.elementFromPoint(x,y)?.dataset.machine);
      return[x,y]})()`);
  };
  const click=async selector=>{const p=await center(selector);await move(p);await down(p);await up(p)};
  const back=async()=>{if(await js('!!document.querySelector("#edBack")'))await click('#edBack')};
  const tool=async mode=>{await back();await click('[data-edtab="'+mode+'"]')};
  const camera=async(d=80)=>{
    await js(`stopCameraKeys();cam.th=.2;cam.ph=.8;cam.d=goal.d=${d};goal.t.set(0,0,0);cam.t.copy(goal.t);void 0`);await paint();
  };
  const project=(x,z,y=1)=>js(`(()=>{const v=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();return[r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height]})()`);
  const reload=async()=>{await send('Page.reload');await until('document.readyState==="complete"');await boot()};
  const area={id:'custom-1',n:'Linha manual',x:0,z:0,w:80,d:54,hue:210,custom:true};
  const auto=(id,x,z,kind='SPI',rot=0)=>({id,n:id,a:'custom-1',dx:x,dz:z,w:kind==='AUTO'?6:4,h:kind==='AUTO'?3:2.6,d:4,rot,kind});
  const station=(id,x,z,side=1,rot=0,lineRot=0,type='inspection')=>({
    id,n:id,a:'custom-1',dx:x,dz:z,w:5,h:2.3,d:5,station:true,side,rot,lineRot,manualType:type,kind:type==='test'?'TST':'BAN'
  });
  const load=async(machines,links=[])=>{
    const data={version:3,blank:true,process:{x:0,z:0,w:100,d:70},areas:[area],machines,links,flowDir:links.length?1:0};
    await js(`localStorage.setItem('factory3dmap.layout.v1',${q(JSON.stringify(data))})`);await reload();await click('#editToggle');await camera();
  };
  let dragIntercept;
  run.onDrag=event=>dragIntercept?.(event);
  const select=async id=>{
    await paint();
    const position=await js(`(()=>{const p=M[${q(id)}].mesh.children[0].getWorldPosition(new THREE.Vector3());return[p.x,p.z,p.y]})()`);
    const p=await project(...position);await move(p);await down(p);await up(p);
    await until(`E.machineSelected===${q(id)} && machineOutline.parent===M[${q(id)}].mesh`);
  };
  const connect=async(from,to)=>{
    await click('.flow-port[data-machine="'+from+'"][data-side="out"]');
    await click('.flow-port[data-machine="'+to+'"][data-side="in"]');
  };
  const pathsClear=()=>js(`E.links.every(l=>!l.blocked&&l.curve&&MS.filter(isStation).every(m=>{
    const size=typeof stationBodyRect==='function'?stationBodyRect(m,m.pos.x,m.pos.z):{...footprint(m),x:m.pos.x,z:m.pos.z},x0=size.x-size.w/2-.5,x1=size.x+size.w/2+.5,z0=size.z-size.d/2-.5,z1=size.z+size.d/2+.5;
    for(let i=0;i<=300;i++){const p=l.curve.getPoint(i/300);if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1)return false}
    return true
  }))`);

  await check('corredor central compartilhado, par de postos e PCB fora das bancadas',async()=>{
    await load([auto('SPI-A',-18,0),station('TESTE-A',-5,4,1,0,0,'test'),station('INS-B',-5,-4,-1),auto('NXT-B',12,0)]);
    await tool('flow');await connect('TESTE-A','INS-B');
    assert.equal(await js('E.links.length'),1,await js('document.querySelector("#edStatus").textContent'));
    await connect('SPI-A','TESTE-A');await connect('INS-B','NXT-B');
    assert.equal(await js('E.links.length'),3);
    assert.ok(await pathsClear());
    assert.ok(await js('E.links.every(l=>l.points.every(p=>Math.abs(p.z)<1e-6))'));
    assert.ok(await js('MS.filter(isStation).every(m=>Math.abs(portsFor(m).in.z)<1e-6 && Math.abs(m.pos.z)>3)'));
    await paint();
    const before=await js('E.links[0].movers[0].obj.position.toArray()');await sleep(300);await paint();
    const after=await js('E.links[0].movers[0].obj.position.toArray()');
    assert.notDeepEqual(before,after);assert.ok(Math.abs(after[2])<1e-6);
    assert.ok(await js('E.links.some(l=>l.movers.some(m=>m.obj.geometry.type==="ShapeGeometry"))'));
    await select('TESTE-A');
    assert.ok(await js('M["TESTE-A"].jigs.length===3 && M["TESTE-A"].operator.parent===M["TESTE-A"].mesh'));
    assert.match(await js('document.querySelector(".edworkcell-kind").textContent'),/3 jigs/);
    assert.match(await js('document.querySelector("#edManualRelation").textContent'),/alinhado com INS-B/);
    if(process.env.VF_TEST_MANUAL_SCREENSHOT){
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(process.env.VF_TEST_MANUAL_SCREENSHOT.replace(/\.png$/,'-pair.png'),Buffer.from(data,'base64'));
    }
  });

  await check('postos de frente, invertidos e com fluxo vertical respeitam a passagem',async()=>{
    for(const [x,z,side,rot,lineRot] of [[0,4,1,0,0],[0,-4,-1,0,0],[8,0,1,1,0],[-8,0,1,3,0],[4,0,1,1,1]]){
      const vertical=lineRot===1,first=auto('AUTO-A',vertical?0:-18,vertical?18:0,'SPI',vertical?1:0);
      const last=auto('AUTO-B',vertical?0:18,vertical?-18:0,'SPI',vertical?1:0);
      await load([first,station('POSTO',x,z,side,rot,lineRot),last],[{from:'AUTO-A',to:'POSTO'},{from:'POSTO',to:'AUTO-B'}]);
      assert.ok(await pathsClear(),JSON.stringify({x,z,side,rot,lineRot,paths:await js('E.links.map(l=>({blocked:l.blocked,points:l.points?.map(p=>p.toArray())}))')}));
      assert.ok(await js('M["POSTO"].operator.children.length>=5'));
      await select('POSTO');
      assert.ok(await js('manualLaneGuide.visible && machineOutline.parent===M["POSTO"].mesh'));
    }
  });

  await check('inversão de lado, rotação e reserva do operador são salvas e validadas',async()=>{
    await load([station('POSTO',0,4)]);
    await select('POSTO');
    await click('#edFlipStation');assert.equal(await js('M["POSTO"].side'),-1);
    await click('#edRotate90');assert.equal(await js('M["POSTO"].rot'),1);
    await js('document.querySelector("#edManualFlow").value="0";document.querySelector("#edManualFlow").dispatchEvent(new Event("change",{bubbles:true}));void 0');
    assert.equal(await js('M["POSTO"].lineRot'),0);
    assert.ok(await js('validateMachine({w:4,d:4,rot:0},A["custom-1"],stationLane(M["POSTO"]).x,stationLane(M["POSTO"]).z).match(/corredor|sobrepõe/)'));
    const lane=await js('stationLane(M["POSTO"])');
    await reload();assert.deepEqual(await js('stationLane(M["POSTO"])'),lane);
    assert.deepEqual(await js('[M["POSTO"].side,M["POSTO"].rot,M["POSTO"].lineRot]'),[-1,1,0]);
  });

  await check('catálogo instala bancada de teste, escolhe lado e preserva os três jigs',async()=>{
    await load([auto('SPI-A',-18,0)]);
    await tool('stations');
    const index=await js('[...document.querySelectorAll(".edcatalog-card")].find(el=>el.querySelector("strong").textContent==="TST").dataset.edcatalog');
    const start=await center('[data-edcatalog="'+index+'"]'),finish=await project(0,4,0);
    await send('Input.setInterceptDrags',{enabled:true});
    try{
      const intercepted=new Promise(resolve=>{dragIntercept=resolve});
      await move(start);await down(start);await move([start[0]+20,start[1]+5],true);
      const {data}=await Promise.race([intercepted,sleep(2500).then(()=>{throw Error('Drag não iniciou')})]);
      const [x,y]=finish;
      await send('Input.dispatchDragEvent',{type:'dragEnter',x,y,data});
      await send('Input.dispatchDragEvent',{type:'dragOver',x,y,data});
      assert.ok(await js('!!manualGhost && ghostModel.userData.jigs.length===3'));
      await send('Input.dispatchDragEvent',{type:'drop',x,y,data});await up(finish);
    }finally{await send('Input.setInterceptDrags',{enabled:false})}
    await until('!!installPending');
    await js('document.querySelector("#edInstallSide").value="-1";document.querySelector("#edInstallSide").dispatchEvent(new Event("change"));document.querySelector("#edInstallId").value="TST-NOVO";void 0');
    assert.ok(await js('installPreview.model.userData.jigs.length===3'));
    await click('#edInstallConfirm');await until('!!M["TST-NOVO"]');
    assert.ok(await js('M["TST-NOVO"].side===-1 && M["TST-NOVO"].jigs.length===3 && manualStationType(M["TST-NOVO"])==="test"'));
    await select('TST-NOVO');await click('#edFlipStation');
    assert.equal(await js('M["TST-NOVO"].side'),1,await js('document.querySelector("#edStatus").textContent'));
    await tool('flow');await connect('SPI-A','TST-NOVO');assert.equal(await js('E.links.length'),1);
    assert.ok(await pathsClear());
    await reload();
    assert.ok(await js('M["TST-NOVO"].side===1 && M["TST-NOVO"].jigs.length===3 && E.links.length===1'));
  });

  await check('quatro rotações conectadas, rejeição de limite e reconstrução sem resíduos',async()=>{
    await load([auto('AUTO-A',-18,0),station('POSTO',0,4),auto('AUTO-B',18,0)],
      [{from:'AUTO-A',to:'POSTO'},{from:'POSTO',to:'AUTO-B'}]);
    await select('POSTO');
    const position=await js('M.POSTO.pos.toArray()');
    for(const rotation of [1,2,3,0]){
      await click('#edRotate90');assert.equal(await js('M.POSTO.rot'),rotation);
      assert.deepEqual(await js('M.POSTO.pos.toArray()'),position);
      assert.ok(await pathsClear());
    }
    await paint();
    const baseline=await js('[rd.info.memory.geometries,pick.length]');
    for(let i=0;i<8;i++)await click('#edFlipStation');
    await paint();
    assert.deepEqual(await js('[rd.info.memory.geometries,pick.length]'),baseline);
    assert.ok(await js('machineOutline.parent===M.POSTO.mesh && M.POSTO.operator.parent===M.POSTO.mesh'));
    await load([station('POSTO',0,23)]);await select('POSTO');
    await click('#edRotate90');assert.equal(await js('M.POSTO.rot'),1);
    await click('#edRotate90');assert.equal(await js('M.POSTO.rot'),1);
    assert.match(await js('document.querySelector("#edStatus").textContent'),/área|corredor/);
  });

  await check('edições dos postos da demonstração restauram também o modelo e o operador',async()=>{
    await js('localStorage.removeItem("factory3dmap.layout.v1")');await reload();
    const saved=await js(`(()=>{
      saveLayout();const data=JSON.parse(localStorage.getItem(storageKey));
      const m=MS.find(isStation),p=data.demoMachines.find(p=>p.id===m.id);
      p.side=-m.side;p.manualType='test';
      localStorage.setItem(storageKey,JSON.stringify(data));return{id:m.id,side:p.side};
    })()`);
    await reload();
    assert.deepEqual(await js(`(()=>{const m=M[${q(saved.id)}];return{
      side:m.side,tableSide:Math.sign(m.mesh.children[0].position.z),
      operatorSide:Math.sign(m.operator.position.z-m.mesh.children[0].position.z),jigs:m.jigs.length
    }})()`),{side:saved.side,tableSide:saved.side,operatorSide:-saved.side,jigs:3});
  });

  await check('testador automático tem fixture com abertura e fechamento no loop original',async()=>{
    await load([auto('AUTO-TEST',0,0,'AUTO')]);await camera(34);await select('AUTO-TEST');
    assert.ok(await js('!!M["AUTO-TEST"].fixture && !!M["AUTO-TEST"].operator'));
    await until('M["AUTO-TEST"].fixture.cage.position.y<1.3',12000);
    const closed=await js('M["AUTO-TEST"].fixture.cage.position.y'),geometries=await js('rd.info.memory.geometries');
    await until('M["AUTO-TEST"].fixture.cage.position.y>2',12000);
    assert.ok(closed<await js('M["AUTO-TEST"].fixture.cage.position.y'));
    assert.equal(await js('rd.info.memory.geometries'),geometries);
    assert.match(await js('document.querySelector(".edworkcell-kind").textContent'),/Testador automático/);
    if(process.env.VF_TEST_MANUAL_SCREENSHOT){
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(process.env.VF_TEST_MANUAL_SCREENSHOT.replace(/\.png$/,'-auto.png'),Buffer.from(data,'base64'));
    }
    const z=await js('goal.t.z');
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
    await until('goal.t.z<'+(z-1));
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
    await until('cameraKeyVelocity.x===0 && cameraKeyVelocity.z===0');
  });
  assert.deepEqual(errors,[]);console.log('OK  console sem erros');
}
