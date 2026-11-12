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
    m.mesh.updateMatrixWorld(true);const bounds=new THREE.Box3();m.mesh.traverse(o=>{if(o.isMesh)bounds.union(new THREE.Box3().setFromObject(o))});const x0=bounds.min.x-.5249,x1=bounds.max.x+.5249,z0=bounds.min.z-.5249,z1=bounds.max.z+.5249;
    for(let i=0;i<=300;i++){const p=l.curve.getPoint(i/300);if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1)return false}
    return true
  }))`);

  const change=async(selector,value)=>js(`(()=>{const el=document.querySelector(${q(selector)});el.value=${q(value)};el.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  const capture=async suffix=>{if(process.env.VF_TEST_BENCH_SCREENSHOT){const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(process.env.VF_TEST_BENCH_SCREENSHOT.replace(/\.png$/,'-'+suffix+'.png'),Buffer.from(data,'base64'))}};
  const actualBounds=id=>js(`(()=>{const root=M[${q(id)}].mesh;root.updateMatrixWorld(true);const box=new THREE.Box3();root.traverse(o=>{if(o.isMesh)box.union(new THREE.Box3().setFromObject(o))});return{min:box.min.toArray(),max:box.max.toArray()}})()`);

  await check('inspetor vertical, propriedades acessíveis e catálogo contextual em três resoluções',async()=>{
    await load([station('POSTO',0,4)]);await select('POSTO');
    for(const [width,height] of [[1800,1080],[1366,768],[1280,720]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await paint();
      assert.ok(await js(`(()=>{
        const workspace=ED.querySelector('.edworkspace'),card=document.querySelector('#edSelectedEquipment'),catalog=ED.querySelector('.edcatalog-section'),drawer=editorDrawer.getBoundingClientRect();
        if(workspace.firstElementChild!==card||!card.nextElementSibling?.classList.contains('edcatalog-section'))return false;
        if(getComputedStyle(card).overflowY!=='visible'||card.scrollHeight>card.clientHeight+1)return false;
        return ['#edEditName','#edEditId','#edRotate90','#edManualMode','#edManualFlow','#edFlipStation','#edSaveMachine','#edMoveMachine','#edManualRelation'].every(selector=>{
          document.querySelector(selector).scrollIntoView({block:"nearest"});const r=document.querySelector(selector).getBoundingClientRect();return r.top>=drawer.top&&r.bottom<=drawer.bottom&&r.left>=drawer.left&&r.right<=drawer.right;
        })&&card.getBoundingClientRect().bottom<=catalog.getBoundingClientRect().top+1;
      })()`),'Formulário não coube em '+width+'×'+height);
      await capture('painel-'+width);
    }
    await click('#edBack');assert.ok(await js('E.editorHome'));await tool('stations');
    await send('Emulation.setDeviceMetricsOverride',{width:1800,height:1080,deviceScaleFactor:1,mobile:false});await paint();
  });

  await check('disposição lateral encosta na esteira e paralela aproxima operador uma unidade',async()=>{
    await load([station('POSTO',0,4)]);await select('POSTO');
    assert.equal(await js('manualDisposition(M.POSTO)'),'parallel');
    assert.ok(Math.abs(await js('Math.abs(M.POSTO.mesh.children[0].position.z-M.POSTO.operator.position.z)')-1)<1e-8);
    await change('#edManualMode','lateral');await paint();
    assert.equal(await js('manualDisposition(M.POSTO)'),'lateral');assert.equal(await js('M.POSTO.lineRot'),0);assert.equal(await js('M.POSTO.rot'),1);
    assert.ok(Math.abs(await js('Math.abs(M.POSTO.mesh.children[0].position.z-M.POSTO.operator.position.z)')-2)<1e-8);
    const gap=await js('(()=>{const m=M.POSTO,b=stationBodyRect(m,m.pos.x,m.pos.z),lane=stationLane(m);return Math.max(b.x-b.w/2-lane.x-lane.w/2,lane.x-lane.w/2-b.x-b.w/2,b.z-b.d/2-lane.z-lane.d/2,lane.z-lane.d/2-b.z-b.d/2)})()');
    assert.ok(gap>=0&&gap<.1,'Lateral deve estar próxima sem atravessar a fita: '+gap);
    for(const rot of [2,3,0,1]){
      await click('#edRotate90');assert.equal(await js('M.POSTO.rot'),rot);
      assert.ok(await js('machineOutline.parent===M.POSTO.mesh && document.querySelector("#edManualMode").value===manualDisposition(M.POSTO)'));
      assert.ok(Math.abs(await js('M.POSTO.operator.position.z-manualOperatorZ(M.POSTO)'))<1e-8);
    }
    await reload();assert.deepEqual(await js('[M.POSTO.rot,M.POSTO.lineRot,manualDisposition(M.POSTO),M.POSTO.operator.position.z]'),[1,0,'lateral',-.9]);
  });

  await check('bancada lateral aceita 180 graus mantendo centro, ID e modo após recarga',async()=>{
    await load([station('POSTO-180',0,4,1,0,1)]);await select('POSTO-180');
    assert.equal(await js('manualDisposition(M["POSTO-180"])'),'lateral');
    await click('#edRotate90');await click('#edRotate90');
    assert.deepEqual(await js('[M["POSTO-180"].rot,M["POSTO-180"].pos.x,M["POSTO-180"].pos.z,manualDisposition(M["POSTO-180"])]'),[2,0,4,'lateral']);
    await reload();assert.deepEqual(await js('[M["POSTO-180"].rot,M["POSTO-180"].lineRot,manualDisposition(M["POSTO-180"])]'),[2,1,'lateral']);
  });

  await check('paralela e lateral coexistem no mesmo fluxo com PCB e guias preservadas',async()=>{
    await load([auto('SPI-A',-24,0),station('PARALELA',-10,4),station('LATERAL',5,3,-1,1,0),auto('SPI-B',18,0)]);
    await tool('flow');await connect('SPI-A','PARALELA');await connect('PARALELA','LATERAL');await connect('LATERAL','SPI-B');
    assert.equal(await js('E.links.length'),3,await js('document.querySelector("#edStatus").textContent'));
    assert.ok(await pathsClear());assert.ok(await js('E.links.every(l=>l.points.every(p=>Math.abs(p.z)<1e-5))'));
    const before=await js('E.links[1].movers[0].obj.position.toArray()');await sleep(300);await paint();
    assert.notDeepEqual(await js('E.links[1].movers[0].obj.position.toArray()'),before);
    await select('LATERAL');await capture('fluxo');
    await reload();assert.equal(await js('E.links.length'),3);assert.ok(await pathsClear());
    assert.deepEqual(await js('[manualDisposition(M.PARALELA),manualDisposition(M.LATERAL),M.LATERAL.rot,M.LATERAL.side]'),['parallel','lateral',1,-1]);
  });

  await check('bancadas encostam de costas no grid e sobreposição real é bloqueada',async()=>{
    await load([station('A',0,0),station('B',0,7,-1)]);await select('B');await click('#edMoveMachine');
    const target=await project(0,4,.136);await move(target);await paint();
    assert.equal(await js('validateMachine(M.B,A["custom-1"],0,4)'),'',await js('document.querySelector("#edStatus").textContent'));
    await down(target);await up(target);await paint();
    assert.deepEqual(await js('[M.B.pos.x,M.B.pos.z]'),[0,4]);
    const a=await actualBounds('A'),b=await actualBounds('B');assert.ok(Math.abs(a.max[2]-b.min[2])<1e-5);
    assert.match(await js('validateMachine(M.B,A["custom-1"],0,3)'),/sobrepõe/);
    assert.equal(await js('validateMachine(M.B,A["custom-1"],5,0)'),'', 'Postos podem ficar próximos lateralmente');
    assert.equal(await js('validateMachine(M.B,A["custom-1"],0,-4)'),'', 'Faixa ainda sem esteira não é uma caixa física de outra bancada');
    assert.match(await js('validateMachine(M.B,A["custom-1"],4,0)'),/sobrepõe/);
    await capture('costas');await reload();assert.deepEqual(await js('[M.B.pos.x,M.B.pos.z,M.B.side]'),[0,4,-1]);
  });

  await check('máquinas automáticas conservam espaçamento de três unidades e fixture',async()=>{
    await load([auto('SPI-A',-14,0),auto('SPI-B',0,0),auto('AUTO-TEST',16,0,'AUTO')]);
    assert.equal(await js('validateMachine(M["SPI-B"],A["custom-1"],-7,0)'),'');
    assert.match(await js('validateMachine(M["SPI-B"],A["custom-1"],-8,0)'),/3 unidades/);
    assert.ok(await js('M["AUTO-TEST"].fixture && M["AUTO-TEST"].operator.position.z===M["AUTO-TEST"].d*.32'));
  });

  await check('flexibilização entre bancadas não permite atravessar esteira existente',async()=>{
    await load([station('A',0,0),station('B',0,10),auto('SPI',18,-4)]);await tool('flow');await connect('A','SPI');
    assert.equal(await js('E.links.length'),1);
    assert.match(await js('validateMachine(M.B,A["custom-1"],0,-4)'),/passagem|esteira/);
  });

  await check('instalação lateral, edição de ID, temas e restauração preservam posto e operador',async()=>{
    await load([]);await tool('stations');await click('[data-edcatalog="0"]');
    const point=await project(0,4,.136);await move(point);await down(point);await up(point);await until('!!installPending');
    await change('#edInstallMode','lateral');
    assert.ok(await js('Math.abs(installPreview.model.children[0].position.z-installPreview.model.userData.operator.position.z)===2'));
    await js('document.querySelector("#edInstallId").value="BAN-NOVA"');await click('#edInstallConfirm');await select('BAN-NOVA');
    await js('document.querySelector("#edEditId").value="BAN-EDITADA";document.querySelector("#edEditName").value="Operação manual"');await click('#edSaveMachine');
    await change('#edManualMode','parallel');await click('#themeSwitch');await paint();
    assert.ok(await js('M["BAN-EDITADA"].n==="Operação manual" && machineOutline.parent===M["BAN-EDITADA"].mesh'));
    await capture('white');await reload();
    assert.deepEqual(await js('[M["BAN-EDITADA"].n,manualDisposition(M["BAN-EDITADA"]),M["BAN-EDITADA"].operator.position.z]'),['Operação manual','parallel',.1]);
  });
  assert.deepEqual(errors,[]);console.log('OK  console sem erros');
}
