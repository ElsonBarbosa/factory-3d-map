import { writeFile } from 'node:fs/promises';

export async function run({ assert, send, js, until, boot, errors }) {
  const paint = () => js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const check = async (name,test) => { await test();console.log('OK  '+name); };
  const q = JSON.stringify;
  const mouse = (type,[x,y],props={}) => send('Input.dispatchMouseEvent',{type,x,y,...props});
  const move = (point,pressed=false) => mouse('mouseMoved',point,{button:pressed?'left':'none',buttons:pressed?1:0});
  const press = point => mouse('mousePressed',point,{button:'left',buttons:1,clickCount:1});
  const release = point => mouse('mouseReleased',point,{button:'left',buttons:0,clickCount:1});
  const clickAt = async point => { await move(point);await press(point);await release(point); };
  const center = selector => js(`(() => {
    const el=document.querySelector(${q(selector)});
    if(!el)throw Error('Controle ausente: '+${q(selector)});
    for(let ancestor=el.parentElement;ancestor;ancestor=ancestor.parentElement){if(ancestor.tagName==='DETAILS')ancestor.open=true;}
    if(el.closest('#edDrawer'))el.scrollIntoView({block:'center'});
    const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    if(!el.contains(document.elementFromPoint(x,y)))throw Error('Controle encoberto: '+${q(selector)});
    return [x,y];
  })()`);
  const click = async selector => clickAt(await center(selector));
  const tab = async mode => {
    if(await js('!!document.querySelector("#edBack")'))await click('#edBack');
    return click(`[data-edtab="${mode}"]`);
  };
  const camera = async (distance=62) => {
    await js(`stopCameraKeys();cam.th=0;cam.ph=.72;cam.d=goal.d=${distance};
      goal.t.set(-10,0,0);cam.t.copy(goal.t);void 0`);
    await paint();
  };
  const pose = () => js('[...cam.t.toArray(),...goal.t.toArray(),cam.d,cam.th,cam.ph]');
  const project = (x,z,y=1) => js(`(() => {
    const r=cv.getBoundingClientRect(),p=new THREE.Vector3(${x},${y},${z}).project(cam3);
    return [r.x+(p.x*.5+.5)*r.width,r.y+(-p.y*.5+.5)*r.height];
  })()`);
  const pickMachine = async id => {
    await paint();
    const [x,z,y] = await js(`(() => {
      const m=M[${q(id)}],part=m.mesh.children[m.station?0:1],p=part.getWorldPosition(new THREE.Vector3());
      return [p.x,p.z,p.y];
    })()`);
    await clickAt(await project(x,z,y));
    await until(`E.machineSelected===${q(id)} && machineOutline.parent===M[${q(id)}].mesh`);
  };
  const visibleEditor = () => until(`(() => {
    const title=document.querySelector('#edSelectedEquipmentTitle'),form=document.querySelector('#edSaveMachine');
    if(!title||!form)return false;
    const r=editorDrawer.getBoundingClientRect(),tabs=ED.querySelector('.edtabline').getBoundingClientRect();
    if(document.querySelector('#mapViewport'))return !E.editorCollapsed &&
      title.getBoundingClientRect().top>=tabs.bottom-1 && form.getBoundingClientRect().bottom<r.bottom;
    return title.getBoundingClientRect().top>=tabs.bottom-1 && form.getBoundingClientRect().bottom<r.bottom &&
      editorDrawer.scrollTop>0;
  })()`);
  const value = (selector,text) => js(`document.querySelector(${q(selector)}).value=${q(text)}`);
  const reload = async () => { await send('Page.reload');await until('document.readyState==="complete"');await boot(); };
  const key = (name,code,vk,down) => send('Input.dispatchKeyEvent',{type:down?'rawKeyDown':'keyUp',key:name,code,windowsVirtualKeyCode:vk});

  const data = {version:3,blank:true,process:{x:0,z:0,w:78,d:54},areas:[
    {id:'custom-1',n:'SMT',x:0,z:0,w:42,d:32,hue:210,custom:true}
  ],machines:[
    {id:'SPI-01',n:'Inspeção de pasta',a:'custom-1',dx:-7,dz:-2,rot:0,w:4,h:2.6,d:4,kind:'SPI'},
    {id:'NXT-01',n:'Montadora NXT',a:'custom-1',dx:7,dz:-2,rot:0,w:6,h:2.8,d:4,kind:'NXT'},
    {id:'INS-01',n:'Inserção manual',a:'custom-1',dx:2,dz:9,rot:0,w:5,h:2.3,d:5,kind:'INS',station:true}
  ],links:[{from:'SPI-01',to:'NXT-01'}],flowDir:1};
  await js(`localStorage.setItem('factory3dmap.layout.v1',${q(JSON.stringify(data))})`);
  await reload();await click('#editToggle');await tab('areas');await camera();

  await check('seleção no mapa abre Equip. e rola apenas o editor, com contorno sobre o modelo',async()=>{
    const before=await pose(), pageTop=await js('document.scrollingElement.scrollTop');
    const original=await js('M["SPI-01"].mesh.children.map(o=>[o.material.uuid,o.material.color.getHex(),o.material.emissive?.getHex()])');
    await pickMachine('SPI-01');await visibleEditor();
    assert.equal(await js('E.mode'),'machines');
    assert.equal(await js('document.querySelector(".edselected-name").textContent'),'SPI-01 · Inspeção de pasta');
    assert.equal(await js('document.querySelectorAll("#edEditId").length'),1);
    assert.ok(await js('(()=>{const card=document.querySelector("#edSelectedEquipment"),catalog=card.nextElementSibling?.classList.contains("edcatalog-section")?card.nextElementSibling:card.previousElementSibling;return catalog?.querySelectorAll(".edcatalog-card").length>0})()'));
    assert.ok(await js(`machineOutline.children.length>=2 && machineOutline.children.every(o=>
      o.isLineSegments && o.material===machineOutlineMaterial && o.material.depthTest && !o.material.depthWrite && !pick.includes(o))`));
    assert.deepEqual(await js('M["SPI-01"].mesh.children.filter(o=>o.isMesh).map(o=>[o.material.uuid,o.material.color.getHex(),o.material.emissive?.getHex()])'),original);
    assert.deepEqual(await pose(),before);
    assert.equal(await js('document.scrollingElement.scrollTop'),pageTop);
    if(process.env.VF_TEST_SELECTION_SCREENSHOT){
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(process.env.VF_TEST_SELECTION_SCREENSHOT,Buffer.from(data,'base64'));
    }
  });

  await check('destaque permanece no tema White sem alterar a seleção',async()=>{
    const material=await js('machineOutlineMaterial.uuid');
    await click('#themeSwitch');await paint();
    assert.equal(await js('document.documentElement.dataset.theme'),'light');
    assert.ok(await js('E.machineSelected==="SPI-01" && machineOutline.parent===M["SPI-01"].mesh'));
    assert.equal(await js('machineOutlineMaterial.uuid'),material);
    if(process.env.VF_TEST_SELECTION_SCREENSHOT){
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(process.env.VF_TEST_SELECTION_SCREENSHOT.replace(/\.png$/,'-white.png'),Buffer.from(data,'base64'));
    }
    await click('#themeSwitch');await paint();
  });

  await check('repetir clique revela o editor e troca de aba preserva seleção sem rolar o catálogo',async()=>{
    await js('editorDrawer.scrollTo({top:0,behavior:"instant"})');
    await pickMachine('SPI-01');await visibleEditor();
    await tab('flow');
    assert.ok(await js('E.machineSelected==="SPI-01" && machineOutline.parent===M["SPI-01"].mesh'));
    await tab('machines');await paint();
    assert.equal(await js('editorDrawer.scrollTop'),0);
    assert.equal(await js('document.querySelector("#edEditId").value'),'SPI-01');
    const card=await center('[data-edcatalog="0"]'),scrollBefore=await js('editorDrawer.scrollTop');
    await move(card);await paint();
    assert.equal(await js('editorDrawer.scrollTop'),scrollBefore);
    assert.equal(await js('E.machineSelected'),'SPI-01');
  });

  await check('clique a partir de Processo troca o contorno e preserva o piso e a câmera',async()=>{
    await tab('process');await paint();
    const floor=await js('({...E.process})'),before=await pose();
    await js(`window.disposedLines=0;window.previousLines=[...machineOutline.children];
      for(const line of previousLines)line.geometry.addEventListener('dispose',()=>disposedLines++);void 0`);
    await pickMachine('NXT-01');await visibleEditor();
    assert.equal(await js('document.querySelector(".edselected-name").textContent'),'NXT-01 · Montadora NXT');
    assert.ok(await js('disposedLines===previousLines.length && !M["SPI-01"].mesh.children.includes(machineOutline)'));
    assert.deepEqual(await js('({...E.process})'),floor);
    assert.deepEqual(await pose(),before);
  });

  await check('renomear, rotacionar e arrastar mantêm o contorno vinculado ao mesmo modelo',async()=>{
    await js('window.firstLine=machineOutline.children[0];void 0');
    await value('#edEditId','NXT-R');await value('#edEditName','Montadora revisada');await value('#edEditRotation','1');
    await click('#edSaveMachine');await paint();
    assert.ok(await js(`!M['NXT-01'] && E.machineSelected==='NXT-R' && M['NXT-R'].lb.textContent==='NXT-R' &&
      E.links[0].to==='NXT-R' && machineOutline.children[0]===firstLine &&
      Math.abs(machineOutline.getWorldQuaternion(new THREE.Quaternion()).y-Math.SQRT1_2)<1e-6`));
    assert.equal(await js('document.querySelector(".edselected-name").textContent'),'NXT-R · Montadora revisada');
    const a=await project(7,-2),b=await project(9,1);
    await move(a);await press(a);await until('E.drag?.kind==="machine-move"');
    await move(b,true);await paint();await release(b);
    await until('!E.drag && M["NXT-R"].pos.x===9 && M["NXT-R"].pos.z===1');
    assert.ok(await js('machineOutline.getWorldPosition(new THREE.Vector3()).distanceTo(M["NXT-R"].pos)<1e-8'));
    assert.ok(await js('machineOutline.children[0]===firstLine'));
  });

  await check('WASD mantém a seleção e alterna com o mapa e estações',async()=>{
    const before=await js('goal.t.z');
    await key('w','KeyW',87,true);await until(`goal.t.z<${before-2}`);await key('w','KeyW',87,false);
    await until('cameraKeyVelocity.z===0');
    assert.ok(await js('E.machineSelected==="NXT-R" && machineOutline.parent===M["NXT-R"].mesh'));
    await camera();
    await pickMachine('INS-01');await visibleEditor();
    assert.equal(await js('E.mode'),'stations');
    assert.equal(await js('document.querySelector("#edSelectedEquipmentTitle").textContent'),'Estação selecionada');
    await pickMachine('SPI-01');await visibleEditor();
    assert.equal(await js('E.mode'),'machines');
  });

  await check('alternar seleção libera geometrias e reutiliza um único material',async()=>{
    await paint();
    const before=await js('[rd.info.memory.geometries,pick.length]');
    await js('window.outlineDisposals=0;window.outlineExpected=0;void 0');
    for(let i=0;i<5;i++){
      for(const id of ['NXT-R','SPI-01']){
        await js(`for(const o of machineOutline.children){outlineExpected++;o.geometry.addEventListener('dispose',()=>outlineDisposals++)}void 0`);
        await pickMachine(id);await paint();
      }
    }
    assert.deepEqual(await js('[rd.info.memory.geometries,pick.length]'),before);
    assert.ok(await js('outlineExpected>0 && outlineDisposals===outlineExpected && machineOutline.children.every(o=>o.material===machineOutlineMaterial)'));
  });

  await check('desseleção, exclusão e saída limpam contorno e formulário',async()=>{
    await clickAt(await project(2,-10,0));
    assert.ok(await js('!E.machineSelected && !machineOutline.parent && !machineOutline.children.length'));
    await tab('machines');
    assert.match(await js('document.querySelector("#edSelectedEquipment").textContent'),/Nenhum equipamento selecionado/);
    await pickMachine('NXT-R');await key('Delete','Delete',46,true);await key('Delete','Delete',46,false);
    await until('!M["NXT-R"]');
    assert.ok(await js('!E.machineSelected && !machineOutline.parent && !machineOutline.children.length && !E.links.length'));
    assert.equal(await js('!!document.querySelector("#edEditId")'),false);
    await camera();await pickMachine('SPI-01');await click('#edExit');
    assert.ok(await js('!E.on && !E.machineSelected && !machineOutline.parent'));
  });

  await check('recarga e restauração da demo começam sem referências antigas',async()=>{
    await reload();
    assert.ok(await js('M["SPI-01"] && !M["NXT-R"] && !E.machineSelected && !machineOutline.parent'));
    await click('#editToggle');await camera();await pickMachine('SPI-01');await visibleEditor();
    if(await js('typeof E.editorHome==="boolean" && !!document.querySelector("#edBack")'))await tab('process');
    await click('#edResetProcess');
    await until('typeof E!=="undefined" && !E.blank && MS.length===28');
    assert.ok(await js('!E.machineSelected && !machineOutline.parent && !machineOutline.children.length'));
  });
  assert.deepEqual(errors,[],'Erros no console ou exceções de página');
  console.log('OK  console sem erros');
}
