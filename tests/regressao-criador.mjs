import { writeFile } from 'node:fs/promises';

export async function run({ assert, send, js, until, boot, errors }) {
  const paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const check=async(name,test)=>{await test();console.log('OK  '+name)};
  const q=JSON.stringify;
  const mouse=(type,[x,y],props={})=>send('Input.dispatchMouseEvent',{type,x,y,...props});
  const move=(p,pressed=false)=>mouse('mouseMoved',p,{button:pressed?'left':'none',buttons:pressed?1:0});
  const down=p=>mouse('mousePressed',p,{button:'left',buttons:1,clickCount:1});
  const up=p=>mouse('mouseReleased',p,{button:'left',buttons:0,clickCount:1});
  const center=async selector=>{
    await paint();
    return js(`(()=>{
      const el=document.querySelector(${q(selector)});if(!el)throw Error('Ausente: '+${q(selector)});
      for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
      if(el.closest('#edDrawer,#edInstallOverlay'))el.scrollIntoView({block:'nearest',inline:'nearest'});
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(document.elementFromPoint(x,y)))throw Error('Encoberto: '+${q(selector)}+' por '+document.elementFromPoint(x,y)?.id);
      return [x,y];
    })()`);
  };
  const click=async selector=>{const p=await center(selector);await move(p);await down(p);await up(p)};
  const tab=async mode=>{
    if(await js('!!document.querySelector("#edBack")'))await click('#edBack');
    return click('[data-edtab="'+mode+'"]');
  };
  const key=async(name,down)=>send('Input.dispatchKeyEvent',{type:down?'rawKeyDown':'keyUp',key:name,code:name==='Escape'?'Escape':'Key'+name.toUpperCase(),windowsVirtualKeyCode:name==='Escape'?27:name.toUpperCase().charCodeAt(0)});
  const project=(x,z,y=0)=>js(`(()=>{const p=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();return [r.x+(p.x*.5+.5)*r.width,r.y+(-p.y*.5+.5)*r.height]})()`);
  const camera=async(d=62)=>{
    await js(`stopCameraKeys();cam.th=0;cam.ph=.72;cam.d=goal.d=${d};goal.t.set(0,0,0);cam.t.copy(goal.t);void 0`);await paint();
  };
  const pose=()=>js('[...cam.t.toArray(),cam.d,cam.th,cam.ph]');
  const reload=async()=>{await send('Page.reload');await until('document.readyState==="complete"');await boot()};
  const area=(w=38,d=26)=>({id:'custom-1',n:'SMT',x:0,z:0,w,d,hue:210,custom:true});
  const machine=(id,x,z,w=6,d=4)=>({id,n:id,a:'custom-1',dx:x,dz:z,w,h:2.8,d,rot:0,kind:w===6?'NXT':'SPI'});
  const load=async(areas,machines,links=[])=>{
    const data={version:3,blank:true,process:{x:0,z:0,w:74,d:54},areas,machines,links,flowDir:links.length?1:0};
    await js(`localStorage.setItem('factory3dmap.layout.v1',${q(JSON.stringify(data))})`);
    await reload();await click('#editToggle');await tab('machines');await camera();
  };
  const select=async id=>{
    const p=await js(`(()=>{const m=M[${q(id)}],v=m.mesh.children[1].getWorldPosition(new THREE.Vector3());return [v.x,v.z,v.y]})()`);
    const point=await project(...p);await move(point);await down(point);await up(point);
    await until(`E.machineSelected===${q(id)} && rotationHandle.style.display==='block'`);
  };
  const rotate=async(delta,{cancel=false,during}={})=>{
    const start=await center('#edRotateHandle');
    const geometry=await js(`(()=>{const p=worldAt({clientX:${start[0]},clientY:${start[1]}}),m=M[E.machineSelected];
      return {x:m.pos.x,z:m.pos.z,r:Math.hypot(p.x-m.pos.x,p.z-m.pos.z),a:Math.atan2(m.pos.z-p.z,p.x-m.pos.x)}})()`);
    await move(start);await down(start);await until('E.drag?.kind==="machine-rotate"');
    for(let i=1;i<=10;i++){
      const angle=geometry.a+delta*i/10;
      const p=await project(geometry.x+geometry.r*Math.cos(angle),geometry.z-geometry.r*Math.sin(angle));
      await move(p,true);await paint();
      if(i===3&&during)await during();
    }
    if(cancel)await key('Escape',true);
    const end=await project(geometry.x+geometry.r*Math.cos(geometry.a+delta),geometry.z-geometry.r*Math.sin(geometry.a+delta));
    await up(end);
    if(cancel)await key('Escape',false);
    await until('!E.drag');await paint();
  };
  await check('ferramentas laterais e recolhimento sem alterar a câmera',async()=>{
    await click('#editToggle');await paint();
    assert.ok(await js(`editorDrawer.getBoundingClientRect().right<=innerWidth && editorDrawer.clientWidth<innerWidth*.5 && getComputedStyle(panel).display==='none'`));
    for(const mode of ['process','areas','machines','stations','flow']){await tab(mode);assert.equal(await js('E.mode'),mode)}
    await camera();const before=await pose(),height=await js('stage.clientHeight');
    await click('#edCollapse');await paint();
    assert.ok(await js('E.editorCollapsed && stage.clientHeight>='+height));
    assert.deepEqual(await pose(),before);
    await click('#edCollapse');await paint();assert.equal(await js('E.editorCollapsed'),false);
  });

  await load([area()],[machine('SPI-T',-8,0,4),machine('NXT-T',6,0)],[{from:'SPI-T',to:'NXT-T'}]);
  await check('alça única e rotação suave nos quatro ângulos com esteira e centro preservados',async()=>{
    await click('#edCollapse');
    const areaPoint=await project(-15,-8,.12);await move(areaPoint);await down(areaPoint);await up(areaPoint);
    await until('E.mode==="areas" && !E.editorCollapsed && !!document.querySelector("#edRename")');
    await select('NXT-T');
    const initial=await js('[M["NXT-T"].id,M["NXT-T"].pos.toArray(),M["NXT-T"].n]'),view=await pose();
    for(const orientation of [1,2,3,0]){
      const old=await js('M["NXT-T"].rot');
      await js('window.ribbonBefore=E.links[0].ribbon.geometry;void 0');
      await rotate(Math.PI/2,{during:async()=>{
        assert.equal(await js('M["NXT-T"].rot'),old);
        assert.ok(await js('Math.abs(M["NXT-T"].mesh.rotation.y/(Math.PI/2)-Math.round(M["NXT-T"].mesh.rotation.y/(Math.PI/2)))>.1'));
        assert.ok(await js('E.links[0].ribbon.geometry===ribbonBefore'));
        await key('w',true);await paint();assert.deepEqual(await pose(),view);await key('w',false);
      }});
      assert.equal(await js('M["NXT-T"].rot'),orientation);
      assert.ok(await js(`Math.abs(M["NXT-T"].mesh.rotation.y-${orientation}*Math.PI/2)<1e-8 &&
        E.links[0].ribbon.geometry!==ribbonBefore && E.links[0].points.at(-1).distanceTo(portsFor(M["NXT-T"]).inInner)<1e-8`));
      assert.deepEqual(await js('[M["NXT-T"].id,M["NXT-T"].pos.toArray(),M["NXT-T"].n]'),initial);
      assert.deepEqual(await pose(),view);
      assert.equal(await js('document.querySelectorAll("#edRotateHandle").length'),1);
    }
    await rotate(Math.PI/2);await reload();
    assert.equal(await js('M["NXT-T"].rot'),1);
    assert.ok(await js('E.links.length===1 && E.links[0].points.at(-1).distanceTo(portsFor(M["NXT-T"]).inInner)<1e-8'));
  });

  await check('rotações inválidas por limite e por colisão retornam à orientação válida',async()=>{
    await load([area(14,10)],[machine('NXT-T',0,2)]);
    await select('NXT-T');await rotate(Math.PI/2);
    assert.equal(await js('M["NXT-T"].rot'),0);
    assert.ok(await js('M["NXT-T"].mesh.rotation.y===0 && document.querySelector("#edStatus").textContent.includes("última orientação válida")'));
    await load([area(30,30)],[machine('NXT-T',0,0),machine('SPI-T',0,5,4)]);
    await select('NXT-T');await rotate(Math.PI/2);
    assert.equal(await js('M["NXT-T"].rot'),0);
    assert.match(await js('document.querySelector("#edStatus").textContent'),/sobrepõe/);
    await rotate(Math.PI);assert.equal(await js('M["NXT-T"].rot'),2);
  });

  await check('Escape cancela a prévia e WASD volta após a rotação',async()=>{
    await load([area()],[machine('NXT-T',0,0)]);
    await select('NXT-T');await rotate(Math.PI/2,{cancel:true});
    assert.equal(await js('M["NXT-T"].rot'),0);
    assert.equal(await js('M["NXT-T"].mesh.rotation.y'),0);
    const before=await js('cam.t.z');
    await key('w',true);await until('cam.t.z<'+(before-2));await key('w',false);await until('cameraKeyVelocity.z===0');
    assert.equal(await js('E.machineSelected'),'NXT-T');
    for(const distance of [28,120]){
      await camera(distance);await paint();
      assert.ok(await js('rotationHandle.style.display==="block" && rotationHandle.getBoundingClientRect().width===32'));
    }
    await camera(65);await js('cam.th=Math.PI/2;void 0');await paint();
    await rotate(Math.PI/2);
    assert.equal(await js('M["NXT-T"].rot'),1);
    assert.deepEqual(await js('[M["NXT-T"].pos.x,M["NXT-T"].pos.z]'),[0,0]);
    await load([area()],[{...machine('INS-T',0,0,5,5),kind:'INS',station:true}]);
    await select('INS-T');await rotate(Math.PI/2);await reload();
    assert.ok(await js('M["INS-T"].rot===1 && isStation(M["INS-T"])'));
    await load([area()],[machine('NXT-T',0,0)]);
    await select('NXT-T');
  });

  await check('propriedades acessíveis, catálogo em bandeja e ausência de overflow na página',async()=>{
    const resize=(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const [width,height] of [[1440,900],[1024,768],[800,600],[390,844]]){
      await resize(width,height);await paint();await tab('machines');await camera(72);
      await select('NXT-T');await paint();
      assert.ok(await js('document.documentElement.scrollWidth<=innerWidth && document.body.scrollWidth<=innerWidth'));
      assert.ok(await js('stage.clientHeight>140 && document.querySelector(".edcatalog").scrollWidth>=document.querySelector(".edcatalog").clientWidth'));
      assert.ok(await js('(innerWidth>600?stage.getBoundingClientRect().right<=editorDrawer.getBoundingClientRect().left:stage.getBoundingClientRect().bottom<=editorDrawer.getBoundingClientRect().top)'));
      await click('#edSaveMachine');
      if(process.env.VF_TEST_CREATOR_SCREENSHOT){
        const {data}=await send('Page.captureScreenshot',{format:'png'});
        await writeFile(process.env.VF_TEST_CREATOR_SCREENSHOT.replace(/\.png$/,'-'+width+'.png'),Buffer.from(data,'base64'));
      }
    }
    await resize(1800,1080);await paint();await click('#themeSwitch');
    assert.equal(await js('document.documentElement.dataset.theme'),'dark');
    await click('#edExit');
    assert.ok(await js('panel.hidden && rotationHandle.style.display==="none"'));
  });
  assert.deepEqual(errors,[]);
  console.log('OK  console sem erros');
}
