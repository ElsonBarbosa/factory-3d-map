export async function run({ assert, send, js, until, boot, sleep, errors }) {
  const key = 'factory3dmap.layout.v1';
  const cases = [];
  const test = (name, fn) => cases.push([name, fn]);
  const q = selector => JSON.stringify(selector);
  const mouse = (type, [x, y], props = {}) => send('Input.dispatchMouseEvent', { type, x, y, ...props });
  const move = (p, buttons = 0, modifiers = 0) => mouse('mouseMoved', p, { button: buttons ? 'left' : 'none', buttons, modifiers });
  const press = (p, modifiers = 0) => mouse('mousePressed', p, { button: 'left', buttons: 1, clickCount: 1, modifiers });
  const release = (p, modifiers = 0) => mouse('mouseReleased', p, { button: 'left', buttons: 0, clickCount: 1, modifiers });
  const clickAt = async p => { await move(p); await press(p); await release(p); };
  const paint = () => js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const center = async selector => {
    await until(`!!document.querySelector(${q(selector)})`,4000);
    if(selector.includes('data-corner')||selector.startsWith('.flow-port'))await paint();
    return js(`(() => {
    const el=document.querySelector(${q(selector)});
    if(!el)throw Error(${q('Elemento ausente: ' + selector)});
    for(let ancestor=el.parentElement;ancestor;ancestor=ancestor.parentElement){if(ancestor.tagName==='DETAILS')ancestor.open=true;}
    if(el.closest('#edDrawer,#edInstallOverlay,#panel,.side'))el.scrollIntoView({block:'center'});
    const r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;
    const hit=document.elementFromPoint(x,y);
    if(!el.contains(hit))throw Error(${q('Elemento encoberto: ' + selector)}+' ('+x+','+y+' por '+(hit?.id||hit?.className)+')');
    return [x,y];
  })()`);
  };
  const click = async s => {if(s.startsWith('.side ')){const id=s.match(/data-a="([^"]+)"/)[1];await js('areaJump.value='+JSON.stringify(id)+';areaJump.dispatchEvent(new Event("change"))');return}return clickAt(await center(s))};
  const value = (s, v) => js(`document.querySelector(${q(s)}).value=${q(String(v))}`);
  const keyPress = async (key, code = key, windowsVirtualKeyCode = key === 'Delete' ? 46 : 27) => {
    const params = { key, code, windowsVirtualKeyCode };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  };
  const tab = async t => {
    if(await js('!!document.querySelector("#edBack")'))await click('#edBack');
    return click(`[data-edtab="${t}"]`);
  };
  const pos = id => js(`[M[${q(id)}].pos.x,M[${q(id)}].pos.z]`);
  const project = (x,z,y=0) => js(`(() => {
    const v=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();
    return [r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height]
  })()`);
  const camera = async (x,z,d=58) => {
    await js(`goal.t.set(${x},0,${z});cam.t.copy(goal.t);cam.th=0;cam.ph=.72;cam.d=goal.d=${d}`);
    await paint();
  };
  const drag = async (a, b, modifiers = 0, via, checkpoint) => {
    await move(a,0,modifiers); await sleep(100); await press(a,modifiers);
    await sleep(90);
    if (via) { await move(via,1,modifiers);await paint();if(checkpoint)await checkpoint(); }
    await move(b,1,modifiers);await sleep(120);await release(b,modifiers);
  };
  const reload = async () => {
    await send('Page.reload');
    await until('document.readyState === "complete"');
    await boot();
  };
  const reset = async () => { await js(`localStorage.removeItem(${q(key)})`); await reload(); };
  const fresh = async () => {
    await click('#editToggle');
    if(await js('!!document.querySelector(".edmain-menu")'))await tab('process');
    await click('#edNewProcess'); await until('E.blank && !E.processReady');
  };
  const dimensions = async (w,d) => {
    await value('#edProcessW',w); await value('#edProcessD',d); await click('#edProcessApply');
  };
  const addArea = async name => {
    await click('#edOpenArea'); await value('#edNewName',name); await click('#edAddArea');
    return js('E.selected');
  };
  const areaEdit = async (w,d,name) => {
    await value('#edWidth',w); await value('#edDepth',d);
    if(name)await value('#edRename',name);
    await click('#edApply');
  };
  const editMachine = async (id,name,rotation) => {
    await value('#edEditId',id); await value('#edEditName',name); await value('#edEditRotation',rotation);
    await click('#edSaveMachine');
  };
  const port = (id,side) => `.flow-port[data-machine="${id}"][data-side="${side}"]`;
  const connect = async (from,to) => { await click(port(from,'out')); await click(port(to,'in')); };
  const near = (a,b) => assert.ok(Math.abs(a-b)<.2,`${a} ≉ ${b}`);
  let dragIntercept;
  const catalogueDrag = async (i,p,during) => {
    await send('Input.setInterceptDrags',{ enabled: true });
    const a = await center(`[data-edcatalog="${i}"]`);
    const dragPromise = new Promise(resolve => { dragIntercept=resolve; });
    await move(a); await press(a); await move([a[0]+22,a[1]+5],1);
    const { data } = await Promise.race([dragPromise,sleep(2500).then(()=>{throw Error('Drag nativo não iniciou');})]);
    const [x,y]=p;
    await send('Input.dispatchDragEvent',{ type:'dragEnter', x,y,data });
    await send('Input.dispatchDragEvent',{ type:'dragOver', x,y,data });
    if(during)await during();
    await send('Input.dispatchDragEvent',{ type:'drop', x,y,data });
    await release(p);
    await send('Input.setInterceptDrags',{ enabled: false });
  };
  const install = async (i,id,x,z) => {
    await catalogueDrag(i,await project(x,z),async()=>{
      assert.ok(await js('ghost.visible && ghostModel && (()=>{let valid=true;ghostModel.traverse(o=>{if(o.isMesh)valid=valid&&o.material.transparent&&o.material.opacity===.52});return valid})()'));
    });
    await until('!!installPending');
    assert.ok(await js('!!document.querySelector("#edInstallVisual canvas")'));
    await value('#edInstallId',id); await click('#edInstallConfirm');
    await until(`!!M[${q(id)}]`);
    assert.deepEqual(await pos(id),[x,z]);
  };
  // CDP emite dragIntercepted antes da etapa dragEnter.
  run.onDrag = event => dragIntercept?.(event);

  test('demonstração, identidade, câmera e painéis', async () => {
    assert.deepEqual(await js('[AL.length,MS.length,boards.length]'),[7,28,30]);
    await click('#themeSwitch');
    assert.equal(await js('document.documentElement.dataset.theme'),'dark');
    assert.ok(await js('document.querySelector(".project-bar img").getAttribute("src")==="brand.svg"'));
    await click('#themeSwitch');
    assert.equal(await js('document.documentElement.dataset.theme'),'light');
    await click('.side [data-a="smt"]');
    assert.match(await js('panel.querySelector("h2").textContent'),/SMT/);
    await click('panel [data-m="SPI-01"], #panel [data-m="SPI-01"]');
    assert.match(await js('panel.querySelector("h2").textContent'),/Inspeção de pasta/);
    await click('[data-home]');
    await camera(0,0,95);
    const th=await js('cam.th');
    for(let i=0;i<4;i++)await drag([670,390],[950,390]);
    assert.ok(Math.abs((await js('cam.th'))-th)>Math.PI*2);
    const d=await js('goal.d');
    await mouse('mouseWheel',[780,410],{deltaX:0,deltaY:-120});
    assert.ok(await js('goal.d')<d);
    await click('#editToggle');
    const before=await js('[goal.t.x,goal.t.z,cam.th]');
    await drag([700,370],[770,420],2);
    const after=await js('[goal.t.x,goal.t.z,cam.th]');
    assert.notEqual(after[0],before[0]);assert.notEqual(after[1],before[1]);assert.equal(after[2],before[2]);
    await click('#edExit');
    const shiftStart=await js('goal.t.x');
    await drag([700,370],[750,370],8);
    assert.notEqual(await js('goal.t.x'),shiftStart);
    const rightStart=await js('goal.t.z');
    await mouse('mousePressed',[700,370],{button:'right',buttons:2,clickCount:1});
    await mouse('mouseMoved',[700,420],{button:'right',buttons:2});await paint();
    await mouse('mouseReleased',[700,420],{button:'right',buttons:0,clickCount:1});
    assert.notEqual(await js('goal.t.z'),rightStart);
  });

  test('edições e exclusões da demonstração persistem', async () => {
    await reset();await click('#editToggle');await tab('machines');
    await click('[data-edmachine="SPI-01"]');
    await editMachine('SPI-DEMO','SPI revisada',0);
    assert.ok(await js('M["SPI-DEMO"]?.n==="SPI revisada"'));
    await reload();
    assert.ok(await js('M["SPI-DEMO"]?.n==="SPI revisada" && !M["SPI-01"]'));
    await click('#editToggle');await tab('machines');await click('[data-edmachine="SPI-DEMO"]');
    await keyPress('Delete');await until('!M["SPI-DEMO"]');
    await reload();
    assert.ok(await js('!M["SPI-DEMO"] && !M["SPI-01"]'));
    await click('#editToggle');await tab('process');await camera(0,0,85);
    const belt=await js('sc.children.find(o=>o.material===beltM).position.toArray()');
    await drag(await project(0,0),await project(3,-2));
    const translated=await js('sc.children.find(o=>o.material===beltM).position.toArray()');
    near(translated[0]-belt[0],3);near(translated[2]-belt[2],-2);
    await reload();
    assert.deepEqual(await js('sc.children.find(o=>o.material===beltM).position.toArray()'),translated);
  });

  test('processo novo, quatro cantos e dimensões independentes', async () => {
    await reset();await fresh();await camera(-13,0,126);
    assert.deepEqual(await js('[AL.length,MS.length,pick.length,boards.length,E.links.length,sc.children.filter(o=>o.material===beltM).length,sc.children.filter(o=>o.isLineSegments).length]'),[0,0,0,0,0,0,1]);
    await dimensions(2,36);assert.equal(await js('E.process.w'),48);
    await dimensions(52,36);assert.deepEqual(await js('[E.process.w,E.process.d]'),[52,36]);
    await dimensions(52,40);assert.deepEqual(await js('[E.process.w,E.process.d]'),[52,40]);
    for(let i=0;i<4;i++){
      const b=await js('boxOf(E.process)');
      const x=i%2?b.x1+2:b.x0-2,z=i<2?b.z0-1:b.z1+1;
      await drag(await center(`[data-corner="${i}"]`),await project(x,z));
      assert.ok(await js(`E.process.w>${b.x1-b.x0} && E.process.d>${b.z1-b.z0}`),
        `Canto ${i} ${JSON.stringify(b)} → ${JSON.stringify(await js('E.process'))}`);
    }
  });

  test('SMT, instalação, conexão, movimento, redimensionamento e recarga', async () => {
    await reset();await fresh();await dimensions(74,58);await tab('areas');
    const id=await addArea('SMT');
    await areaEdit(40,24,'SMT <Linha 2>');
    // A área nasce junto à borda. Mova antes de expandir o piso.
    assert.equal(await js('A[E.selected].w'),10);
    const a=await js('({x:A[E.selected].x,z:A[E.selected].z})');
    await camera(a.x+5,a.z+5,103);
    await drag(await project(a.x,a.z,.12),await project(a.x+22,a.z+17,.12));
    await areaEdit(40,24,'SMT <Linha 2>');
    assert.equal(await js('A[E.selected].w'),40,await js('JSON.stringify([A[E.selected].x,A[E.selected].z,document.querySelector("#edStatus").textContent])'));
    const [x,z]=await js('[A[E.selected].x,A[E.selected].z]');
    await camera(x-7,z,80);await tab('machines');
    assert.ok(await js('[...document.querySelectorAll(".edcatalog-card img")].every(i=>i.complete && i.naturalWidth===230 && i.src.startsWith("data:image/png"))'));
    await install(0,'SPI-T',x-10,z);
    await catalogueDrag(1,await project(x-9,z));
    assert.match(await js('document.querySelector("#edStatus").textContent'),/sobrepõe/);
    await catalogueDrag(1,await project(x-3,z));
    assert.match(await js('document.querySelector("#edStatus").textContent'),/3 unidades/);
    await install(1,'NXT-T',x+2,z);
    await catalogueDrag(2,await project(x+23,z));
    assert.match(await js('document.querySelector("#edStatus").textContent'),/dentro de uma área/);
    await clickAt(await project(x+2,z,1.2));
    assert.equal(await js('E.machineSelected'),'NXT-T');
    for(const r of [1,2,3,0]){await editMachine('NXT-T','NXT <editada>',r);assert.equal(await js('M["NXT-T"].rot'),r);}
    await tab('flow');await connect('SPI-T','NXT-T');
    assert.equal(await js('E.links.length'),1);
    assert.ok(await js('E.links[0].movers.length>1 && E.links[0].smoke.length===16'));
    await until('E.links[0].smoke.some(p=>p.visible && p.material.opacity>0)');
    await connect('SPI-T','NXT-T');assert.match(await js('document.querySelector("#edStatus").textContent'),/já estão conectados/);
    await tab('machines');await click('[data-edmachine="NXT-T"]');
    await drag(await project(x+2,z,1.2),await project(x+5,z+3,1.2));
    assert.deepEqual(await pos('NXT-T'),[x+5,z+3]);
    assert.ok(await js('E.links[0].points.at(-1).distanceTo(portsFor(M["NXT-T"]).inInner)<1e-8'));
    await editMachine('NXT-R','NXT <editada>',1);
    assert.ok(await js('E.links[0].to==="NXT-R"'));
    assert.ok(await js(`(() => {
      const p=portsFor(M["NXT-R"]);
      return E.links[0].curve.getTangent(1).dot(p.inInner.clone().sub(p.in).normalize())>.99;
    })()`));
    await tab('areas');await click(`[data-edarea="${id}"]`);
    await areaEdit(8,8);assert.equal(await js('A[E.selected].w'),40);
    await areaEdit(42,26);
    assert.deepEqual(await pos('SPI-T'),[x-10,z]);
    assert.deepEqual(await pos('NXT-R'),[x+5,z+3]);
    await click('#edDelete');
    assert.match(await js('document.querySelector("#edStatus").textContent'),/remova primeiro/);
    await reload();
    assert.deepEqual(await pos('NXT-R'),[x+5,z+3]);
    assert.deepEqual(await js(`[A[${q(id)}].n,A[${q(id)}].w,A[${q(id)}].d,M["NXT-R"].rot,E.links[0].to]`),['SMT <Linha 2>',42,26,1,'NXT-R']);
    await click(`.side [data-a="${id}"]`);
    assert.equal(await js('panel.querySelector("h2").textContent'),'SMT <Linha 2>');
    await click('#editToggle');await tab('process');await camera(x,z,82);
    const before=await js('[E.process.x,E.process.z,M["NXT-R"].pos.x,M["NXT-R"].pos.z]');
    await drag(await project(x,z),await project(x+3,z+2));
    const after=await js('[E.process.x,E.process.z,M["NXT-R"].pos.x,M["NXT-R"].pos.z]');
    near(after[0]-before[0],3);near(after[1]-before[1],2);
    near(after[2]-before[2],after[0]-before[0]);near(after[3]-before[3],after[1]-before[1]);
    assert.ok(await js('E.links[0].points.at(-1).distanceTo(portsFor(M["NXT-R"]).inInner)<1e-8'));
    await tab('machines');await click('[data-edmachine="NXT-R"]');await keyPress('Delete');
    await until('!M["NXT-R"] && E.links.length===0');
    await reload();assert.ok(await js('!M["NXT-R"] && E.links.length===0 && !!M["SPI-T"]'));
  });

  test('localStorage inválido e remoção de área com lacuna de IDs', async () => {
    for(const raw of ['{incompleto',JSON.stringify({version:3,blank:true,process:{x:0,z:0,w:1e9,d:30},areas:[]})]){
      await js(`localStorage.setItem(${q(key)},${q(raw)})`);await reload();
      assert.deepEqual(await js('[AL.length,MS.length,E.process.w]'),[7,28,84]);
    }
    await reset();await fresh();await dimensions(52,42);await tab('areas');
    const deleted=await addArea('Remover');
    const retained=await addArea('Manter');
    await click(`[data-edarea="${deleted}"]`);await click('#edDelete');
    await until(`!A[${q(deleted)}]`);
    await reload();
    assert.ok(await js(`!A[${q(deleted)}]&&A[${q(retained)}]?.n==="Manter"`));
    await click('#editToggle');
    if(await js('!!document.querySelector(".edmain-menu")'))await tab('process');
    await click('#edResetProcess');
    await until('typeof E!=="undefined" && !E.blank && AL.length===7 && MS.length===28');
  });

  const scenario = async ({ areas, machines, links = [] }, version = 3) => {
    const data = { version, blank: true, process: { x:0,z:0,w:100,d:80 }, processName: 'Linha de testes',
      flowDir: links.length?1:0, areas, machines, links };
    await js(`localStorage.setItem(${q(key)},${JSON.stringify(JSON.stringify(data))})`);
    await reload();
  };
  const fixtureArea = (id,x,z,w,d) => ({id:'custom-'+id,n:'Área '+id,x,z,w,d,hue:210,custom:true});
  const fixtureMachine = (id,a,dx,dz,rot=0) => ({id,n:id,a:'custom-'+a,dx,dz,rot,w:4,h:2.6,d:4,kind:'SPI',station:false});

  test('nomes com marcação são tratados como texto e a área ocupada abre o painel', async () => {
    const name='<b data-probe>Área literal</b>';
    await scenario({areas:[{...fixtureArea(1,0,0,24,16),n:name}],machines:[]});
    await click('.side [data-a="custom-1"]');
    assert.equal(await js('panel.querySelector("h2").textContent'),name);
    assert.equal(await js('!!panel.querySelector("[data-probe]")'),false);
    await scenario({areas:[fixtureArea(1,0,0,24,16)],machines:[fixtureMachine('SPI-TEST',1,0,0)]});
    await click('.side [data-a="custom-1"]');assert.match(await js('panel.textContent'),/Supervisor: —/);
    assert.ok(await js('A["custom-1"].oee===M["SPI-TEST"].oee'));
    await click('#panel [data-m="SPI-TEST"]');assert.ok(await js('!panel.textContent.includes("NaN")'));
  });

  test('estações, cadastro com ID repetido, Delete e descarte WebGL', async () => {
    await scenario({areas:[fixtureArea(4,0,0,32,24)],machines:[fixtureMachine('SPI-A',4,-8,0)]},2);
    await click('#editToggle');await camera(-5,0,67);await tab('stations');
    await catalogueDrag(0,await project(5,0));
    await until('!!installPending');
    await value('#edInstallId','SPI-A');await click('#edInstallConfirm');
    assert.match(await js('document.querySelector("#edInstallError").textContent'),/Já existe/);
    const previewDisposed=await js('window.previewContext=installPreview.renderer.getContext();!!previewContext');
    assert.ok(previewDisposed);
    await keyPress('Escape');await until('!installPending && !installPreview && previewContext.isContextLost()');
    await install(1,'INS-T',5,0);
    await paint();await clickAt(await project(5,1.4,1.1));assert.equal(await js('E.mode'),'stations');
    await editMachine('POSTO-T','Estação de inserção',3);
    assert.equal(await js('M["POSTO-T"].rot'),3);
    const desk=await js('M["POSTO-T"].mesh.children[0].getWorldPosition(new THREE.Vector3()).toArray()');
    await drag(await project(desk[0],desk[2],desk[1]+.5),await project(desk[0]+2,desk[2]+2,desk[1]+.5));
    assert.deepEqual(await pos('POSTO-T'),[7,2]);
    await reload();
    assert.ok(await js('isStation(M["POSTO-T"]) && M["POSTO-T"].rot===3'));
    await click('#editToggle');await tab('stations');await click('[data-edmachine="POSTO-T"]');
    await keyPress('Delete');await until('!M["POSTO-T"]');
    await reload();
    assert.ok(await js('!M["POSTO-T"] && !pick.some(o=>o.userData.m?.id==="POSTO-T")'));
  });

  test('posicionamento por clique, transferência entre áreas e desfazer esteira', async () => {
    await scenario({areas:[fixtureArea(1,-10,0,14,18),fixtureArea(2,12,0,16,18)],
      machines:[fixtureMachine('SPI-S',1,0,0)]});
    await click('#editToggle');await camera(-8,0,80);await tab('machines');
    await click('[data-edcatalog="1"]');await move(await project(12,1));await paint();
    assert.ok(await js('ghost.visible && ghostModel && (()=>{let valid=true;ghostModel.traverse(o=>{if(o.isMesh)valid=valid&&o.material.opacity===.52});return valid})()'));
    await clickAt(await project(12,1));await until('!!installPending');
    await value('#edInstallId','NXT-S');await click('#edInstallConfirm');
    assert.equal(await js('M["NXT-S"].a'),'custom-2');
    await tab('flow');await connect('SPI-S','NXT-S');assert.equal(await js('E.links.length'),1);
    await tab('machines');await click('[data-edmachine="SPI-S"]');await click('#edMoveMachine');
    await keyPress('Escape');assert.equal(await js('!!E.placing'),false);
    await click('#edMoveMachine');await clickAt(await project(8,-6));
    assert.equal(await js('M["SPI-S"].a'),'custom-2');assert.deepEqual(await pos('SPI-S'),[8,-6]);
    assert.ok(await js('E.links[0].points[0].distanceTo(portsFor(M["SPI-S"]).outInner)<1e-8'));
    await tab('flow');await click('#edUndoFlow');assert.equal(await js('E.links.length'),0);
    await reload();assert.deepEqual(await js('[M["SPI-S"].a,E.links.length]'),['custom-2',0]);
  });

  test('quatro cantos de área, recuperação após redução e colisões', async () => {
    await scenario({areas:[fixtureArea(5,0,0,18,16),fixtureArea(8,26,0,14,16)],
      machines:[fixtureMachine('SPI-C',5,0,0)]},1);
    await click('#editToggle');await tab('areas');await camera(-9,0,88);
    await click('[data-edarea="custom-5"]');
    for(let i=0;i<4;i++){
      const b=await js('boxOf(A[E.selected])'),x=i%2?b.x1+1:b.x0-1,z=i<2?b.z0-1:b.z1+1;
      await drag(await center(`[data-corner="${i}"]`),await project(x,z),0,await project(1,1),async()=>{
        assert.ok(await js('inside(A[E.selected],machineRect(M["SPI-C"],0,0),CLEARANCE)'));
        assert.deepEqual(await pos('SPI-C'),[0,0]);
      });
      assert.ok(await js(`A[E.selected].w>${b.x1-b.x0} && A[E.selected].d>${b.z1-b.z0}`));
      assert.deepEqual(await pos('SPI-C'),[0,0]);
    }
    const before=await js('[A[E.selected].x,A[E.selected].z]');
    await drag(await project(4,4,.12),await project(24,4,.12));
    assert.deepEqual(await js('[A[E.selected].x,A[E.selected].z]'),before);
    await drag(await project(4,4,.12),await project(0,9,.12));
    assert.deepEqual(await pos('SPI-C'),[-4,5]);
  });

  test('retorno em U, ciclos, sentido das setas e exclusão da esteira', async () => {
    await scenario({areas:[fixtureArea(7,0,0,44,32)],machines:[
      fixtureMachine('A-T',7,-10,-6),fixtureMachine('B-T',7,9,-6),fixtureMachine('C-T',7,-5,8,2),
      fixtureMachine('D-T',7,13,7)]});
    await click('#editToggle');await camera(-8,0,82);await tab('flow');
    await js('window.testFrameTime=0;const animateForTest=animateLinks;animateLinks=t=>{window.testFrameTime=t;animateForTest(t)};void 0');
    await connect('B-T','A-T');
    assert.match(await js('document.querySelector("#edStatus").textContent'),/da esquerda para a direita/);
    await connect('A-T','B-T');await connect('A-T','D-T');
    assert.match(await js('document.querySelector("#edStatus").textContent'),/já tem uma esteira de saída/);
    await connect('B-T','C-T');
    assert.equal(await js('E.links.length'),2);
    assert.ok(await js(`(() => {
      const l=E.links[1],a=portsFor(M[l.from]),b=portsFor(M[l.to]);
      return l.curve.curves.some(c=>c.type==='QuadraticBezierCurve3') &&
        l.curve.getPoint(0).distanceTo(a.outInner)<1e-8 && l.curve.getPoint(1).distanceTo(b.inInner)<1e-8 &&
        Math.max(...l.points.map(p=>p.x))>M[l.from].pos.x+4 &&
        l.movers.some(m=>m.obj.geometry.type==='ShapeGeometry') && l.ribbon.geometry.index.count>0;
    })()`));
    await connect('C-T','A-T');assert.match(await js('document.querySelector("#edStatus").textContent'),/ciclo/);
    await until('E.links.every(l=>!l.animated && !l.smoke.length)',8000);
    assert.ok(await js(`(() => {
      const l=E.links[1], item=l.movers.find(m=>m.obj.geometry.type==='ShapeGeometry');
      const dir=new THREE.Vector3(1,0,0).applyQuaternion(item.obj.quaternion);
      const {angle}=linkAt(l,item.offset+testFrameTime*.0032);
      return dir.dot(new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)))>.99;
    })()`));
    const pathPoint=await js('E.links[1].curve.getPoint(.4).toArray()');
    await clickAt(await project(pathPoint[0],pathPoint[2],.53));assert.ok(await js('E.linkSelected===E.links[1]'));
    await js('window.removedLink=E.linkSelected;void 0');
    await keyPress('Delete');await until('E.links.length===1');
    assert.ok(await js('!removedLink.group.parent'));
    await reload();assert.deepEqual(await js('E.links.map(l=>[l.from,l.to])'),[['A-T','B-T']]);
  });

  test('folga exata de 3 unidades e capacidade de renderização com várias linhas', async () => {
    const areas=[],machines=[],links=[];
    for(let n=0;n<6;n++){
      areas.push(fixtureArea(n+1,n%2?24:-24,-24+Math.floor(n/2)*24,42,16));
      for(let i=0;i<4;i++){
        machines.push(fixtureMachine('T-'+n+'-'+i,n+1,-14+7*i,0));
        if(i)links.push({from:'T-'+n+'-'+(i-1),to:'T-'+n+'-'+i});
      }
    }
    await scenario({areas,machines,links});
    assert.deepEqual(await js('[AL.length,MS.length,E.links.length]'),[6,24,18]);
    const before=await js('({frame:rd.info.render.frame,g:rd.info.memory.geometries})');
    assert.equal(await js('validateMachine(M["T-0-1"],A["custom-1"],-31,-24)'),'');
    await js(`window.floorGeo=AL[0].floor.geometry;
      for(let i=0;i<6;i++){moveProcessTo(i+1,i);moveProcessTo(0,0)};void 0`);
    await paint();
    const after=await js('({frame:rd.info.render.frame,g:rd.info.memory.geometries,sameFloor:floorGeo===AL[0].floor.geometry})');
    assert.ok(after.frame>before.frame && after.g<=before.g && after.sameFloor,JSON.stringify({before,after}));
    console.log('    WebGL com 6 áreas, 24 equipamentos, 18 esteiras:',JSON.stringify({geometriasAntes:before.g,geometriasDepois:after.g}));
    await fresh();await paint();
    assert.deepEqual(await js('[AL.length,MS.length,E.links.length,pick.length]'),[0,0,0,0]);
    assert.ok(await js('rd.info.memory.geometries<20'));
  });

  test('editor e confirmação em janela estreita', async () => {
    await scenario({areas:[fixtureArea(2,0,0,30,20)],machines:[]});
    const resize = (width,height) => send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await resize(800,600);
    try {
      await click('.side [data-a="custom-2"]');await click('#editToggle');await tab('machines');
      // A barra inferior ocupa uma faixa própria. A cena continua livre acima dela.
      assert.ok(await js('stage.clientHeight>(document.querySelector("#mapViewport")?140:220) && panel.clientHeight<200'),
        await js('JSON.stringify({map:stage.clientHeight,panel:panel.clientHeight,toolbar:document.querySelector("#edDrawer").clientHeight,header:document.querySelector(".project-bar").clientHeight})'));
      // Isola o layout do modal. O drop foi exercitado no cenário de desktop.
      await js('openInstallDialog({a:"custom-2",c:catalogue[0],station:false,x:0,z:0,rot:0})');
      assert.ok(await js(`(() => {
        const dialog=document.querySelector('.edinstall-dialog').getBoundingClientRect(),r=stage.getBoundingClientRect();
        return dialog.top>=r.top && dialog.bottom<=r.bottom && dialog.width<=r.width;
      })()`));
      await click('#edInstallCancel');assert.equal(await js('!!installPending'),false);
    } finally { await resize(1800,1080); }
  });

  test('recuperação de layout antigo com esteiras inconsistentes', async () => {
    await scenario({areas:[fixtureArea(1,0,0,44,16)],machines:[
      fixtureMachine('L-A',1,-12,0),fixtureMachine('L-B',1,0,0),fixtureMachine('L-C',1,12,0)
    ],links:[
      {from:'L-A',to:'L-B'},{from:'L-A',to:'L-C'},{from:'L-B',to:'L-C'},
      {from:'L-C',to:'L-A'},{from:'AUSENTE',to:'L-A'}
    ]});
    assert.deepEqual(await js('[AL.length,MS.length,E.links.map(l=>[l.from,l.to])]'),[1,3,[['L-A','L-B'],['L-B','L-C']]]);
    await click('#editToggle');assert.match(await js('(document.querySelector("#edStatus")||document.querySelector("#edMenuMessage")).textContent'),/Algumas esteiras inválidas/);
    await js(`window.beforeSaveFailure=localStorage.getItem(${q(key)});window.realSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=()=>{throw new DOMException('Cota simulada','QuotaExceededError')};void 0`);
    try {
      await tab('areas');await click('[data-edarea="custom-1"]');await areaEdit(46,16,'Área revisada');
      assert.match(await js('document.querySelector("#edStatus").textContent'),/Não foi possível salvar/);
      assert.ok(await js(`localStorage.getItem(${q(key)})===beforeSaveFailure`));
    } finally { await js('Storage.prototype.setItem=realSetItem;void 0'); }
  });

  test('biblioteca local funciona com ambos CDNs bloqueados', async () => {
    await reset();
    await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
    const primary='*cdnjs.cloudflare.com/ajax/libs/three.js/*',secondary='*cdn.jsdelivr.net/npm/three@*';
    try {
      await send('Network.setBlockedURLs',{urls:[primary]});await reload();
      assert.equal(await js('THREE.REVISION'),'128');
      await send('Network.setBlockedURLs',{urls:[primary,secondary]});await reload();assert.equal(await js('THREE.REVISION'),'128');assert.ok(await js('rd.info.render.frame>1'));
    } finally {
      await send('Network.setBlockedURLs',{urls:[]});await send('Network.setCacheDisabled',{cacheDisabled:false});
    }
  });

  let failures=0;
  for(const [name,fn] of cases){
    if(process.env.VF_TEST_FILTER&&!name.includes(process.env.VF_TEST_FILTER))continue;
    try { await fn();console.log('OK  '+name); }
    catch(error) { failures++;console.error('FALHA  '+name+'\n'+error.stack); }
  }
  if(errors.length){failures++;console.error('Exceções de página\n'+errors.join('\n'));}
  assert.equal(failures,0,`${failures} cenário(s) com falha`);
}
