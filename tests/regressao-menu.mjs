import { writeFile } from 'node:fs/promises';

export async function run({assert,send,js,until,boot,sleep,errors}){
  const q=JSON.stringify,check=async(name,test)=>{await test();console.log('OK  '+name)};
  const paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
  const mouse=(type,[x,y],props={})=>send('Input.dispatchMouseEvent',{type,x,y,...props});
  const move=(point,pressed=false)=>mouse('mouseMoved',point,{button:pressed?'left':'none',buttons:pressed?1:0});
  const down=point=>mouse('mousePressed',point,{button:'left',buttons:1,clickCount:1});
  const up=point=>mouse('mouseReleased',point,{button:'left',buttons:0,clickCount:1});
  const clickAt=async point=>{await move(point);await down(point);await up(point)};
  const center=async selector=>{
    await paint();
    return js(`(()=>{
      const el=document.querySelector(${q(selector)});if(!el)throw Error('Ausente: '+${q(selector)});
      for(let a=el.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
      if(el.closest('#edDrawer,#edInstallOverlay'))el.scrollIntoView({block:'nearest',inline:'nearest'});
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(document.elementFromPoint(x,y)))throw Error('Encoberto: '+${q(selector)});
      return [x,y];
    })()`);
  };
  const click=async selector=>clickAt(await center(selector));
  const back=async()=>{await click('#edBack');assert.ok(await js('E.on && E.editorHome && !document.querySelector(".edworkspace")'))};
  const tool=mode=>click('[data-edtab="'+mode+'"]');
  const locked=mode=>js(`document.querySelector('[data-edtab="${mode}"]').getAttribute('aria-disabled')==='true'`);
  const value=(selector,text)=>js(`document.querySelector(${q(selector)}).value=${q(String(text))}`);
  const camera=async(d=108)=>{
    await js(`stopCameraKeys();cam.th=0;cam.ph=.72;cam.d=goal.d=${d};goal.t.set(0,0,0);cam.t.copy(goal.t);void 0`);await paint();
  };
  const project=(x,z,y=0)=>js(`(()=>{const v=new THREE.Vector3(${x},${y},${z}).project(cam3),r=cv.getBoundingClientRect();return [r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height]})()`);
  const drag=async(from,to)=>{await move(from);await down(from);await move(to,true);await paint();await up(to);await paint()};
  const reload=async()=>{await send('Page.reload');await until('document.readyState==="complete"');await boot()};
  let dragIntercept;
  run.onDrag=event=>dragIntercept?.(event);
  const install=async(index,id,x,z)=>{
    await send('Input.setInterceptDrags',{enabled:true});
    try{
      const start=await center('[data-edcatalog="'+index+'"]'),finish=await project(x,z);
      const intercepted=new Promise(resolve=>{dragIntercept=resolve});
      await move(start);await down(start);await move([start[0]+20,start[1]+5],true);
      const {data}=await Promise.race([intercepted,sleep(2500).then(()=>{throw Error('Drag não iniciou')})]);
      const [clientX,clientY]=finish;
      await send('Input.dispatchDragEvent',{type:'dragEnter',x:clientX,y:clientY,data});
      await send('Input.dispatchDragEvent',{type:'dragOver',x:clientX,y:clientY,data});
      assert.ok(await js('ghost.visible && !!ghostModel'));
      await send('Input.dispatchDragEvent',{type:'drop',x:clientX,y:clientY,data});await up(finish);
    }finally{await send('Input.setInterceptDrags',{enabled:false})}
    await until('!!installPending');await value('#edInstallId',id);await click('#edInstallConfirm');
    await until(`!!M[${q(id)}]`);
  };

  await check('visão inicial só com cinco ícones, detalhes e botão Voltar',async()=>{
    await click('#editToggle');
    assert.ok(await js('E.editorHome && !ED.querySelector("input,select,.edworkspace")'));
    assert.deepEqual(await js('[...ED.querySelectorAll(".edtool-name")].map(el=>el.textContent)'),['Processo','Área de manufatura','Equipamento','Estações','Esteiras']);
    assert.ok(await js('ED.querySelectorAll(".edtool-icon svg").length===5 && !ED.querySelector(".locked")'));
    if(process.env.VF_TEST_MENU_SCREENSHOT){
      const {data}=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(process.env.VF_TEST_MENU_SCREENSHOT.replace(/\.png$/,'-initial.png'),Buffer.from(data,'base64'));
    }
    for(const mode of ['process','areas','machines','stations','flow']){
      await tool(mode);assert.equal(await js('E.mode'),mode);assert.ok(await js('!E.editorHome && !!document.querySelector("#edBack")'));
      await back();
    }
    await tool('process');await camera();await js('cam.t.x=goal.t.x=9;void 0');await click('#edFocus');
    assert.deepEqual(await js('[goal.t.x,goal.t.z]'),await js('[E.process.x,E.process.z]'));
  });

  await check('novo processo bloqueia as quatro etapas e impede saltos, inclusive após recarga',async()=>{
    await click('#edNewProcess');await until('E.blank && !E.processReady');
    assert.ok(await js('E.mode==="process" && !E.editorHome && !AL.length && !MS.length'));
    assert.match(await js('document.querySelector(".edprogress").textContent'),/1 de 4/);
    await back();
    for(const mode of ['areas','machines','stations','flow']){
      assert.ok(await locked(mode));await tool(mode);
      assert.ok(await js('E.editorHome && !document.querySelector(".edworkspace")'));
      assert.equal(await js('document.querySelector("#edMenuMessage").textContent'),'Crie primeiro o processo.');
    }
    assert.equal(await js('openEditorTool("machines")'),false);
    await reload();await click('#editToggle');
    assert.ok(await js('E.editorHome && !E.processReady && !AL.length'));
    assert.ok(await locked('areas'));assert.ok(await locked('machines'));assert.ok(await locked('stations'));assert.ok(await locked('flow'));
    await tool('process');
    await value('#edProcessName','Linha progressiva');await value('#edProcessW',74);await value('#edProcessD',54);
    await click('#edProcessApply');assert.ok(await js('E.processReady && E.processName==="Linha progressiva"'));
    await back();assert.equal(await locked('areas'),false);
    for(const mode of ['machines','stations','flow']){
      assert.ok(await locked(mode));await tool(mode);
      assert.match(await js('document.querySelector("#edMenuMessage").textContent'),/ao menos uma área/);
    }
  });

  await check('criar e dimensionar uma área libera equipamentos e estações',async()=>{
    await tool('areas');assert.match(await js('document.querySelector(".edprogress").textContent'),/2 de 4/);
    await click('#edOpenArea');await value('#edNewName','SMT Progressiva');await click('#edAddArea');
    assert.equal(await js('AL.length'),1);
    await camera(120);
    const [x,z]=await js('[AL[0].x,AL[0].z]');
    await drag(await project(x,z,.12),await project(0,0,.12));
    assert.deepEqual(await js('[AL[0].x,AL[0].z]'),[0,0]);
    await drag(await center('[data-corner="3"]'),await project(18,13));
    await drag(await center('[data-corner="0"]'),await project(-18,-13));
    assert.deepEqual(await js('[AL[0].w,AL[0].d]'),[36,26]);
    await back();
    assert.equal(await locked('machines'),false);assert.equal(await locked('stations'),false);assert.ok(await locked('flow'));
    await tool('stations');assert.ok(await js('document.querySelectorAll(".edcatalog-card").length>=4'));
    await back();await tool('machines');await camera(85);
    assert.match(await js('document.querySelector(".edprogress").textContent'),/3 de 4/);
    await install(0,'SPI-P',-9,0);
    await back();assert.ok(await locked('flow'));
    await tool('flow');assert.match(await js('document.querySelector("#edMenuMessage").textContent'),/dois equipamentos ou estações/);
  });

  await check('segundo equipamento libera esteiras e preserva a conexão após salvar e recarregar',async()=>{
    await tool('machines');await camera(85);await install(1,'NXT-P',6,0);
    await back();assert.equal(await locked('flow'),false);
    await tool('flow');await paint();
    assert.match(await js('document.querySelector(".edprogress").textContent'),/4 de 4/);
    await click('.flow-port[data-machine="SPI-P"][data-side="out"]');
    await click('.flow-port[data-machine="NXT-P"][data-side="in"]');
    assert.deepEqual(await js('E.links.map(l=>[l.from,l.to])'),[['SPI-P','NXT-P']]);
    await reload();await click('#editToggle');
    assert.ok(await js('E.editorHome && E.processName==="Linha progressiva" && AL.length===1 && MS.length===2 && E.links.length===1'));
    for(const mode of ['process','areas','machines','stations','flow'])assert.equal(await locked(mode),false);
    await camera(85);await clickAt(await project(6,0,1));
    await until('!E.editorHome && E.machineSelected==="NXT-P"');
    assert.ok(await js('machineOutline.parent===M["NXT-P"].mesh && rotationHandle.style.display==="block"'));
    await back();
    assert.ok(await js('E.machineSelected==="NXT-P" && !E.placing && !E.drag'));
  });

  await check('layouts legados abrem sem migração e estações também liberam esteiras',async()=>{
    for(const version of [1,2,3]){
      const data={version,blank:true,process:{x:0,z:0,w:60,d:44},
        areas:[{id:'custom-1',n:'Área legada',x:0,z:0,w:28,d:20,hue:210,custom:true}],
        machines:[
          {id:'INS-A',n:'Estação A',a:'custom-1',w:5,h:2.3,d:5,dx:-6,dz:0,rot:0,kind:'INS',station:true},
          {id:'INS-B',n:'Estação B',a:'custom-1',w:5,h:2.3,d:5,dx:6,dz:0,rot:2,kind:'INS',station:true}
        ],links:[]};
      await js(`localStorage.setItem('factory3dmap.layout.v1',${q(JSON.stringify(data))})`);
      await reload();await click('#editToggle');
      assert.ok(await js('E.editorHome && AL.length===1 && MS.every(m=>isStation(m))'));
      assert.equal(await locked('flow'),false);
    }
    await tool('stations');await click('[data-edmachine="INS-B"]');await click('#edDelete');
    await until('MS.length===1');await back();assert.ok(await locked('flow'));
    await tool('stations');await click('[data-edmachine="INS-A"]');await click('#edDelete');
    await until('MS.length===0');await toolSafeBack();
    await tool('areas');await click('[data-edarea="custom-1"]');await click('#edDelete');
    await until('!AL.length');await toolSafeBack();
    assert.ok(await locked('machines'));assert.ok(await locked('stations'));assert.ok(await locked('flow'));
  });
  async function toolSafeBack(){if(await js('!!document.querySelector("#edBack")'))await back()}

  await check('Dark/White, responsividade e controles fora da área útil do mapa',async()=>{
    const resize=(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const [width,height] of [[1800,1080],[1280,800],[800,600],[390,844]]){
      await resize(width,height);await paint();
      assert.ok(await js('document.documentElement.scrollWidth<=innerWidth && document.body.scrollWidth<=innerWidth'));
      assert.ok(await js('(innerWidth>600?stage.getBoundingClientRect().right<=editorDrawer.getBoundingClientRect().left:stage.getBoundingClientRect().bottom<=editorDrawer.getBoundingClientRect().top) && stage.clientHeight>140'));
      assert.ok(await js('!ED.querySelector("input,.edworkspace") && ED.querySelectorAll(".edtool-card").length===5'));
      for(const theme of ['dark','light']){
        if(await js('document.documentElement.dataset.theme')!==theme)await click('#themeSwitch');
        assert.equal(await js('document.documentElement.dataset.theme'),theme);
        if(process.env.VF_TEST_MENU_SCREENSHOT){
          const {data}=await send('Page.captureScreenshot',{format:'png'});
          await writeFile(process.env.VF_TEST_MENU_SCREENSHOT.replace(/\.png$/,'-'+width+'-'+theme+'.png'),Buffer.from(data,'base64'));
        }
      }
    }
    await resize(1800,1080);await paint();await tool('process');await click('#edResetProcess');
    await until('typeof E!=="undefined" && !E.blank && MS.length===28');
  });
  assert.deepEqual(errors,[]);console.log('OK  console sem erros');
}
