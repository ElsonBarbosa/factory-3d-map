/* Shell owns map navigation and product identity. It does not change placement rules. */
function fitMobileConstruction(){if(E.on&&innerWidth<600){resize();goal.d=homeD();cam.d=goal.d}}
document.getElementById('editToggle').addEventListener('click',fitMobileConstruction);
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{if(!E.on){setEdit(true);fitMobileConstruction()}setEditorCollapsed(false);openEditorTool(b.dataset.tool)});
document.getElementById('themeSwitch').onclick=()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';document.getElementById('themeSwitch').setAttribute('aria-checked',String(light))};
const jump=document.getElementById('areaJump');
function syncMapShell(){
 const value=jump.value,visible=AL.filter(a=>a.floor.visible);
 jump.innerHTML='<option value="">Visão geral do mapa</option>'+visible.map(a=>`<option value="${safe(a.id)}">${safe(a.n)}</option>`).join('');jump.value=value;
 document.getElementById('projectTitle').textContent=E.blank?(E.processName||'NOVO PROJETO'):'UNIDADE DEMONSTRATIVA';
 document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',E.on&&!E.editorHome&&E.mode===b.dataset.tool));
}
new MutationObserver(syncMapShell).observe(document.getElementById('al'),{childList:true});
new MutationObserver(()=>{document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',E.on&&!E.editorHome&&E.mode===b.dataset.tool))}).observe(ED,{childList:true});
jump.onchange=()=>{if(!jump.value){document.getElementById('overview').click();return}const a=A[jump.value];if(!a)return;goal.t.set(a.x,0,a.z);goal.d=Math.max(a.w,a.d)*1.9;if(E.on){E.selected=a.id;drawEditor()}else select('a',a.id)};
document.getElementById('overview').onclick=()=>{goal.t.set(E.process.x,0,E.process.z);goal.d=homeD();cam.ph=.72;select(null)};
document.getElementById('topView').onclick=()=>{cam.ph=.055;cam.th=0;goal.t.set(E.process.x,0,E.process.z);goal.d=homeD()};
document.getElementById('closeInspector').onclick=()=>select(null);
document.getElementById('monitorOverview').onclick=()=>{if(E.on)setEdit(false);select(null);panel.innerHTML=home();panel.hidden=false};
// The demo backbone also receives the new rail/support cross section.
for(const belt of demoBelts){const g=belt.geometry.parameters,horizontal=g.width>g.depth,len=horizontal?g.width:g.depth;
 const railMat=new THREE.MeshStandardMaterial({color:0x84978d,metalness:.5});
 for(const side of [-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(horizontal?len:.07,.1,horizontal?.07:len),railMat);rail.position.set(horizontal?0:side*.75,.3,horizontal?side*.75:0);belt.add(rail)}
 for(let x=-len/2+1;x<len/2;x+=3)for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,.3,.1),railMat);leg.position.set(horizontal?x:side*.6,-.16,horizontal?side*.6:x);belt.add(leg)}
}
syncMapShell();
const cancelTool=document.createElement('button');cancelTool.id='cancelTool';cancelTool.textContent='Cancelar';cancelTool.title='Cancelar a operação e voltar às ferramentas';
document.querySelector('.editor-tools').appendChild(cancelTool);cancelTool.onclick=()=>{E.newAreaForm=false;backToEditorHome()};
