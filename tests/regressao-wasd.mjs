export async function run({ assert, send, js, until, boot, errors }) {
  const near = (actual, expected, tolerance = 1e-5) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);
  const paint = () => js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const pose = () => js('({x:cam.t.x,z:cam.t.z,y:cam3.position.y,th:cam.th,ph:cam.ph,d:cam.d})');
  const velocity = () => js('[cameraKeyVelocity.x,cameraKeyVelocity.z]');
  const camera = async (th = 0, distance = 70, x = 0, z = 0) => {
    await js(`stopCameraKeys();cam.th=${th};cam.ph=.72;cam.d=goal.d=${distance};
      goal.t.set(${x},0,${z});cam.t.copy(goal.t);document.activeElement.blur();void 0`);
    await paint();
  };
  const key = (letter, down, extra = {}) => send('Input.dispatchKeyEvent', {
    type: down ? 'rawKeyDown' : 'keyUp',
    key: letter, code: 'Key' + letter.toUpperCase(),
    windowsVirtualKeyCode: letter.toUpperCase().charCodeAt(0), ...extra,
  });
  const hold = async (letters, expectedSpeed) => {
    for (const letter of letters) await key(letter, true);
    await until(`Math.hypot(cameraKeyVelocity.x,cameraKeyVelocity.z)>${expectedSpeed * .88}`);
  };
  const release = async letters => {
    for (const letter of letters) await key(letter, false);
  };
  const rest = () => until('!cameraKeys.size && !cameraKeyVelocity.x && !cameraKeyVelocity.z');
  const mouse = (type, [x,y], props = {}) => send('Input.dispatchMouseEvent', { type,x,y,...props });
  const move = (p, pressed = false, modifiers = 0) => mouse('mouseMoved', p, {
    button: pressed ? 'left' : 'none', buttons: pressed ? 1 : 0, modifiers,
  });
  const press = (p, modifiers = 0) => mouse('mousePressed', p, { button:'left',buttons:1,clickCount:1,modifiers });
  const up = (p, modifiers = 0) => mouse('mouseReleased', p, { button:'left',buttons:0,clickCount:1,modifiers });
  const clickAt = async p => { await move(p);await press(p);await up(p); };
  const center = async selector => {
    const q = JSON.stringify(selector);
    await until(`!!document.querySelector(${q})`);
    if (selector.includes('corner') || selector.includes('flow-port')) await paint();
    return js(`(() => {
      const el=document.querySelector(${q});for(let ancestor=el.parentElement;ancestor;ancestor=ancestor.parentElement){if(ancestor.tagName==='DETAILS')ancestor.open=true;}
    if(el.closest('#edDrawer,#edInstallOverlay'))el.scrollIntoView({block:'center'});
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(document.elementFromPoint(x,y)))throw Error('Controle encoberto: '+${q});
      return [x,y];
    })()`);
  };
  const click = async selector => clickAt(await center(selector));
  const project = (x,z,y = 0) => js(`(() => {
    const v=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();
    return [r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height];
  })()`);
  const drag = async (a,b,modifiers = 0) => {
    await move(a,false,modifiers);await press(a,modifiers);await move(b,true,modifiers);
    await paint();await up(b,modifiers);
  };
  const tab = async name => {
    if(await js('!!document.querySelector("#edBack")'))await click('#edBack');
    return click(`[data-edtab="${name}"]`);
  };
  const value = (selector,val) => js(`document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(val)}`);
  const check = async (name,test) => { await test();console.log('OK  '+name); };

  await check('WASD nas quatro direções e quatro diagonais normalizadas', async () => {
    for (const [letters,x,z] of [
      ['w',0,-1],['s',0,1],['a',-1,0],['d',1,0],
      ['wa',-1,-1],['wd',1,-1],['sa',-1,1],['sd',1,1],
    ]) {
      await camera();
      const before = await pose();
      await hold(letters,38.5);
      const [vx,vz] = await velocity(), speed = Math.hypot(vx,vz), length = Math.hypot(x,z);
      near(vx/speed,x/length,.02);near(vz/speed,z/length,.02);
      assert.ok(speed<=38.5001);
      await release(letters);await rest();
      const after = await pose();
      assert.ok((after.x-before.x)*x+(after.z-before.z)*z>1);
      near(after.y,before.y);near(after.ph,before.ph);near(after.d,before.d);
      near(await js('cam.t.distanceTo(goal.t)'),0);
    }
  });

  await check('W segue o azimute após órbitas reais de 90° e 180°', async () => {
    for (const angle of [Math.PI/2,Math.PI]) {
      await camera();
      await drag([650,420],[650+angle/.006,420]);
      const before = await pose();
      near(before.th,-angle,.002);
      await hold('w',38.5);await release('w');await rest();
      const after = await pose(),dx=after.x-before.x,dz=after.z-before.z,dist=Math.hypot(dx,dz);
      assert.ok(dist>1);
      near(dx/dist,-Math.sin(before.th),.002);near(dz/dist,-Math.cos(before.th),.002);
      near(after.th,before.th);near(after.ph,before.ph);near(after.y,before.y);
    }
  });

  await check('zoom por roda e velocidades de navegação próximas e distantes', async () => {
    await camera(0,28);
    await hold('d',15.4);const close = Math.hypot(...await velocity());await release('d');await rest();
    await camera(0,120);
    await hold('d',66);const far = Math.hypot(...await velocity());
    const zoom = await js('goal.d');
    await mouse('mouseWheel',[780,420],{deltaX:0,deltaY:-120});
    assert.ok(await js('goal.d')<zoom);
    assert.ok(await js('cameraKeys.has("d")'));
    await release('d');await rest();
    assert.ok(far>close*3);
  });

  await check('aceleração, desaceleração e integração equivalente a 30, 60 e 120 FPS', async () => {
    await camera();
    // Amostra os frames reais do Chrome durante a pressão e a soltura.
    await js(`window.cameraSamples=[];const cameraUpdateForTest=updateCameraKeys;
      updateCameraKeys=t=>{cameraUpdateForTest(t);cameraSamples.push({pressed:cameraKeys.has('w'),speed:-cameraKeyVelocity.z,z:cam.t.z})};void 0`);
    await hold('w',38.5);await paint();await release('w');await rest();
    const samples = await js('cameraSamples');
    const accelerating = samples.filter(s=>s.pressed && s.speed>0);
    const braking = samples.slice(samples.lastIndexOf(accelerating.at(-1))+1).filter(s=>!s.pressed && s.speed>0);
    assert.ok(accelerating.length>=2 && accelerating[0].speed<accelerating.at(-1).speed);
    assert.ok(braking.length>=1 && braking[0].speed<accelerating.at(-1).speed);
    assert.ok(samples.at(-1).z<accelerating.at(-1).z && samples.at(-1).speed===0);
    const distances = await js(`[30,60,120].map(fps=>{
      cam.t.set(0,0,0);goal.t.copy(cam.t);stopCameraKeys();cameraKeys.add('w');lastCameraKeyFrame=0;
      for(let i=1;i<=fps/2;i++)cameraUpdateForTest(i*1000/fps);
      cameraKeys.clear();
      for(let i=fps/2+1;i<=fps;i++)cameraUpdateForTest(i*1000/fps);
      const z=cam.t.z;stopCameraKeys();lastCameraKeyFrame=performance.now();return z;
    })`);
    near(distances[0],distances[1],.01);near(distances[1],distances[2],.01);
    await js('updateCameraKeys=cameraUpdateForTest;delete window.cameraSamples');
  });

  await check('limite acompanha o processo e preserva o retorno de fora da margem', async () => {
    const edge = await js('E.process.x+E.process.w/2');
    const limit = edge+35;
    await camera(0,70,edge-2);
    await key('d',true);await until(`cam.t.x>${limit-1}`,8000);
    assert.ok((await pose()).x<=limit+1e-8);
    await release('d');await rest();
    await camera(0,70,limit+15);
    await key('d',true);await paint();await release('d');
    near((await pose()).x,limit+15);
    await hold('a',38.5);await release('a');await rest();
    assert.ok((await pose()).x<limit+15);
  });

  await check('troca rápida entre WASD, órbita e pan por mouse', async () => {
    await camera();
    await hold('w',38.5);
    await drag([700,390],[766,390]);
    assert.equal(await js('cameraKeys.size'),0);
    await release('w');
    const orbit = await pose();
    assert.ok(orbit.th<-.3);
    await hold('d',38.5);await release('d');
    await drag([700,390],[740,430],8);
    const panned = await pose();
    near(panned.th,orbit.th);
    assert.notEqual(panned.x,orbit.x);assert.notEqual(panned.z,orbit.z);
    await hold('s',38.5);await release('s');await rest();
    assert.equal(await js('ptrs.size'),0);
  });

  await check('alternância real de abas limpa tecla pressionada e velocidade', async () => {
    await camera();
    await hold('w',38.5);
    const { targetId } = await send('Target.createTarget',{url:'about:blank'});
    try {
      await send('Target.activateTarget',{targetId});
      await until('document.hidden || !document.hasFocus()');
      assert.deepEqual(await js('[cameraKeys.size,cameraKeyVelocity.x,cameraKeyVelocity.z]'),[0,0,0]);
      await send('Page.bringToFront');await until('!document.hidden && document.hasFocus()');
      const before = await pose();
      await paint();
      near((await pose()).z,before.z);
      await release('w');
      await hold('w',38.5);await release('w');await rest();
      assert.ok((await pose()).z<before.z);
    } finally { await send('Target.closeTarget',{targetId});await send('Page.bringToFront'); }
  });

  await check('editor de equipamento e área, redimensionamento e proteção de esteira', async () => {
    const data = {version:3,blank:true,process:{x:0,z:0,w:74,d:54},areas:[
      {id:'custom-1',n:'SMT',x:0,z:0,w:30,d:22,hue:210,custom:true}
    ],machines:[
      {id:'SPI-T',n:'SPI',a:'custom-1',dx:-5,dz:0,rot:0,w:4,h:2.6,d:4,kind:'SPI'},
      {id:'NXT-T',n:'NXT',a:'custom-1',dx:6,dz:0,rot:0,w:6,h:2.8,d:4,kind:'NXT'}
    ]};
    await js(`localStorage.setItem('factory3dmap.layout.v1',${JSON.stringify(JSON.stringify(data))})`);
    await send('Page.reload');await until('document.readyState==="complete"');await boot();
    await click('#editToggle');await tab('machines');await camera(0,72,-20);
    await key('d',true);await until('cam.t.x>-11');await release('d');await rest();
    await clickAt(await project(-5,0,1));
    assert.equal(await js('E.machineSelected'),'SPI-T');
    await value('#edEditName','SPI revisada');await click('#edSaveMachine');
    assert.equal(await js('M["SPI-T"].n'),'SPI revisada');
    const p=await project(-5,0,1),end=await project(-4,2,1);
    await move(p);await press(p);await until('E.drag?.kind==="machine-move"');
    const dragPose=await pose();
    await key('w',true);await paint();
    near((await pose()).z,dragPose.z);
    await move(end,true);await paint();await up(end);await release('w');
    assert.deepEqual(await js('[M["SPI-T"].pos.x,M["SPI-T"].pos.z]'),[-4,2]);
    await tab('areas');await click('[data-edarea="custom-1"]');
    await value('#edRename','SMT revisada');await click('#edApply');
    assert.equal(await js('A["custom-1"].n'),'SMT revisada');
    const corner=await center('[data-corner="3"]'),target=await project(16,12);
    await move(corner);await press(corner);await until('E.drag?.kind==="resize"');
    const resizePose=await pose();
    await key('d',true);await paint();
    near((await pose()).x,resizePose.x);
    await move(target,true);await paint();await up(target);await release('d');
    assert.equal(await js('A["custom-1"].w'),31);
    await tab('flow');
    await click('.flow-port[data-machine="SPI-T"][data-side="out"]');
    const flowPose=await pose();
    await key('w',true);await paint();await release('w');
    near((await pose()).z,flowPose.z);
    await click('.flow-port[data-machine="NXT-T"][data-side="in"]');
    assert.equal(await js('E.links.length'),1);
  });

  await check('digitação, campos editáveis, modal e atalhos com Ctrl, Alt e Meta', async () => {
    await tab('areas');await click('[data-edarea="custom-1"]');
    await js('document.querySelector("#edRename").focus();document.querySelector("#edRename").select()');
    const before = await pose();
    for (const letter of 'wasd') {
      await key(letter,true,{type:'keyDown',text:letter,unmodifiedText:letter});await paint();await release(letter);
    }
    assert.equal(await js('document.querySelector("#edRename").value'),'wasd');
    near((await pose()).x,before.x);near((await pose()).z,before.z);
    for (const [tag,setup] of [['textarea',''],['select',''],['div','el.contentEditable="true";']]) {
      await js(`window.testField=document.createElement('${tag}');{const el=testField;${setup}
        document.body.appendChild(el);el.focus()}void 0`);
      assert.ok(await js('document.activeElement===testField'));
      await key('d',true);await paint();await release('d');
      near((await pose()).x,before.x);
      await js('testField.remove();delete window.testField');
    }
    for (const modifiers of [2,1,4]) {
      await key('d',true,{modifiers});await paint();await key('d',false,{modifiers});
      near((await pose()).x,before.x);
    }
    await js('openInstallDialog({a:"custom-1",c:catalogue[0],station:false,x:0,z:7,rot:0});document.activeElement.blur()');
    await key('w',true);await paint();await release('w');
    near((await pose()).z,before.z);
    await click('#edInstallCancel');
    assert.equal(await js('!!installPending'),false);
  });

  assert.deepEqual(errors,[],'Erros no console ou exceções de página');
  console.log('OK  console sem erros e sem exceções de página');
}
