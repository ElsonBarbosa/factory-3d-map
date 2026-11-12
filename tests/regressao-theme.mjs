import {mkdir,writeFile} from 'node:fs/promises';
export async function run({assert,send,js,until,boot,errors}){
 const paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
 const capture=async name=>{await paint();const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile('evidence/'+name+'.png',Buffer.from(data,'base64'))};
 const toggle=async()=>{const [x,y]=await js('(()=>{const r=document.getElementById("themeSwitch").getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]})()');for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});await paint()};
 await mkdir('evidence',{recursive:true});
 assert.equal(await js('document.documentElement.dataset.theme'),'dark');
 assert.equal(await js('localStorage.getItem("factory3dmap.theme.v1")'),null);
 assert.equal(await js('document.getElementById("themeSwitch").getAttribute("aria-label")'),'Ativar tema branco');
 await capture('theme-green');console.log('OK  primeira abertura verde sem preferência anterior');
 await js('saveLayout()');const saved=await js('localStorage.getItem(storageKey)');
 await toggle();assert.equal(await js('document.documentElement.dataset.theme'),'light');
 assert.equal(await js('localStorage.getItem("factory3dmap.theme.v1")'),'light');
 const palette=await js('({process:plinth.material.color.getHexString(),area:A.smt.mat.color.getHexString(),machine:M["SPI-01"].bm.color.getHexString(),edge:A.smt.edge.material.color.getHexString(),hemi:hemi.intensity,sun:sun.intensity})');
 assert.equal(palette.process,'7e8f85');assert.equal(palette.machine,'8ea69b');assert.notEqual(palette.area,palette.process);assert.notEqual(palette.area,palette.machine);assert.ok(palette.hemi<=.7&&palette.sun<=.7);
 assert.equal(await js('localStorage.getItem(storageKey)'),saved);
 await capture('theme-white');console.log('OK  branco com base, áreas, contornos e equipamentos distintos, sem alterar layout: '+JSON.stringify(palette));
 await send('Page.reload');await boot();assert.equal(await js('document.documentElement.dataset.theme'),'light');assert.equal(await js('M["SPI-01"].bm.color.getHexString()'),'8ea69b');
 await toggle();await send('Page.reload');await boot();assert.equal(await js('document.documentElement.dataset.theme'),'dark');
 console.log('OK  tema branco e verde lembrados ao recarregar');
 await toggle();await js('setEdit(true);openEditorTool("machines")');await paint();await capture('theme-white-catalogue');
 assert.ok(await js('[...document.querySelectorAll(".edcatalog-card img")].every(e=>e.complete&&e.naturalWidth>0)'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await paint();await js('setEdit(false);document.getElementById("editToggle").click();openEditorTool("machines")');await paint();await capture('theme-white-mobile');assert.ok(await js('document.documentElement.scrollWidth<=innerWidth'));
 assert.deepEqual(errors,[]);console.log('OK  miniaturas e tema branco em desktop/celular, sem erros no console');
}
