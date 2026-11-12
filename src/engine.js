
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const seed=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const R=seed(11),rr=(a,b)=>a+(b-a)*R();
const SC={run:'#2f9e63',setup:'#d9980b',down:'#d64545',mnt:'#3b78c4'},SN={run:'Operando',setup:'Em setup',down:'Parado',mnt:'Em manutenção'};
const f1=v=>v.toFixed(1).replace('.',','),pc=v=>f1(v)+'%',nf=v=>Math.round(v).toLocaleString('pt-BR');
const col=v=>v>=80?SC.run:v>=65?SC.setup:SC.down;
const POOL=['Carlos Menezes','Juliana Prado','Rafael Nogueira','Tiago Albuquerque','Marta Cavalcante','Diego Farias','Luana Pessoa','Hugo Seixas','Bianca Lacerda','Otávio Brandão','Sérgio Vilela','Camila Teles','Eduardo Pinheiro','Larissa Matos','Wesley Amorim','Patrícia Lobo','Fábio Queiroz','Renata Cordeiro','Gilberto Sá','Vanessa Torres','Nelson Rabelo','Aline Viana','Cássio Moraes','Priscila Duarte'];
const PCB='PCBA-100245 Rev. B',MC='Módulo de controle MC-100';
/* áreas: id, nome, x, z, matiz, largura, produto, ordem, lote, qtd, funções, escalados */
const AD=[
['arm','Armazém',-32,-11,45,14,'Componentes SMD e PCI virgem','Kit da OP 24-1210','Lote L-5521','13.680 kits',['Supervisor de turno','Operador de empilhadeira','Operador de AGV','Separador de kits','Conferente'],8],
['smt','SMT',-6,-11,210,34,PCB,'OP 24-1210','Lote M-4471','13.680 pcs',['Supervisor de turno','Técnico de processo SMT','Operador de linha','Operador de linha','Técnico de abastecimento'],14],
['ins','Inserção manual',25,-11,140,24,PCB+' (componentes PTH)','OP 24-1210','Lote M-4471','13.680 pcs',['Supervisor de turno','Líder de linha','Operador de inserção','Operador de inserção','Inspetor de solda'],12],
['mon','Montagem',28,11,190,18,MC,'OP 24-1214','Lote M-4480','6.400 un',['Supervisor de turno','Líder de linha','Montador','Montador','Auxiliar de montagem'],10],
['tes','Testes',8,11,270,18,MC,'OP 24-1214','Lote M-4480','6.400 un',['Supervisor de turno','Técnico de testes','Inspetor de qualidade','Analista de qualidade'],8],
['emb','Embalagem',-13,11,25,20,MC+' em caixa','OP 24-1214','Lote M-4480','6.400 un',['Supervisor de turno','Operador de embalagem','Operador de etiquetagem','Operador de empilhadeira'],7],
['man','Manutenção e utilidades',-32,11,215,14,'Sem produto, serviços de apoio','OS 8841 e OS 8847','Sem lote','2 ordens de serviço',['Supervisor de manutenção','Técnico mecânico','Técnico eletricista','Técnico de utilidades'],5]];
const AL=AD.map(([id,n,x,z,hue,w,prod,op,lote,ord,roles,esc],i)=>({id,n,x,z,hue,w,d:18,prod,op,lote,ord,i,esc,sat:id==='man'?.05:.2,pres:esc-Math.round(rr(0,2)),
 team:roles.map((r,j)=>[POOL[(i*4+j)%24],r]),wip:Math.round(rr(120,900)),kwh:Math.round(rr(180,620)),temp:Math.round(rr(27,32)),epi:rr(96,100),prog:Math.round(rr(38,81))}));
const A=Object.assign(Object.create(null),Object.fromEntries(AL.map(a=>[a.id,a])));
/* máquinas: area, id, nome, larg, alt, prof, dx, dz, status, capacidade/h, lado (só bancadas) */
const ML=[];
const line=(a,list,z=0)=>{let x=-(list.reduce((s,m)=>s+m[1]+.8,-.8))/2;list.forEach(([n,w,h,s,i,id])=>{ML.push([a,id,n,w,h,3.8,x+w/2,z,s,i]);x+=w+.8})};
const bench=(a,pre,nm,xs,ideal,st={})=>{for(let i=0;i<nm;i++){const side=i%2?1:-1,id=pre+'-0'+(i+1);ML.push([a,id,'Bancada '+(a==='ins'?'de inserção':'de montagem')+' 0'+(i+1),5.2,2.3,4.6,xs[i>>1],side*4.1,st[id]||'run',ideal,side])}};
line('arm',[['Estante porta-paletes A',5,4.5,'run',30,'AR-01'],['Estante porta-paletes B',5,4.5,'run',30,'AR-02']],-5.5);line('arm',[['AGV de abastecimento',3,1.8,'run',24,'AR-03']],5.5);
line('smt',[['Impressora de pasta',4,2.6,'setup',120,'PR-01'],['Inspeção de pasta (SPI BOT 01)',3.4,2.6,'run',120,'SPI-01'],['Montadora de chips PP-01',5.2,2.8,'run',118,'PP-01'],['Montadora multifunção PP-02',5.2,2.8,'down',118,'PP-02'],['Forno de refusão',7.4,2.4,'run',120,'RF-01'],['Inspeção óptica (AOI)',3.4,2.6,'run',120,'AOI-01']]);
bench('ins','IM',6,[-8,0,8],50);bench('mon','MO',4,[-4.5,4.5],40);
line('tes',[['Teste em circuito (ICT)',4,2.6,'run',90,'ICT-01'],['Teste funcional (FCT)',4,2.6,'mnt',60,'FCT-01'],['Inspeção final da qualidade',3.6,2.4,'run',50,'QA-01']]);
line('emb',[['Etiquetadora',3.6,2,'run',80,'EM-01'],['Embaladora',4.6,2.6,'run',70,'EM-02'],['Paletizadora',4.6,3,'run',60,'EM-03']]);
line('man',[['Compressor de ar',4,3,'run',20,'UT-01'],['Chiller',4.5,2.8,'run',20,'UT-02']],-4);line('man',[['Oficina de manutenção',6,2.4,'run',20,'UT-03']],5);
const WHY={'PP-02':'Falta de componente no alimentador 14 (alarme F-312). Abastecimento acionado.','PR-01':'Troca de stencil para a OP 24-1210.','FCT-01':'Preventiva programada: calibração dos instrumentos de medição.'};
const SINCE={down:'48 min',setup:'22 min',mnt:'1 h 35 min'};
const base=new Date(2026,10,2),dt=n=>new Date(base.getTime()+n*864e5).toLocaleDateString('pt-BR');
const MS=ML.map(([a,id,n,w,h,d,dx,dz,s,ideal,side],k)=>{const m={a,id,n,w,h,d,dx,dz,s,ideal,side},run=s==='run';
 m.disp=run?rr(90,97):s==='setup'?rr(80,86):rr(66,76);m.perf=run?rr(86,97):rr(80,90);m.qual=rr(96.8,99.6);
 m.oee=m.disp*m.perf*m.qual/1e4;m.fpy=m.qual-rr(.3,1);
 const b=ideal*m.oee/100;m.hr=[0,1,2,3,4,5].map(i=>b*rr(.88,1.12)*(i===5?.2:1));
 if(s==='down'){m.hr[4]*=.25;m.hr[5]=0}if(s==='mnt'){m.hr[3]*=.3;m.hr[4]=0;m.hr[5]=0}
 m.hr=m.hr.map(v=>Math.round(v));m.prod=m.hr.reduce((x,y)=>x+y,0);m.meta=Math.round(ideal*8*.85);
 m.ref=Math.max(1,Math.round(m.prod*(1-m.qual/100)));m.retr=Math.round(m.prod*rr(.004,.015));
 m.ciclo=3600/(ideal*m.perf/100);m.std=3600/ideal;m.park=Math.round((100-m.disp)/100*312);m.stops=run?Math.round(rr(0,3)):1;m.alarm=s==='down'?1:0;
 m.since=run?`${Math.floor(rr(1,5))} h ${Math.floor(rr(5,55))} min`:SINCE[s];m.why=WHY[id]||'';
 m.oper=POOL[(k*5+3)%24];m.prg='PRG-'+(1200+k*37);m.mtbf=Math.round(rr(90,320));m.mttr=Math.round(rr(18,70));
 m.kwh=Math.round(rr(40,190));m.last=dt(-Math.round(rr(12,60)));m.next=dt(Math.round(rr(5,40)));return m});
const M=Object.assign(Object.create(null),Object.fromEntries(MS.map(m=>[m.id,m])));
MS.forEach(m=>m.demoId=m.id);
const avg=(l,k)=>l.reduce((s,x)=>s+x[k],0)/l.length;
AL.forEach(a=>{a.ms=MS.filter(m=>m.a===a.id);a.oee=avg(a.ms,'oee');a.fpy=avg(a.ms,'fpy')});
$('#kpis').innerHTML=[['Produção do turno',nf(M['EM-03'].prod)+' pcs'],['OEE médio',pc(avg(MS,'oee'))],['FPY geral',pc(avg(MS,'fpy'))],['Máquinas ativas',MS.filter(m=>m.s==='run').length+' de '+MS.length],['Colaboradores',AL.reduce((s,a)=>s+a.pres,0)],['Alertas',MS.filter(m=>m.s!=='run').length]].map(([k,v])=>`<div class="kpi"><span>${k}</span><b>${v}</b></div>`).join('');
$('#al').innerHTML='<h4>Áreas</h4>'+AL.map(a=>`<button class="al" data-a="${a.id}"><em>${a.i<6?a.i+1:''}</em>${a.n}<span class="dots">${a.ms.map(m=>`<i class="dot" style="background:${SC[m.s]}"></i>`).join('')}</span></button>`).join('');
$('#lg').innerHTML=Object.keys(SN).map(k=>`<div class="lg"><i class="dot" style="background:${SC[k]}"></i>${SN[k]}</div>`).join('')+'<div class="lg"><i style="width:8px;height:4px;background:#3c454e;display:inline-block"></i>Esteira de produção</div>';
/* cena 3D */
const cv=$('#cv'),stage=$('#mapViewport'),panel=$('#panel'),HOME=new THREE.Vector3(-1,0,0);let W=1,H=1,sel=null;
let rd;try{rd=new THREE.WebGLRenderer({canvas:cv,antialias:true})}catch(e){rd=new THREE.WebGLRenderer({canvas:cv})}rd.setPixelRatio(Math.min(devicePixelRatio,2));rd.shadowMap.enabled=true;rd.shadowMap.type=THREE.PCFSoftShadowMap;
const sc=new THREE.Scene(),cam3=new THREE.PerspectiveCamera(36,1,1,1200);
const hemi=new THREE.HemisphereLight(0xffffff,0x9a9fa6,.85),sun=new THREE.DirectionalLight(0xffffff,.75);
sun.position.set(-30,70,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:38,bottom:-38,near:10,far:170});sun.shadow.bias=-.0004;sc.add(hemi,sun);
const plinth=new THREE.Mesh(new THREE.BoxGeometry(84,.6,46),new THREE.MeshStandardMaterial({roughness:1}));plinth.position.set(.5,-.3,0);plinth.receiveShadow=true;sc.add(plinth);
const pick=[],glass=new THREE.MeshStandardMaterial({color:0x1d2630,roughness:.3,metalness:.4}),pole=new THREE.MeshStandardMaterial({color:0x59636d}),
 shirt=new THREE.MeshStandardMaterial({color:0x3a66b0,roughness:.9}),skin=new THREE.MeshStandardMaterial({color:0xd8a883,roughness:.9}),beltM=new THREE.MeshStandardMaterial({roughness:.8});
// Grade local de encaixe: somente areas de manufatura, sem diagonais.
function buildAreaGrid(a){
 const wasVisible=!!(a.grid&&a.grid.visible);
 if(a.grid){sc.remove(a.grid);a.grid.geometry.dispose();a.grid.material.dispose();}
 const coordinates=[],x0=-a.w/2,z0=-a.d/2;
 for(let x=Math.ceil(a.x+x0);x<=a.x-x0;x++)coordinates.push(x-a.x,0,z0,x-a.x,0,-z0);
 for(let z=Math.ceil(a.z+z0);z<=a.z-z0;z++)coordinates.push(x0,0,z-a.z,-x0,0,z-a.z);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(coordinates,3));
 const material=new THREE.LineBasicMaterial({color:0x55d7ad,transparent:true,opacity:.3,depthWrite:false});
 a.grid=new THREE.LineSegments(geometry,material);
 a.grid.position.set(a.x,.136,a.z);
 a.grid.visible=wasVisible;
 sc.add(a.grid);
}
AL.forEach(a=>{a.mat=new THREE.MeshStandardMaterial({roughness:1});const s=new THREE.Mesh(new THREE.BoxGeometry(a.w,.12,a.d),a.mat);s.position.set(a.x,.06,a.z);s.receiveShadow=true;s.userData.a=a;a.floor=s;sc.add(s);pick.push(s);
 a.edge=new THREE.LineSegments(new THREE.EdgesGeometry(s.geometry),new THREE.LineBasicMaterial());a.edge.position.copy(s.position);sc.add(a.edge);buildAreaGrid(a)});
/* esteira contínua entre as áreas */
const PATH=[[-31,-11],[38.5,-11],[38.5,11],[-22,11]],SEG=[];let TOT=0;
for(let i=0;i<3;i++){const a=PATH[i],b=PATH[i+1],l=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);SEG.push({a,b,l,s:TOT});TOT+=l;
 const hz=a[1]===b[1],bm=new THREE.Mesh(new THREE.BoxGeometry(hz?l+1.6:1.6,.4,hz?1.6:l+1.6),beltM);bm.position.set((a[0]+b[0])/2,.32,(a[1]+b[1])/2);bm.castShadow=bm.receiveShadow=true;sc.add(bm)}
const demoBelts=sc.children.filter(o=>o.material===beltM),demoOffset={x:0,z:0};
const boards=[],bmat=new THREE.MeshStandardMaterial({color:0x2e8b57,roughness:.6});
for(let i=0;i<30;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.9,.1,.7),bmat);b.castShadow=true;sc.add(b);boards.push(b)}
function at(s){s=(s%TOT+TOT)%TOT;for(const g of SEG)if(s<=g.s+g.l){const f=(s-g.s)/g.l;return[g.a[0]+(g.b[0]-g.a[0])*f,g.a[1]+(g.b[1]-g.a[1])*f]}return PATH[3]}
/* máquinas e bancadas */
function manualStationType(m){return m.manualType==='test'||m.kind==='TST'?'test':'inspection'}
function manualFlowRotation(m,rot=m.rot||0){return m.lineRot===undefined?rot:m.lineRot}
function manualSide(m){return m.side===-1?-1:1}
function manualDisposition(m,rot=m.rot||0){return Math.abs(manualFlowRotation(m,rot)-rot)%2===1?'lateral':'parallel'}
function manualModeChange(m,mode){return{rot:manualDisposition(m)===mode?(m.rot||0):((m.rot||0)+1)%4,lineRot:manualFlowRotation(m)}}
function manualOperatorZ(m,rot=m.rot||0){return manualSide(m)*(manualDisposition(m,rot)==='parallel'?.1:-.9)}
function syncStationOperator(m,rot=m.rot||0){if(isStation(m)&&m.operator)m.operator.position.z=manualOperatorZ(m,rot)}
function stationBodyRect(m,x,z,rot=m.rot||0){
 const s=manualSide(m),table=s*1.1,depth=Math.min(1.8,m.d*.38),operator=manualOperatorZ(m,rot);
 const z0=Math.min(table-depth/2,operator-(s===1?.27:.46)),z1=Math.max(table+depth/2,operator+(s===1?.46:.27));
 const r=rot*Math.PI/2,center=(z0+z1)/2,width=m.w-.18;
 return{x:x+Math.sin(r)*center,z:z+Math.cos(r)*center,w:rot%2?z1-z0:width,d:rot%2?width:z1-z0};
}
function stationLane(m,x=m.pos.x,z=m.pos.z,rot=m.rot||0){
 const r=rot*Math.PI/2,flow=manualFlowRotation(m,rot)*Math.PI/2;
 const nx=Math.sin(r),nz=Math.cos(r),tx=Math.cos(flow),tz=-Math.sin(flow);
 const size=footprint(m,rot),half=Math.abs(tx)>.5?size.w/2:size.d/2;
 const lateral=manualDisposition(m,rot)==='lateral',base=m.demoId?4.1:Math.ceil(m.d/2+1.25);
 const offset=lateral?Math.ceil((m.w-.18)/2+.525):base;
 const ax=lateral?Math.cos(r):nx,az=lateral?-Math.sin(r):nz;
 return{x:x-ax*manualSide(m)*offset,z:z-az*manualSide(m)*offset,
  tx,tz,half,w:Math.abs(tx)>.5?half*2:1.05,d:Math.abs(tx)>.5?1.05:half*2};
}
function workcellModel(m,palette){return mapModel(m,palette)}
function updateFixture(fixture,time){
 const phase=(time%7200)/7200;
 const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
 const close=smooth((phase-.24)/.14),open=smooth((phase-.72)/.16),closed=close*(1-open);
 fixture.cage.position.y=fixture.openY+(fixture.closedY-fixture.openY)*closed;
 const loading=smooth(phase/.21);
 fixture.board.position.z=fixture.operatorZ+(fixture.tableZ-fixture.operatorZ)*loading;
 fixture.board.position.y=1.3+Math.sin(Math.PI*loading)*.15;
 fixture.arm.rotation.x=-.35*Math.sin(Math.PI*loading);
}
function animateFixtures(time){
 for(const m of MS){
  if(!m.fixture||!m.mesh.visible||m.s!=='run')continue;
  V.copy(m.pos).project(cam3);
  if(inView(V)||E.machineSelected===m.id||sel?.id===m.id)updateFixture(m.fixture,time);
 }
}
function buildMachine(m){
 m.bm=new THREE.MeshStandardMaterial({color:0xe1e5df});m.am=new THREE.MeshStandardMaterial({color:0x527268});
 const a=A[m.a],g=mapModel(m,{body:m.bm,trim:m.am});g.position.set(a.x+m.dx,.12,a.z+m.dz);m.pos=g.position;m.mesh=g;
 m.fixture=g.userData.fixture||null;m.operator=g.userData.operator;m.jigs=g.userData.jigs;
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.m=m;pick.push(o)}});sc.add(g);
}
MS.forEach(m=>{buildMachine(m);m.rot=m.rot||0;m.mesh.rotation.y=m.rot*Math.PI/2});
const so=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>new THREE.Vector3(x,0,z))),new THREE.LineBasicMaterial());
const sp=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({transparent:true,opacity:.12,depthWrite:false}));
so.visible=sp.visible=false;sc.add(so,sp);
const mq=matchMedia('(prefers-color-scheme: dark)'),dark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':mq.matches};
function themeMachine(m,d=dark()){m.bm.color.set(d?'#83978e':'#8ea69b');m.am.color.set(d?'#526f64':'#365b50')}
function theme(){const d=dark();sc.background=new THREE.Color(d?'#182724':'#f2f3ed');plinth.material.color.set(d?'#31403c':'#7e8f85');hemi.intensity=d?.55:.65;sun.intensity=d?.6:.65;beltM.color.set(d?'#59636d':'#3c454e');
 AL.forEach(a=>{a.mat.color.setHSL(a.hue/360,.14,d?.27:.67);a.edge.material.color.setHSL(a.hue/360,a.sat+.05,d?.42:.39)});
 MS.forEach(m=>themeMachine(m,d));
 const ink=d?'#e6eaee':'#18222d';so.material.color.set(ink);sp.material.color.set(ink)}
mq.addEventListener('change',theme);new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});theme();
/* rótulos */
const lbs=$('#lbs'),mk=(c,t)=>{const d=document.createElement('div');d.className=c;d.textContent=t;lbs.appendChild(d);return d};
AL.forEach(a=>{a.lb=mk('lb',(a.i<6?`${a.i+1}. `:'')+a.n);a.lb.dataset.a=a.id});
MS.forEach(m=>{m.lb=mk('lb mt',m.id);m.lb.style.boxShadow=`inset 3px 0 0 ${SC[m.s]}`});
const V=new THREE.Vector3();
const inView=v=>v.z>=-1&&v.z<=1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1;
function proj(e,x,y,z,show=true){V.set(x,y,z).project(cam3);const ok=inView(V)&&show;e.style.display=ok?'':'none';if(ok)e.style.transform=`translate(${(V.x*.5+.5)*W}px,${(-V.y*.5+.5)*H}px) translate(-50%,-50%)`}
/* câmera orbital */
const homeD=()=>98*Math.max(1,1.5/(W/H)),cam={t:HOME.clone(),d:84,th:.3,ph:.95},goal={t:HOME.clone(),d:84};
function resize(){W=stage.clientWidth;H=stage.clientHeight;if(!W||!H)return;rd.setSize(W,H,false);cam3.aspect=W/H;cam3.updateProjectionMatrix();if(!sel&&!stage.parentElement.classList.contains('editor-mode'))goal.d=homeD()}
new ResizeObserver(resize).observe(stage);resize();cam.d=goal.d;
function select(k,id){if(k&&!(k==='m'?M[id]:A[id]))return;sel=k?{k,id}:null;$('.app').classList.toggle('sel',!!sel);panel.innerHTML=!sel?(E.blank?'<div class="eb">Novo processo</div><h2>Seu layout</h2><div class="note">Entre no editor para criar áreas, instalar equipamentos e conectar esteiras.</div>':home()):k==='m'?mPanel(M[id]):aPanel(A[id]);panel.scrollTop=0;panel.hidden=!sel;
 document.querySelectorAll('.side .al').forEach(b=>b.classList.toggle('on',!!sel&&b.dataset.a===(k==='m'?M[id].a:id)));
 if(!sel){goal.t.copy(HOME);goal.d=homeD();so.visible=sp.visible=false}
 else{const m=k==='m'?M[id]:null,o=m||A[id],x=m?A[m.a].x+m.dx:o.x,z=m?A[m.a].z+m.dz:o.z,size=m?footprint(m):o,w=m?size.w+1.2:o.w-.4,d=m?size.d+1.2:o.d-.4;
  goal.t.set(x,0,z);goal.d=m?26:46;so.position.set(x,.16,z);sp.position.set(x,.14,z);so.scale.set(w,1,d);sp.scale.set(w,1,d);so.visible=sp.visible=true;sp.material.opacity=m?.16:.08}
 MS.forEach(m=>m.bm.emissive.setHex(sel&&sel.k==='m'&&sel.id===m.id?0x30404f:0))}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-m],[data-home]');if(!t)return;if(t.dataset.home!==undefined)select(null);else if(t.dataset.m)select('m',t.dataset.m);else select('a',t.dataset.a)});
/* interação */
const ray=new THREE.Raycaster(),nd=new THREE.Vector2(),tip=$('#tip'),ptrs=new Map();let moved=0;
function hit(e){const r=cv.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(nd,cam3);const h=ray.intersectObjects(pick.filter(o=>o.visible&&(!o.parent||o.parent.visible)))[0];return h&&h.object.userData}
function hover(e){const u=hit(e);cv.style.cursor=u?'pointer':'grab';if(!u){tip.style.display='none';return}
 tip.textContent=u.m?`${u.m.id} ${u.m.n}: ${SN[u.m.s]}`:`Área ${u.a.n}`;tip.style.display='block';const r=stage.getBoundingClientRect();tip.style.left=e.clientX-r.left+14+'px';tip.style.top=e.clientY-r.top+14+'px'}
function pan(dx,dy){const k=Math.max(.02,cam.d*.00135),s=Math.sin(cam.th),c=Math.cos(cam.th);
 [goal.t,cam.t].forEach(t=>{t.x=clamp(t.x-c*dx*k-s*dy*k,-380,380);t.z=clamp(t.z+s*dx*k-c*dy*k,-380,380)})}

/* Navegação horizontal no mesmo referencial da câmera orbital. */
const cameraKeys=new Set(),cameraKeyVelocity={x:0,z:0};
let lastCameraKeyFrame=0;
const cameraTextFocus=el=>el?.matches?.('input,textarea,select')||el?.isContentEditable;
const cameraKeysBlocked=()=>document.hidden||cameraTextFocus(document.activeElement)||
 ptrs.size||E.drag||E.placing||E.from||activeCatalogueDrag||installPending;
function stopCameraKeys(){cameraKeys.clear();cameraKeyVelocity.x=cameraKeyVelocity.z=0}
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.altKey||e.metaKey){stopCameraKeys();return}
 const key=e.key.toLowerCase();
 if(!['w','a','s','d'].includes(key)||e.defaultPrevented||e.isComposing||cameraTextFocus(e.target)||cameraKeysBlocked())return;
 if(!e.repeat)cameraKeys.add(key);
 if(cameraKeys.has(key))e.preventDefault();
});
window.addEventListener('keyup',e=>cameraKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',stopCameraKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCameraKeys()});
document.addEventListener('focusin',e=>{if(cameraTextFocus(e.target))stopCameraKeys()});
window.addEventListener('pointerdown',stopCameraKeys,{capture:true});

function moveCameraKeyAxis(axis,wanted,min,max,dt,response,blend){
 const current=goal.t[axis],velocity=cameraKeyVelocity[axis];
 const remaining=wanted>0?max-current:current-min;
 const target=wanted*clamp(remaining/14,0,1);
 // Integra a velocidade amortecida durante o frame, inclusive ao soltar a tecla.
 const step=target*dt+(velocity-target)*blend/response;
 const shift=clamp(step,Math.min(0,min-current),Math.max(0,max-current));
 const next=velocity+(target-velocity)*blend;
 cameraKeyVelocity[axis]=shift===step&&(target||Math.abs(next)>.05)?next:0;
 // Preserva a distância e a orientação mesmo durante a transição para um foco.
 cam.t[axis]+=shift;goal.t[axis]+=shift;
}
function updateCameraKeys(time){
 const dt=clamp((time-lastCameraKeyFrame)/1000,0,.25);
 lastCameraKeyFrame=time;
 if(!cameraKeys.size&&!cameraKeyVelocity.x&&!cameraKeyVelocity.z)return;
 if(cameraKeysBlocked()){stopCameraKeys();return}
 const forward=Number(cameraKeys.has('w'))-Number(cameraKeys.has('s'));
 const right=Number(cameraKeys.has('d'))-Number(cameraKeys.has('a'));
 const length=Math.hypot(forward,right),speed=clamp(cam.d*.55,12,100)/(length||1);
 const s=Math.sin(cam.th),c=Math.cos(cam.th);
 const response=length?14:19,blend=-Math.expm1(-response*dt);
 const p=E.process,margin=clamp(cam.d*.5,16,80);
 moveCameraKeyAxis('x',(c*right-s*forward)*speed,p.x-p.w/2-margin,p.x+p.w/2+margin,dt,response,blend);
 moveCameraKeyAxis('z',(-s*right-c*forward)*speed,p.z-p.d/2-margin,p.z+p.d/2+margin,dt,response,blend);
}

cv.addEventListener('pointerdown',e=>{if(E.on&&e.ctrlKey&&e.button===0){cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});return}if(editorPointerDown(e))return;cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1)moved=0});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p){if(!editorPointerMove(e))hover(e);return}
 const dx=e.clientX-p.x,dy=e.clientY-p.y;tip.style.display='none';
 if(ptrs.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(e.buttons&2||e.shiftKey||(E.on&&e.ctrlKey))pan(dx,dy);else{cam.th-=dx*.006;cam.ph=clamp(cam.ph-dy*.005,.08,1.54)}}
 else if(ptrs.size===2){const o=[...ptrs.entries()].find(([id])=>id!==e.pointerId)[1];moved+=10;goal.d=clamp(goal.d*Math.hypot(p.x-o.x,p.y-o.y)/Math.max(1,Math.hypot(e.clientX-o.x,e.clientY-o.y)),14,700)}
 p.x=e.clientX;p.y=e.clientY});
const up=e=>{const handled=editorPointerUp(e);if(!handled&&E.on&&ptrs.size===1&&moved<5&&e.type==='pointerup'&&!e.ctrlKey&&!E.placing){selectEditorObject(e)}else if(!handled&&!E.on&&ptrs.size===1&&moved<5&&e.type==='pointerup'){const u=hit(e);if(u)u.m?select('m',u.m.id):select('a',u.a.id)}ptrs.delete(e.pointerId)};
cv.addEventListener('pointerleave',()=>{tip.style.display='none'});
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('lostpointercapture',up);cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{e.preventDefault();if(E.drag?.kind==='machine-rotate')return;goal.d=clamp(goal.d*(1+Math.sign(e.deltaY)*.1),14,700)},{passive:false});

/* EDITOR DE LAYOUT - regras espaciais em coordenadas da fábrica */
const E={on:false,mode:'areas',editorHome:true,selected:null,machineSelected:null,linkSelected:null,placing:null,drag:null,dirty:false,blank:false,from:null,flowDir:0,links:[],statusText:'',removedAreas:[],removedMachines:[],editorCollapsed:false,newAreaForm:false,newMachineForm:false,newStationForm:false,process:{x:.5,z:0,w:84,d:46},processReady:true};
const EH=$('#editorHandles'),ED=$('#edBody'),ST=$('.stage');
const editorTools=mapConstructionTools;
const toolLock='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>';
function editorToolBlock(mode){
 if(mode==='process')return '';
 if(!E.processReady)return 'Crie primeiro o processo.';
 if(mode==='areas')return '';
 const areas=AL.filter(a=>a.floor?.visible&&Number.isFinite(a.w)&&Number.isFinite(a.d)&&a.w>=8&&a.d>=8);
 if(!areas.length)return 'Adicione ao menos uma área de manufatura.';
 if(mode==='flow'&&MS.filter(m=>m.mesh?.visible&&areas.includes(A[m.a])).length<2)return 'Adicione ao menos dois equipamentos ou estações antes de criar esteiras.';
 return '';
}
function openEditorTool(mode){
 if(!editorTools.some(([key])=>key===mode))return false;
 const reason=editorToolBlock(mode);if(reason){status(reason,true);return false}
 cancelMachineRotation();stopCatalogueDrag();setEditorCollapsed(false);
 E.editorHome=false;E.mode=mode;E.placing=null;E.drag=null;E.selected=null;E.linkSelected=null;E.from=null;
 drawEditor();return true;
}
function backToEditorHome(){
 cancelMachineRotation();stopCatalogueDrag();E.placing=null;E.drag=null;E.from=null;
 ghost.visible=false;clearGhostModel();E.editorHome=true;drawEditor();
}
const editorDrawer=$('#edDrawer'),machineOutline=new THREE.Group();
const machineOutlineMaterial=new THREE.LineBasicMaterial({color:0x61b3ff,transparent:true,opacity:.94,depthWrite:false});
function clearMachineOutline(){
 machineOutline.parent?.remove(machineOutline);
 for(const line of machineOutline.children)line.geometry.dispose();
 machineOutline.clear();
}
function syncMachineOutline(){
 const m=E.on?M[E.machineSelected]:null,target=m?.mesh.visible?m.mesh:null;
 if(machineOutline.parent===target)return;
 clearMachineOutline();
 if(!target)return;
 // Realça os volumes do modelo. Visores finos, operadores e luzes de status ficam intactos.
 for(const part of target.children){
  if(part.geometry?.type!=='BoxGeometry'||part.geometry.parameters.depth<.2)continue;
  const line=new THREE.LineSegments(new THREE.EdgesGeometry(part.geometry),machineOutlineMaterial);
  line.position.copy(part.position);line.quaternion.copy(part.quaternion);line.scale.copy(part.scale).multiplyScalar(1.004);
  machineOutline.add(line);
 }
 target.add(machineOutline);
}
function setEditorCollapsed(collapsed){
 E.editorCollapsed=collapsed;editorDrawer.classList.toggle('collapsed',collapsed);
 $('#edCollapse').textContent=collapsed?'Expandir':'Recolher';$('#edCollapse').setAttribute('aria-expanded',String(!collapsed));
}
$('#edCollapse').onclick=()=>{cancelMachineRotation();setEditorCollapsed(!E.editorCollapsed)};
function revealMachineEditor(){
 setEditorCollapsed(false);
 const workspace=ED.querySelector('.edworkspace'),section=ED.querySelector('#edSelectedEquipment')||ED.querySelector('.edform');
 if(!workspace||!section)return;
 const top=workspace.scrollTop+section.getBoundingClientRect().top-workspace.getBoundingClientRect().top;
 if(workspace.scrollHeight>workspace.clientHeight)workspace.scrollTo({top,behavior:'instant'});
}
const SNAP=1, CLEARANCE=.55;
const snap=n=>Math.round(n/SNAP)*SNAP;
const safe=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function boxOf(o){return{x0:o.x-o.w/2,x1:o.x+o.w/2,z0:o.z-o.d/2,z1:o.z+o.d/2}}
function inside(o,p,pad=0){const b=boxOf(o),r=boxOf(p),margin=pad-1e-8;return r.x0>=b.x0+margin&&r.x1<=b.x1-margin&&r.z0>=b.z0+margin&&r.z1<=b.z1-margin}
function overlap(a,b,pad=0){const x=boxOf(a),y=boxOf(b);return x.x0<y.x1+pad&&x.x1>y.x0-pad&&x.z0<y.z1+pad&&x.z1>y.z0-pad}
function footprint(m,rot){const r=((rot===undefined?(m.rot||0):rot)%4+4)%4;return{w:r%2?m.d:m.w,d:r%2?m.w:m.d}}
function machineRect(m,x,z,rot){if(isStation(m))return stationBodyRect(m,x,z,rot);const size=footprint(m,rot);return{x,w:size.w+.15,z,d:size.d+.15}}
function machineAreaRect(m,x,z,rot){
 const rect=machineRect(m,x,z,rot);if(!isStation(m))return rect;
 const a=boxOf(rect),b=boxOf(stationLane(m,x,z,rot));
 const x0=Math.min(a.x0,b.x0),x1=Math.max(a.x1,b.x1),z0=Math.min(a.z0,b.z0),z1=Math.max(a.z1,b.z1);
 return{x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0};
}
function machineGap(a,b){const p=boxOf(a),q=boxOf(b);return {x:Math.max(0,Math.max(p.x0-q.x1,q.x0-p.x1)),z:Math.max(0,Math.max(p.z0-q.z1,q.z0-p.z1))}}
function insideProcess(rect){return inside(E.process,rect,.4)}
function applyProcess(){const p=E.process,g=plinth.geometry.parameters;
 if(g.width!==p.w||g.depth!==p.d){plinth.geometry.dispose();plinth.geometry=new THREE.BoxGeometry(p.w,.6,p.d)}
 plinth.position.set(p.x,-.3,p.z);
}
function translateDemo(dx,dz){
 if(E.blank)return;
 demoOffset.x+=dx;demoOffset.z+=dz;
 for(const belt of demoBelts){belt.position.x+=dx;belt.position.z+=dz}
}
function moveProcessTo(x,z){
 // O movimento é uma translação: todos os filhos mantêm sua distância em relação ao processo.
 const p=E.process,dx=x-p.x,dz=z-p.z;
 if(Math.abs(dx)<1e-7&&Math.abs(dz)<1e-7)return;
 p.x=x;p.z=z;applyProcess();translateDemo(dx,dz);
 for(const a of AL){if(!a.floor||!a.floor.visible)continue;a.x+=dx;a.z+=dz;applyArea(a,false)}
 updateLinks();
}
function validateProcessMove(x,z){
 const p=E.process;
 if(Math.abs(x)+p.w/2>400||Math.abs(z)+p.d/2>400)return 'Limite externo do mapa atingido.';
 return '';
}
function validateProcess(rect){if(![rect.x,rect.z,rect.w,rect.d].every(Number.isFinite))return 'Informe dimensões válidas.';
 if(rect.w<14||rect.d<14)return 'A área geral deve ter no mínimo 14 × 14 unidades.';
 if(Math.abs(rect.x)+rect.w/2>400||Math.abs(rect.z)+rect.d/2>400)return 'O terreno disponível termina aqui.';
 for(const a of AL)if(a.floor.visible&&!inside(rect,a,.3))return 'Não é possível reduzir: existe uma área de manufatura fora desse limite.';
 return ''}
function validateArea(a,rect){if(![rect.x,rect.z,rect.w,rect.d].every(Number.isFinite))return 'Informe dimensões válidas.';
 if(rect.w<8||rect.d<8)return 'Área mínima: 8 × 8 unidades.';if(!insideProcess(rect))return 'A área de manufatura precisa permanecer dentro da área geral do processo.';
 if(Math.abs(rect.x)+rect.w/2>400||Math.abs(rect.z)+rect.d/2>400)return 'Limite máximo do terreno atingido.';
 for(const m of a.ms){if(!m.mesh||!m.mesh.visible)continue;const p=machineAreaRect(m,a.x+m.dx,a.z+m.dz);if(!inside(rect,p,isStation(m)?0:CLEARANCE))return 'A área precisa comportar todos os equipamentos existentes.'}
 for(const other of AL)if(other!==a&&other.floor.visible&&overlap(rect,other,.5))return 'A área não pode sobrepor outra área.';
 return ''}
function validateMachine(m,a,x,z,rot){
 const candidate={...m,a:a.id,pos:{x,z},rot:rot===undefined?(m.rot||0):rot},rect=machineRect(candidate,x,z);
 if(!inside(a,machineAreaRect(candidate,x,z),isStation(m)?0:CLEARANCE))return isStation(m)?
  'A área precisa comportar a bancada, o operador e o corredor da esteira.':'Posição fora da área. Aumente a área ou escolha outra célula.';
 const lane=isStation(candidate)?stationLane(candidate):null;
 for(const other of a.ms){
  if(other===m||other.id===m.id||!other.mesh||!other.mesh.visible)continue;
  const p=machineRect(other,other.pos.x,other.pos.z);
  const padding=isStation(candidate)&&isStation(other)?-1e-6:.25;
  if(overlap(rect,p,padding))return 'A máquina se sobrepõe a outro equipamento.';
  if(!(isStation(candidate)&&isStation(other))&&(lane&&overlap(lane,p,padding)||isStation(other)&&overlap(rect,stationLane(other),padding)))
   return 'Mantenha livre o corredor da esteira e o acesso ao operador.';
  const gap=machineGap({x,z,...footprint(candidate)},{x:p.x,z:p.z,...footprint(other)});
  if(!isStation(candidate)&&!isStation(other)&&gap.z<.5&&gap.x<3-1e-8)return 'Mantenha pelo menos 3 unidades livres na lateral entre os equipamentos para a esteira.';
 }
 return manualLinkError(candidate);
}
const rotationHandle=$('#edRotateHandle'),rotationCorners=Array.from({length:4},()=>new THREE.Vector3()),rotationCenter=new THREE.Vector3();
const quarterTurn=Math.PI/2,normalizeRotation=rot=>((rot%4)+4)%4;
function machineRotationError(m,rot){
 if(!Number.isInteger(rot)||rot<0||rot>3)return 'Orientação inválida.';
 return rot!==(m.rot||0)&&(isStation(m)||m.w!==m.d&&rot%2!==(m.rot||0)%2)?validateMachine(m,A[m.a],m.pos.x,m.pos.z,rot):'';
}
function applyMachineRotation(m,rot){
 const error=machineRotationError(m,rot);if(error)return error;
 const changed=(m.rot||0)!==rot;m.rot=rot;m.mesh.rotation.y=rot*quarterTurn;syncStationOperator(m);
 if(changed)updateLinks(l=>manualAffectedLink(l,m.id));
 return '';
}
function cancelMachineRotation(){
 const drag=E.drag;if(drag?.kind!=='machine-rotate')return;
 if(M[drag.m.id]===drag.m)drag.m.mesh.rotation.y=(drag.m.rot||0)*quarterTurn;
 syncStationOperator(drag.m);
 E.drag=null;rotationHandle.classList.remove('invalid');
 const label=$('#edRotationValue');if(label)label.textContent=(drag.m.rot||0)*90+'°';
}
function finishMachineRotation(e){
 const drag=E.drag;if(drag?.kind!=='machine-rotate'||drag.pid!==e.pointerId)return;
 e.stopPropagation();
 if(e.type!=='pointerup'){cancelMachineRotation();return}
 const rot=drag.error?drag.lastValidRot:normalizeRotation(Math.round(drag.angle/quarterTurn));
 const error=applyMachineRotation(drag.m,rot);
 if(error){cancelMachineRotation();status(error,true);return}
 E.drag=null;rotationHandle.classList.remove('invalid');saveLayout();drawEditor();
 status(drag.error?drag.error+' Mantida a última orientação válida.':'Orientação '+rot*90+'° salva.',!!drag.error);
}
rotationHandle.onpointerdown=e=>{
 if(e.button!==0||!E.on||E.drag||E.placing||activeCatalogueDrag||installPending)return;
 const m=M[E.machineSelected],p=worldAt(e);if(!m||!p)return;
 e.preventDefault();e.stopPropagation();tip.style.display='none';
 E.drag={kind:'machine-rotate',m,pid:e.pointerId,lastAngle:Math.atan2(m.pos.z-p.z,p.x-m.pos.x),
  angle:(m.rot||0)*quarterTurn,lastValidRot:m.rot||0,error:''};
 rotationHandle.setPointerCapture(e.pointerId);
};
rotationHandle.onpointermove=e=>{
 const drag=E.drag;if(drag?.kind!=='machine-rotate'||drag.pid!==e.pointerId)return;
 e.preventDefault();e.stopPropagation();
 const p=worldAt(e),m=drag.m;if(!p||Math.hypot(p.x-m.pos.x,p.z-m.pos.z)<.5)return;
 const angle=Math.atan2(m.pos.z-p.z,p.x-m.pos.x),delta=angle-drag.lastAngle;
 drag.angle+=Math.atan2(Math.sin(delta),Math.cos(delta));drag.lastAngle=angle;
 const rot=normalizeRotation(Math.round(drag.angle/quarterTurn));drag.error=machineRotationError(m,rot);
 if(!drag.error)drag.lastValidRot=rot;
 m.mesh.rotation.y=drag.angle;syncStationOperator(m,rot);rotationHandle.classList.toggle('invalid',!!drag.error);
 const label=$('#edRotationValue');if(label)label.textContent=rot*90+'°';
 status(drag.error||'Prévia '+rot*90+'° · solte para confirmar.',!!drag.error);
};
rotationHandle.onpointerup=rotationHandle.onpointercancel=rotationHandle.onlostpointercapture=finishMachineRotation;
rotationHandle.onclick=e=>{
 if(e.detail!==0)return;
 const m=M[E.machineSelected];if(!m||E.drag)return;
 const error=applyMachineRotation(m,normalizeRotation((m.rot||0)+1));
 if(error)return status(error,true);saveLayout();drawEditor();
};
window.addEventListener('blur',cancelMachineRotation);
function updateRotationHandle(){
 const m=E.on&&!E.editorHome&&['machines','stations'].includes(E.mode)&&M[E.machineSelected];
 if(!m||E.placing||activeCatalogueDrag||installPending||E.drag&&E.drag.kind!=='machine-rotate'){
  rotationHandle.style.display='none';return;
 }
 rotationCenter.set(0,m.h*.5,0);m.mesh.localToWorld(rotationCenter);rotationCenter.project(cam3);
 let best=null,score=-Infinity;
 for(let i=0;i<4;i++){
  const v=rotationCorners[i].set((i%2?1:-1)*m.w/2,m.h+.3,(i<2?-1:1)*m.d/2);
  m.mesh.localToWorld(v);v.project(cam3);if(!inView(v))continue;
  const dx=v.x-rotationCenter.x,dy=v.y-rotationCenter.y;
  const x=(v.x*.5+.5)*W+Math.sign(dx)*16,y=(-v.y*.5+.5)*H-Math.sign(dy)*16;
  if(x<18||x>W-18||y<18||y>H-18)continue;
  const candidate=dx-dy;if(candidate>score){score=candidate;best={x,y}}
 }
 rotationHandle.style.display=best?'block':'none';
 if(best){rotationHandle.style.left=best.x+'px';rotationHandle.style.top=best.y+'px'}
}
function applyArea(a,refreshLinks=true){
 const g=a.floor.geometry.parameters;
 if(g.width!==a.w||g.depth!==a.d){a.floor.geometry.dispose();a.floor.geometry=new THREE.BoxGeometry(a.w,.12,a.d);
  a.edge.geometry.dispose();a.edge.geometry=new THREE.EdgesGeometry(a.floor.geometry)}
 a.floor.position.set(a.x,.06,a.z);a.edge.position.copy(a.floor.position);buildAreaGrid(a);
 a.ms.forEach(m=>m.mesh.position.set(a.x+m.dx,.12,a.z+m.dz));
 if(refreshLinks)updateLinks(l=>M[l.from].a===a.id||M[l.to].a===a.id||isStation(M[l.from])||isStation(M[l.to]));
}
/* Redimensionar muda apenas o piso; mover a área usa applyArea normalmente.
   As posições mundiais dos equipamentos ficam preservadas durante o resize. */
function applyResizedArea(a,rect){
 const fixed=a.ms.filter(m=>m.mesh&&m.mesh.visible).map(m=>({
  m,x:m.mesh.position.x,z:m.mesh.position.z
 }));
 Object.assign(a,rect);
 for(const item of fixed){
  item.m.dx=item.x-a.x;
  item.m.dz=item.z-a.z;
 }
 applyArea(a,false);
}
function refreshAreas(){AL.forEach((a,i)=>{a.i=i;a.oee=a.ms.length?avg(a.ms,'oee'):0;a.fpy=a.ms.length?avg(a.ms,'fpy'):0});$('#al').innerHTML='<h4>Áreas</h4>'+AL.filter(a=>a.floor.visible).map(a=>`<button class="al" data-a="${a.id}"><em>${a.i+1}</em>${safe(a.n)}<span class="dots">${a.ms.map(m=>`<i class="dot" style="background:${SC[m.s]}"></i>`).join('')}</span></button>`).join('');}
let storageNotice='';
function status(t,bad=false){const el=$('#edStatus')||$('#edMenuMessage');if(el){el.hidden=false;el.textContent=[t,storageNotice].filter(Boolean).join(' ');el.className='edstatus '+(bad||storageNotice?'ederror':'edok')}}
function setEdit(on){cancelMachineRotation();E.on=on;ST.classList.toggle('editor-mode',on);$('#editToggle').textContent=on?'Concluir edição':'Editar layout';$('#editToggle').classList.toggle('primary',!on);
 if(installPending)closeInstallDialog();stopCatalogueDrag();E.placing=null;E.drag=null;E.selected=null;E.machineSelected=null;E.linkSelected=null;E.from=null;if(on){E.editorHome=true;setEditorCollapsed(false);E.mode=E.blank?'process':'areas';panel.style.pointerEvents='none';drawEditor();}else{rotationHandle.style.display='none';syncMachineOutline();panel.style.pointerEvents='';select(null)} }
$('#editToggle').onclick=()=>setEdit(!E.on);$('#edExit').onclick=()=>setEdit(false);
$('#edFocus').onclick=()=>{if(!E.editorHome&&E.mode==='process'){const p=E.process;goal.t.set(p.x,0,p.z);goal.d=clamp(Math.max(p.w,p.d)*1.3*Math.max(1,1.5/(W/H)),14,700);return}if((E.mode==='machines'||E.mode==='stations')&&E.machineSelected&&M[E.machineSelected]){const m=M[E.machineSelected];goal.t.set(m.pos.x,0,m.pos.z);goal.d=28;return}if(!E.selected||!A[E.selected])return;const a=A[E.selected];goal.t.set(a.x,0,a.z);goal.d=50};
const types=[['SMT',210],['Testes manuais',195],['Testes automáticos',270],['Corte de placas',35],['Estoque',45],['Montagem',160],['Embalagem',25],['Personalizada',90]];
/* Pegadas de instalação em células inteiras: largura X, profundidade Z.
   Todos os equipamentos de processo têm profundidade 4, alinhando as conexões.
   Medidas visuais relativas (não representam dimensões técnicas de fabricante). */
const stations=[['BAN','Bancada de inspeção/operação manual',5,2.3,5],['INS','Bancada de inserção PTH',5,2.3,5],['REPARO','Estação de diagnóstico e reparo',5,2.3,5],['MONT','Estação de montagem manual',5,2.3,5],['TST','Bancada de teste manual',5,2.3,5]];
const catalogue=[['SPI','Inspeção de pasta (SPI)',4,2.6,4],['NXT','Montadora NXT',6,2.8,4],['AOI','Inspeção óptica (AOI)',4,2.6,4],['ICT','Teste em circuito (ICT)',4,2.6,4],['FCT','Teste funcional (FCT)',4,2.6,4],['PR','Impressora de pasta',4,2.6,4],['RF','Forno de refusão',8,2.4,4],['BAN','Bancada de operação',6,2.3,5],['EM','Embaladora',5,2.6,4],['AUTO','Testador automático',6,3,4],['CUT','Corte de placas',6,2.8,4]];
function machineKind(m){if(m.kind&&m.kind!=='CUSTOM')return m.kind;
 if(m.id.toUpperCase().startsWith('FCT-')||m.n.toUpperCase().includes('TESTE FUNCIONAL'))return 'FCT';const id=m.id.toUpperCase(),n=m.n.toUpperCase();
 if(id.startsWith('RF-')||n.includes('FORNO'))return 'RF';
 if(id.startsWith('AOI-')||n.includes('INSPEÇÃO ÓPTICA'))return 'AOI';
 if(id.startsWith('SPI-')||n.includes('INSPEÇÃO DE PASTA'))return 'SPI';
 if(id.startsWith('NXT-')||id.startsWith('PP-')||n.includes('MONTADORA'))return 'NXT';
 if(id.startsWith('ICT-')||n.includes('CIRCUITO'))return 'ICT';
 if(id.startsWith('QA-'))return 'AOI';
 if(id.startsWith('PR-')||n.includes('IMPRESSORA DE PASTA'))return 'PR';
 return 'GENERAL';}

/* Catálogo usa a geometria modular do projeto; uma câmera Three.js gera miniaturas reais. */
const thumbCache=new Map();let thumbRenderer=null;
function previewModel(c,station,side=1,lineRot,rot=0){return mapModel({w:c[2],h:c[3],d:c[4],kind:c[0],station,side:station?side:undefined,manualType:c[0]==='TST'?'test':'inspection',lineRot,rot})}
function disposeModel(model,shared=[]){
 const materials=new Set();model.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!shared.includes(o.material))materials.add(o.material)});
 for(const material of materials)material.dispose();
}
function previewEnvironment(scene){scene.add(new THREE.HemisphereLight(0xffffff,0x556779,.75));const light=new THREE.DirectionalLight(0xffffff,.8);light.position.set(-7,14,15);scene.add(light);}
function modelThumb(c,station){const key=c[0]+':'+station;if(thumbCache.has(key))return thumbCache.get(key);
 let model;
 try{if(!thumbRenderer){thumbRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});thumbRenderer.setPixelRatio(1);thumbRenderer.setSize(230,160)}
  const scene=new THREE.Scene();previewEnvironment(scene);model=previewModel(c,station);model.rotation.y=-.5;scene.add(model);
  const maxDim=Math.max(c[2],c[4],c[3]),camera=new THREE.PerspectiveCamera(35,230/160,.1,100);camera.position.set(maxDim*.85,c[3]*1.6+maxDim*.25,maxDim*1.6);camera.lookAt(0,c[3]*.5,0);
  thumbRenderer.render(scene,camera);const uri=thumbRenderer.domElement.toDataURL('image/png');thumbCache.set(key,uri);return uri;
 }catch(err){console.warn('Miniatura indisponível',err);return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="230" height="160"><rect width="230" height="160" fill="#253440"/><rect x="42" y="36" width="145" height="92" rx="9" fill="#8d9eae"/><rect x="71" y="62" width="88" height="43" fill="#293d4b"/></svg>')}
 finally{if(model)disposeModel(model)}
}
let activeCatalogueDrag=null,installPending=null,installPreview=null;
const invisibleDragImage=(()=>{const img=new Image();img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';return img})();
function startCatalogueDrag(e,c,station){const reason=editorToolBlock(station?'stations':'machines');if(reason){e.preventDefault();status(reason,true);return}if(!AL.length){e.preventDefault();status('Crie uma área de manufatura antes de instalar modelos.',true);return}
 activeCatalogueDrag={c,station,rot:0};E.placing=null;ST.classList.add('dragging-catalog');
 e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain','factory-map-catalogue:'+c[0]);
 // Esconde a imagem nativa do navegador e deixa apenas o fantasma 3D no mapa.
 if(e.dataTransfer.setDragImage)e.dataTransfer.setDragImage(invisibleDragImage,0,0);
}
function stopCatalogueDrag(){clearAlignment();activeCatalogueDrag=null;ST.classList.remove('dragging-catalog');if(!E.placing){ghost.visible=false;clearGhostModel();}}
function manualPlacement(c,station,rot,a,x,z){
 const prototype={w:c[2],d:c[4],rot:rot||0,station,kind:c[0],side:station?1:undefined};
 const error=validateMachine(prototype,a,x,z);
 if(station&&error&&!validateMachine({...prototype,side:-1},a,x,z))return{side:-1,error:''};
 return{side:1,error};
}
function catalogueHover(e){if(!activeCatalogueDrag||!E.on)return;e.preventDefault();e.dataTransfer.dropEffect='copy';
 const p=worldAt(e,.136);if(!p){ghost.visible=false;clearGhostModel();return}const c=activeCatalogueDrag.c,x=snap(p.x),z=snap(p.z),a=AL.filter(a=>a.floor.visible).find(a=>inside(a,{x,z,w:0,d:0}));
 const placement=a?manualPlacement(c,activeCatalogueDrag.station,0,a,x,z):{side:1,error:'Fora de uma área de manufatura'};
 placeGhost(c,activeCatalogueDrag.station,x,z,0,!placement.error,placement.side);
 if(a)showMachineAlignment({w:c[2],d:c[4],rot:0,station:activeCatalogueDrag.station,side:activeCatalogueDrag.station?placement.side:undefined,a:a.id},x,z,!placement.error);else clearAlignmentLines();
}
stage.addEventListener('dragover',catalogueHover);
stage.addEventListener('drop',e=>{if(!activeCatalogueDrag||!E.on)return;e.preventDefault();const item=activeCatalogueDrag,p=worldAt(e,.136);stopCatalogueDrag();if(!p)return status('Solte o modelo sobre uma área de manufatura.',true);
 const x=snap(p.x),z=snap(p.z),a=AL.filter(a=>a.floor.visible).find(a=>inside(a,{x,z,w:0,d:0}));if(!a)return status('Solte o modelo dentro de uma área de manufatura.',true);
 const placement=manualPlacement(item.c,item.station,0,a,x,z);if(placement.error)return status(placement.error,true);
 openInstallDialog({c:item.c,station:item.station,side:placement.side,rot:0,x,z,a:a.id});
});
function openInstallDialog(info){clearAlignment();installPending=info;E.placing=null;ghost.visible=false;clearGhostModel();
 const area=A[info.a];$('#edInstallTitle').textContent=info.station||info.c[0]==='AUTO'?info.c[1]:'Adicionar equipamento';$('#edInstallProcess').textContent=E.processName||'Nova linha de produção';$('#edInstallArea').textContent=area.n;
 $('#edInstallId').value=nextMachineId(info.c[0]);$('#edInstallError').textContent='';$('#edInstallOverlay').classList.add('open');
 $('#edInstallManual').hidden=!info.station;info.side=info.side===-1?-1:1;$('#edInstallSide').value=String(info.side);$('#edInstallFlow').value=info.lineRot===undefined?'auto':String(info.lineRot);
 $('#edInstallMode').value=manualDisposition(info);startInstallPreview(info.c,info.station,info.side,info.lineRot,info.rot);$('#edInstallId').focus();$('#edInstallId').select();
}
function closeInstallDialog(){installPending=null;$('#edInstallOverlay').classList.remove('open');stopInstallPreview();clearGhostModel();}
function startInstallPreview(c,station,side=1,lineRot,rot=0){stopInstallPreview();const host=$('#edInstallVisual');host.innerHTML='';
 try{const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));const w=host.clientWidth||380,h=host.clientHeight||205;renderer.setSize(w,h);host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();previewEnvironment(scene);const model=previewModel(c,station,side,lineRot,rot);scene.add(model);const camera=new THREE.PerspectiveCamera(35,w/h,.1,100);const size=Math.max(c[2],c[4],c[3]);camera.position.set(size*.85,c[3]*1.55+size*.3,size*1.65);camera.lookAt(0,c[3]/2,0);
 const state={renderer,model,frame:0};installPreview=state;
 const tick=()=>{model.rotation.y+=.005;if(model.userData.fixture)updateFixture(model.userData.fixture,performance.now());renderer.render(scene,camera);state.frame=requestAnimationFrame(tick)};tick();
 }catch(err){stopInstallPreview();console.warn('Prévia WebGL indisponível',err);host.textContent='Não foi possível carregar a prévia 3D.'}}
function stopInstallPreview(){const st=installPreview;if(!st)return;cancelAnimationFrame(st.frame);disposeModel(st.model);st.renderer.dispose();st.renderer.forceContextLoss();st.renderer.domElement.remove();installPreview=null;}
$('#edInstallSide').onchange=e=>{if(!installPending)return;installPending.side=Number(e.target.value);startInstallPreview(installPending.c,true,installPending.side,installPending.lineRot,installPending.rot)};
$('#edInstallFlow').onchange=e=>{if(!installPending)return;installPending.lineRot=e.target.value==='auto'?undefined:Number(e.target.value);$('#edInstallMode').value=manualDisposition(installPending);startInstallPreview(installPending.c,true,installPending.side,installPending.lineRot,installPending.rot)};
$('#edInstallMode').onchange=e=>{if(!installPending)return;Object.assign(installPending,manualModeChange(installPending,e.target.value));$('#edInstallFlow').value=String(installPending.lineRot);startInstallPreview(installPending.c,true,installPending.side,installPending.lineRot,installPending.rot)};
$('#edInstallCancel').onclick=()=>{closeInstallDialog();status('Instalação cancelada. Arraste outro modelo para continuar.')};
$('#edInstallConfirm').onclick=()=>{if(!installPending)return;const p=installPending,id=$('#edInstallId').value.trim(),errNode=$('#edInstallError');
 if(!validMachineId(id)){errNode.textContent='Use um ID de até 48 caracteres, com letras, números, hífen, ponto ou sublinhado.';return}
 if(M[id]){errNode.textContent='Já existe um equipamento ou estação com este ID.';return}
 const a=A[p.a];if(!a){errNode.textContent='A área de destino não existe mais.';return}
 const err=validateMachine({w:p.c[2],d:p.c[4],rot:p.rot,station:p.station,kind:p.c[0],side:p.station?p.side:undefined,lineRot:p.lineRot},a,p.x,p.z);if(err){errNode.textContent=err;return}
 const machine=newMachine(a,{c:p.c,id,name:p.c[1],rot:p.rot,station:p.station,side:p.side,lineRot:p.lineRot},p.x,p.z);E.machineSelected=machine.id;
 closeInstallDialog();refreshAreas();updateDashboard();saveLayout();drawEditor();status(id+' instalado em '+a.n+'.');
};
$('#edInstallId').addEventListener('keydown',e=>{if(e.key==='Enter'){$('#edInstallConfirm').click();e.preventDefault()}});
function isStation(m){return !!m.station||m.side!==undefined}
function manualRelation(m){
 const lane=stationLane(m),dx=m.pos.x-lane.x,dz=m.pos.z-lane.z;
 const lateral=dx*-lane.tz+dz*lane.tx;
 const relation=(manualDisposition(m)==='lateral'?'Lateral à esteira · ':'Paralela à esteira · ')+(Math.abs(lateral)>.1?(lateral>0?'Bancada à direita da linha':'Bancada à esquerda da linha'):'Posto de frente para o fluxo');
 const compass=Math.abs(lane.x-m.pos.x)>Math.abs(lane.z-m.pos.z)?(lane.x>m.pos.x?'leste':'oeste'):(lane.z>m.pos.z?'sul':'norte');
 const paired=MS.find(other=>other!==m&&pairedStations(m,other));
 return relation+' · corredor ao '+compass+(paired?' · alinhado com '+paired.id:'');
}
function workcellDescription(m){
 if(isStation(m))return manualStationType(m)==='test'?'Bancada de teste manual · 3 jigs':'Bancada de inspeção/operação manual';
 return ['FCT','AUTO'].includes(machineKind(m))?'Testador automático · fixture assistido':'';
}
function rebuildWorkcell(m){
 if(machineOutline.parent===m.mesh)clearMachineOutline();
 sc.remove(m.mesh);m.mesh.traverse(o=>{const i=pick.indexOf(o);if(i>=0)pick.splice(i,1)});
 disposeModel(m.mesh,[glass,pole,shirt,skin]);
 buildMachine(m);m.mesh.rotation.y=(m.rot||0)*Math.PI/2;themeMachine(m);
}
function changeManualLayout(m,changes){
 if(E.drag||E.placing)return status('Conclua a operação atual antes de alterar o corredor.',true);
 const draft={...m,...changes},error=validateMachine(draft,A[m.a],m.pos.x,m.pos.z);
 if(error){drawEditor();status(error,true);return}
 const rebuild=draft.side!==m.side;Object.assign(m,changes);
 if(rebuild)rebuildWorkcell(m);else{m.mesh.rotation.y=(m.rot||0)*quarterTurn;syncStationOperator(m)}
 refreshManualLinks();saveLayout();drawEditor();status('Corredor e orientação do posto atualizados.');
}
const validMachineId=id=>/^[A-Za-z0-9][A-Za-z0-9_.-]{0,47}$/.test(id);
function nextMachineId(pre){let i=1;while(M[pre+'-'+String(i).padStart(2,'0')])i++;return pre+'-'+String(i).padStart(2,'0')}
let areaSeq=0;
function createArea(name,hue,color,position,restoredId){let p=position;
 if(!p){outer:for(let z=Math.ceil((boxOf(E.process).z0+6)/2)*2;z<=boxOf(E.process).z1-6;z+=10)for(let x=Math.ceil((boxOf(E.process).x0+6)/2)*2;x<=boxOf(E.process).x1-6;x+=10){const test={x,z,w:10,d:10};if(insideProcess(test)&&!AL.some(a=>a.floor.visible&&overlap(test,a,.6))){p=test;break outer}}}
 if(!p)return null;
 while(A['custom-'+(areaSeq+1)])areaSeq++;const id=restoredId||'custom-'+(++areaSeq),a={id,n:name,x:p.x,z:p.z,w:p.w,d:p.d,hue,sat:.22,ms:[],prod:'',op:'',lote:'',ord:'',team:[],esc:0,pres:0,wip:0,kwh:0,temp:28,epi:100,prog:0,oee:0,fpy:0};
 AL.push(a);A[id]=a;
 a.mat=new THREE.MeshStandardMaterial({roughness:1});a.floor=new THREE.Mesh(new THREE.BoxGeometry(a.w,.12,a.d),a.mat);a.floor.position.set(a.x,.06,a.z);a.floor.receiveShadow=true;a.floor.userData.a=a;sc.add(a.floor);pick.push(a.floor);
 a.edge=new THREE.LineSegments(new THREE.EdgesGeometry(a.floor.geometry),new THREE.LineBasicMaterial());a.edge.position.copy(a.floor.position);sc.add(a.edge);
 buildAreaGrid(a);
 a.lb=mk('lb',name);a.lb.dataset.a=id;theme();refreshAreas();return a}
function newMachine(a,config,x,z){const c=config.c,id=config.id,m={a:a.id,id,n:config.name,rot:config.rot||0,kind:config.kind||c[0],station:!!config.station,side:config.station?(config.side===-1?-1:1):undefined,manualType:config.station?(config.manualType||(c[0]==='TST'?'test':'inspection')):undefined,lineRot:config.lineRot,w:c[2],h:c[3],d:c[4],dx:x-a.x,dz:z-a.z,s:'run',ideal:90,disp:94,perf:94,qual:98.5,prod:0,meta:650,ref:0,retr:0,ciclo:40,std:40,park:0,stops:0,alarm:0,since:'0 min',why:'',oper:'Não definido',prg:'Não definido',mtbf:180,mttr:30,kwh:0,last:'—',next:'—',hr:[0,0,0,0,0,0]};
 m.oee=m.disp*m.perf*m.qual/1e4;m.fpy=m.qual;m.custom=true;a.ms.push(m);MS.push(m);M[id]=m;buildMachine(m);themeMachine(m);m.mesh.rotation.y=m.rot*Math.PI/2;m.lb=mk('lb mt',id);m.lb.style.boxShadow=`inset 3px 0 0 ${SC[m.s]}`;refreshAreas();return m}
const storageKey='factory3dmap.layout.v1';
const machineState=m=>({id:m.id,n:m.n,a:m.a,dx:m.dx,dz:m.dz,rot:m.rot||0,side:isStation(m)?manualSide(m):undefined,manualType:isStation(m)?manualStationType(m):undefined,lineRot:m.lineRot,kind:m.kind||machineKind(m)});
function saveLayout(){
 try{
  const data={version:3,blank:E.blank,process:E.process,processReady:E.processReady,processName:E.processName||'Nova linha de produção',
   flowDir:E.flowDir,links:E.links.map(l=>({from:l.from,to:l.to})),demoOffset,
   areas:AL.map(a=>({id:a.id,n:a.n,x:a.x,z:a.z,w:a.w,d:a.d,hue:a.hue,custom:a.id.startsWith('custom-')})),
   removedAreas:E.removedAreas,removedMachines:E.removedMachines,
   demoMachines:MS.filter(m=>!m.custom).map(m=>({...machineState(m),demoId:m.demoId})),
   machines:MS.filter(m=>m.custom).map(m=>({...machineState(m),w:m.w,h:m.h,d:m.d,kind:m.kind||machineKind(m),station:!!m.station}))};
  localStorage.setItem(storageKey,JSON.stringify(data));storageNotice='';
 }catch(err){storageNotice='Não foi possível salvar no navegador.';status('',true)}
}
function checkSavedLayout(data){
 const finite=(n,max=800)=>Number.isFinite(n)&&Math.abs(n)<=max;
 const dimensions=(n,min)=>finite(n)&&n>=min;
 const id=v=>typeof v==='string'&&v.length>0;
 const rect=(p,min)=>p&&finite(p.x,400)&&finite(p.z,400)&&dimensions(p.w,min)&&dimensions(p.d,min);
 const invalid=()=>{throw new Error('Estrutura do layout inválida')};
 if(!data||![1,2,3].includes(data.version)||!Array.isArray(data.areas))invalid();
 for(const key of ['machines','demoMachines','links','removedAreas','removedMachines'])
  if(data[key]!==undefined&&!Array.isArray(data[key]))invalid();
 if(data.process!==undefined&&!rect(data.process,14)||data.processName!==undefined&&typeof data.processName!=='string')invalid();
 if(data.demoOffset&&(!finite(data.demoOffset.x)||!finite(data.demoOffset.z)))invalid();
 if(data.flowDir!==undefined&&![0,1,-1].includes(data.flowDir))invalid();
 const areas=new Set();
 for(const p of data.areas){
  if(!rect(p,8)||!id(p.id)||typeof p.n!=='string'||!finite(p.hue,360)||areas.has(p.id)||
     (p.custom?!/^custom-\d+$/.test(p.id):data.blank||!A[p.id]))invalid();
  areas.add(p.id);
 }
 const removedAreas=new Set(data.removedAreas),removedMachines=new Set(data.removedMachines);
 if(![...removedAreas,...removedMachines].every(id))invalid();
 const areaExists=key=>areas.has(key)||(!data.blank&&A[key]&&!removedAreas.has(key));
 const edited=new Set(),machines=new Set();
 const machine=p=>p&&id(p.id)&&typeof p.n==='string'&&areaExists(p.a)&&finite(p.dx)&&finite(p.dz)&&
  (p.rot===undefined||Number.isInteger(p.rot)&&p.rot>=0&&p.rot<=3)&&
  (p.side===undefined||p.side===-1||p.side===1)&&
  (p.lineRot===undefined||Number.isInteger(p.lineRot)&&p.lineRot>=0&&p.lineRot<=3)&&
  (p.manualType===undefined||['inspection','test'].includes(p.manualType))&&
  (p.kind===undefined||typeof p.kind==='string');
 for(const p of data.demoMachines||[]){
  if(!machine(p)||data.blank||!M[p.demoId]||removedMachines.has(p.demoId)||edited.has(p.demoId)||machines.has(p.id))invalid();
  edited.add(p.demoId);machines.add(p.id);
 }
 if(!data.blank)for(const m of MS)if(!removedMachines.has(m.id)&&!edited.has(m.id)){
  if(machines.has(m.id))invalid();machines.add(m.id);
 }
 for(const p of data.machines||[]){
  if(!machine(p)||machines.has(p.id)||![p.w,p.h,p.d].every(n=>dimensions(n,.5)))invalid();
  machines.add(p.id);
 }
 // Versões anteriores podiam salvar saídas duplicadas. Preserve o layout e
 // mantenha as primeiras ligações válidas na ordem em que foram gravadas.
 const outgoing=new Map(),incoming=new Set();
 return (data.links||[]).filter(l=>{
  if(!l||!machines.has(l.from)||!machines.has(l.to)||l.from===l.to||outgoing.has(l.from)||incoming.has(l.to))return false;
  let next=l.to;while(outgoing.has(next))next=outgoing.get(next);if(next===l.from)return false;
  outgoing.set(l.from,l.to);incoming.add(l.to);return true;
 });
}
function restoreLayout(){
 let data,links;
 try{const raw=localStorage.getItem(storageKey);if(!raw)return;data=JSON.parse(raw);links=checkSavedLayout(data)}
 catch(err){storageNotice='O layout salvo não pôde ser carregado. A demonstração foi aberta.';console.warn('Layout salvo indisponível',err);return}
 if(data.process){E.process=data.process;E.processReady=data.processReady!==false;E.processName=data.processName;applyProcess()}
 if(data.blank)clearDemo();
 else if(data.demoOffset)translateDemo(data.demoOffset.x,data.demoOffset.z);
 E.removedAreas=data.removedAreas||[];E.removedMachines=data.removedMachines||[];
 for(const id of E.removedMachines)if(M[id])removeMachine(M[id]);
 for(const p of data.areas){
  const a=A[p.id]||createArea(p.n,p.hue,'#5689a5',p,p.id);
  Object.assign(a,{n:p.n,x:p.x,z:p.z,w:p.w,d:p.d,hue:p.hue});applyArea(a);a.lb.textContent=a.n;
 }
 const demoEdits=(data.demoMachines||[]).map(p=>[M[p.demoId],p]);
 for(const [m] of demoEdits)delete M[m.id];
 for(const [m,p] of demoEdits){
  const old=A[m.a],a=A[p.a];
  const side=m.side,type=manualStationType(m);
  if(old!==a){old.ms.splice(old.ms.indexOf(m),1);a.ms.push(m)}
  Object.assign(m,machineState({...m,...p}));m.rot=p.rot||0;M[m.id]=m;m.lb.textContent=m.id;
  if(isStation(m)&&(side!==m.side||type!==manualStationType(m)))rebuildWorkcell(m);else syncStationOperator(m);
  m.mesh.position.set(a.x+m.dx,.12,a.z+m.dz);m.mesh.rotation.y=m.rot*Math.PI/2;
 }
 for(const id of E.removedAreas)if(A[id]&&!A[id].ms.length)removeArea(A[id]);
 for(const p of data.machines||[]){const a=A[p.a];newMachine(a,{c:['CUSTOM',p.n,p.w,p.h,p.d],id:p.id,name:p.n,rot:p.rot||0,kind:p.kind||'CUSTOM',station:!!p.station,side:p.side,manualType:p.manualType,lineRot:p.lineRot},a.x+p.dx,a.z+p.dz)}
 E.flowDir=links.length?(data.flowDir||1):0;for(const l of links)buildLink(l.from,l.to,false);
 if(E.links.some(l=>l.blocked))storageNotice='Algumas esteiras de postos manuais precisam de mais espaço. Reposicione os postos para liberar o corredor.';
 if(links.length!==(data.links||[]).length)storageNotice='Algumas esteiras inválidas do layout salvo não foram carregadas.';
 theme();refreshAreas();updateDashboard();
}
function clearDemo(){
 cancelMachineRotation();
 if(installPending)closeInstallDialog();
 E.blank=true;E.from=null;E.flowDir=0;E.machineSelected=null;E.linkSelected=null;E.removedAreas=[];E.removedMachines=[];
 for(const l of E.links)destroyLink(l);E.links.length=0;
 // Remove fisicamente os objetos da demonstração, as referências de raycast e os rótulos.
 for(const m of [...MS])removeMachine(m);
 for(const a of [...AL])removeArea(a);
 for(const b of boards){sc.remove(b);b.geometry.dispose()}boards.length=0;
 for(const belt of demoBelts){sc.remove(belt);belt.geometry.dispose()}demoBelts.length=0;beltM.dispose();bmat.dispose();
 demoOffset.x=demoOffset.z=0;areaSeq=0;E.drag=null;E.placing=null;stopCatalogueDrag();
 so.visible=sp.visible=false;tip.style.display='none';select(null);refreshAreas();updateDashboard();
}
function updateDashboard(){const active=MS.filter(m=>m.mesh&&m.mesh.visible),bad=active.filter(m=>m.s!=='run');$('#kpis').innerHTML=[['Equipamentos',active.length],['Áreas de manufatura',AL.length],['Máquinas ativas',active.filter(m=>m.s==='run').length],['Esteiras',E.links.length],['Alertas',bad.length]].map(([k,v])=>`<div class="kpi"><span>${k}</span><b>${v}</b></div>`).join('')}
function freshProject(){if(!confirm('Criar novo processo? Todos os equipamentos, áreas, esteiras e dados da demonstração serão removidos.'))return;
 clearDemo();E.selected=null;E.machineSelected=null;E.linkSelected=null;E.process={x:0,z:0,w:48,d:36};E.processReady=false;E.editorHome=false;E.processName='Nova linha de produção';applyProcess();E.mode='process';E.newAreaForm=false;goal.t.set(0,0,0);goal.d=58;drawEditor();saveLayout();}
/* quatro alças arrastáveis; arrasto em plano horizontal, sem afetar câmera */
const handleEls=[];for(let i=0;i<4;i++){const h=document.createElement('div');h.className='edhandle';h.dataset.corner=i;h.onpointerdown=e=>{if(!E.on||E.drag||e.button!==0||!(E.mode==='process'||(E.mode==='areas'&&E.selected&&A[E.selected])))return;e.stopPropagation();e.preventDefault();E.drag={kind:'resize',pid:e.pointerId,corner:i,a:E.mode==='process'?E.process:A[E.selected],process:E.mode==='process',initial:boxOf(E.mode==='process'?E.process:A[E.selected])};h.setPointerCapture(e.pointerId)};h.onpointermove=e=>{if(!E.drag||E.drag.kind!=='resize'||!h.hasPointerCapture(e.pointerId))return;resizeFromEvent(e)};h.onpointerup=e=>{if(E.drag?.kind==='resize'&&E.drag.pid===e.pointerId){saveLayout();E.drag=null;drawEditor()}};h.onpointercancel=h.onlostpointercapture=h.onpointerup;EH.appendChild(h);handleEls.push(h)}
function worldAt(e,height=0){const r=cv.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(nd,cam3);const v=new THREE.Vector3();return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-height),v)?v:null}
function resizeFromEvent(e){
 const drag=E.drag,a=drag.a,p=worldAt(e);if(!p)return;
 const i=drag.corner,b={...drag.initial},minimum=drag.process?14:8;
 // Sempre partir do canto oposto original. Uma tentativa inválida não altera o
 // ponto de referência: voltar a aumentar funciona no mesmo gesto.
 if(i===0||i===2)b.x0=Math.min(snap(p.x),b.x1-minimum);
 else b.x1=Math.max(snap(p.x),b.x0+minimum);
 if(i===0||i===1)b.z0=Math.min(snap(p.z),b.z1-minimum);
 else b.z1=Math.max(snap(p.z),b.z0+minimum);
 if(!drag.process){
  // Calcular a envoltória mínima dos equipamentos com folga de segurança.
  // Bloquear somente a borda que encolhe; a borda continua livre para crescer.
  let limitX0=Infinity,limitX1=-Infinity,limitZ0=Infinity,limitZ1=-Infinity;
  for(const m of a.ms){
   if(!m.mesh||!m.mesh.visible)continue;
   const rect=boxOf(machineAreaRect(m,a.x+m.dx,a.z+m.dz)),margin=isStation(m)?0:CLEARANCE;
   limitX0=Math.min(limitX0,rect.x0-margin);
   limitX1=Math.max(limitX1,rect.x1+margin);
   limitZ0=Math.min(limitZ0,rect.z0-margin);
   limitZ1=Math.max(limitZ1,rect.z1+margin);
  }
  if(limitX0!==Infinity){
   if(i===0||i===2)b.x0=Math.min(b.x0,limitX0);
   else b.x1=Math.max(b.x1,limitX1);
   if(i===0||i===1)b.z0=Math.min(b.z0,limitZ0);
   else b.z1=Math.max(b.z1,limitZ1);
  }
 }
 const rect={x:(b.x0+b.x1)/2,z:(b.z0+b.z1)/2,w:b.x1-b.x0,d:b.z1-b.z0};
 const err=drag.process?validateProcess(rect):validateArea(a,rect);
 if(err){status(err,true);return}
 const changed=Math.abs(a.x-rect.x)>1e-6||Math.abs(a.z-rect.z)>1e-6||Math.abs(a.w-rect.w)>1e-6||Math.abs(a.d-rect.d)>1e-6;
 if(changed){
  if(drag.process){Object.assign(a,rect);applyProcess();}
  else applyResizedArea(a,rect);
 }
 status('Dimensões: '+Number(a.w.toFixed(2))+' × '+Number(a.d.toFixed(2))+' unidades.');
}
const helperGrid=new THREE.GridHelper(800,800,0x4dd2a0,0x406757);helperGrid.position.y=-.015;helperGrid.visible=false;sc.add(helperGrid);
const ghost=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x32bc86,transparent:true,opacity:.18,depthWrite:false}));ghost.visible=false;sc.add(ghost);
let ghostModel=null,ghostKey='',manualGhost=null;
const manualLaneGuide=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
 new THREE.Vector3(-.5,0,-.5),new THREE.Vector3(.5,0,-.5),new THREE.Vector3(.5,0,.5),new THREE.Vector3(-.5,0,.5)
]),new THREE.LineBasicMaterial({color:0x61b3ff,transparent:true,opacity:.65,depthWrite:false}));
manualLaneGuide.visible=false;sc.add(manualLaneGuide);
/* Guias reutilizadas, sem raycasting ou alteração do snap de uma unidade. */
const alignmentMaterial=new THREE.LineBasicMaterial({color:0x61b3ff,transparent:true,opacity:.85,depthWrite:false});
const alignmentGuides=['x','z'].map(axis=>{
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
 const line=new THREE.Line(geometry,alignmentMaterial);line.visible=false;line.userData.axis=axis;sc.add(line);return line;
});
let alignmentSubject=null,flowPointer=null;
const flowPreview={key:'',ribbon:null,points:null,curve:null,target:null,valid:false};
const flowPreviewMaterial=new THREE.MeshBasicMaterial({color:0x61b3ff,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false});
const flowPreviewMarker=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
 new THREE.Vector3(-.3,0,-.3),new THREE.Vector3(.3,0,-.3),new THREE.Vector3(.3,0,.3),new THREE.Vector3(-.3,0,.3)
]),new THREE.LineBasicMaterial({color:0x61b3ff,transparent:true,opacity:.9,depthWrite:false}));
flowPreviewMarker.visible=false;sc.add(flowPreviewMarker);
function clearAlignmentLines(){alignmentSubject=null;for(const line of alignmentGuides)line.visible=false}
function clearFlowPreview(){
 if(flowPreview.ribbon){sc.remove(flowPreview.ribbon);flowPreview.ribbon.geometry.dispose()}
 Object.assign(flowPreview,{key:'',ribbon:null,points:null,curve:null,target:null,valid:false});flowPreviewMarker.visible=false;
}
function clearAlignment(){clearAlignmentLines();clearFlowPreview();flowPointer=null}
function drawAlignment(a,b,ideal=false){
 clearAlignmentLines();alignmentMaterial.color.set(ideal?0x35bd80:0x61b3ff);
 for(const line of alignmentGuides){
  const axis=line.userData.axis,other=axis==='x'?'z':'x';if(Math.abs(a[axis]-b[axis])>1e-5)continue;
  const values=line.geometry.attributes.position;
  const lo=Math.min(a[other],b[other])-1.5,hi=Math.max(a[other],b[other])+1.5;
  if(axis==='x'){values.setXYZ(0,a.x,.18,lo);values.setXYZ(1,a.x,.18,hi)}
  else{values.setXYZ(0,lo,.18,a.z);values.setXYZ(1,hi,.18,a.z)}
  values.needsUpdate=true;line.geometry.computeBoundingSphere();line.visible=true;
 }
}
function straightConnection(from,to){
 if(pairedStations(from,to))return true;
 const a=portsFor(from),b=portsFor(to),v=a.out.clone().sub(a.in).normalize(),w=b.out.clone().sub(b.in).normalize(),delta=b.in.clone().sub(a.out);
 return v.dot(w)>.999&&Math.abs(v.x*delta.z-v.z*delta.x)<1e-5&&delta.dot(v)>=-1e-5;
}
function showMachineAlignment(m,x,z,valid){
 clearFlowPreview();flowPointer=null;
 const candidate={...m,pos:new THREE.Vector3(x,.12,z)},options=[];
 for(const other of MS){
  if(other.id===m.id||!other.mesh?.visible||other.a!==m.a)continue;
  const distance=Math.hypot(x-other.pos.x,z-other.pos.z);if(distance>28)continue;
  const linked=E.links.some(l=>l.from===m.id&&l.to===other.id||l.to===m.id&&l.from===other.id);
  const matches=[{a:candidate.pos,b:other.pos,ideal:false}];
  for(const [from,to] of [[other,candidate],[candidate,other]]){
   matches.push({a:portsFor(from).out,b:portsFor(to).in,ideal:valid&&straightConnection(from,to)});
  }
  for(const match of matches)if(Math.abs(match.a.x-match.b.x)<1e-5||Math.abs(match.a.z-match.b.z)<1e-5)
   options.push({...match,distance,linked});
 }
 options.sort((a,b)=>Number(b.linked)-Number(a.linked)||a.distance-b.distance||Number(b.ideal)-Number(a.ideal));
 const best=options[0];if(best)drawAlignment(best.a,best.b,best.ideal);else clearAlignmentLines();
 alignmentSubject={id:m.id,x,z,valid};
}
function requestFlowPreview(e,target){
 if(!E.on||E.editorHome||E.mode!=='flow'||!M[E.from]||E.drag||E.placing||installPending)return;
 const p=worldAt(e,.136);if(!p)return clearAlignment();
 flowPointer={point:{x:snap(p.x),z:snap(p.z)},target:target||hit(e)?.m?.id||null};
 refreshFlowPreview();
}
function looseFlowPoints(from,point){
 const p=portsFor(from),end=new THREE.Vector3(point.x,1.25,point.z),v=p.out.clone().sub(p.in).normalize();
 const start=isStation(from)?p.in:p.outInner,points=[start,p.out];
 if(Math.abs(p.out.x-end.x)>1e-5&&Math.abs(p.out.z-end.z)>1e-5){
  const stub=p.out.clone().addScaledVector(v,1.2);
  points.push(stub,Math.abs(v.x)>.5?new THREE.Vector3(end.x,1.25,stub.z):new THREE.Vector3(stub.x,1.25,end.z));
 }
 points.push(end);return points.filter((p,i,list)=>!i||p.distanceToSquared(list[i-1])>1e-8).map(p=>p.clone());
}
function refreshFlowPreview(){
 const from=M[E.from],to=M[flowPointer?.target];if(!from||!flowPointer)return;
 const stamp=m=>m?[m.id,m.pos.x,m.pos.z,m.rot,m.side,m.lineRot].join(','):'';
 const key=[stamp(from),stamp(to),flowPointer.point.x,flowPointer.point.z,E.flowDir,E.links.map(l=>l.from+'>'+l.to).join(',')].join('|');
 if(flowPreview.key===key)return;
 clearFlowPreview();clearAlignmentLines();flowPreview.key=key;
 const target=to&&to!==from?to:null,error=target?connectionError(from.id,target.id):'';
 const points=target?pathFor(from,target,[...E.links,{from:from.id,to:target.id}]):looseFlowPoints(from,flowPointer.point);
 if(!points||points.length<2)return;
 const ideal=!!target&&!error&&straightConnection(from,target),color=error?0xd95655:ideal?0x35bd80:0x61b3ff;
 const curve=roundedPath(points,isStation(from)||target&&isStation(target)? .45:1.15);
 if(curve.getLength()<.01)return;
 Object.assign(flowPreview,{points,curve,target:target?.id||null,valid:!error});
 flowPreviewMaterial.color.set(color);flowPreview.ribbon=conveyorRibbon(curve,curve.getLength(),null,flowPreviewMaterial);
 flowPreview.ribbon.userData={preview:true};sc.add(flowPreview.ribbon);
 const a=portsFor(from).out,b=target?portsFor(target).in:flowPointer.point;
 drawAlignment(a,b,ideal);flowPreviewMarker.position.set(b.x,.18,b.z);flowPreviewMarker.material.color.set(color);flowPreviewMarker.visible=true;
}
function alignmentFrame(){
 if(!E.on||E.editorHome||installPending){clearAlignment();return}
 if(E.mode==='flow'&&!E.drag&&!E.placing){if(flowPointer&&M[E.from])refreshFlowPreview();else clearAlignment();return}
 if(flowPreview.ribbon)clearFlowPreview();flowPointer=null;
 if(!E.placing&&!activeCatalogueDrag&&E.drag?.kind!=='machine-move')clearAlignmentLines();
}
cv.addEventListener('pointerleave',clearAlignment);
editorDrawer.addEventListener('pointerenter',clearAlignment);
window.addEventListener('blur',clearAlignment);
stage.addEventListener('dragleave',e=>{if(!stage.contains(e.relatedTarget))clearAlignment()});
function updateManualLaneGuide(){
 const selected=M[E.machineSelected],m=E.placing||activeCatalogueDrag?manualGhost:isStation(selected||{})?selected:null;
 if(!E.on||E.editorHome||!m||installPending){manualLaneGuide.visible=false;return}
 const rotating=E.drag?.kind==='machine-rotate'&&E.drag.m===m;
 const rot=rotating?normalizeRotation(Math.round(E.drag.angle/quarterTurn)):m.rot||0;
 const lane=stationLane(m,m.pos.x,m.pos.z,rot);
 manualLaneGuide.position.set(lane.x,.16,lane.z);manualLaneGuide.scale.set(lane.w,1,lane.d);
 manualLaneGuide.material.color.set(E.drag?.error||m.valid===false?0xd95655:0x61b3ff);manualLaneGuide.visible=true;
}
function clearGhostModel(){manualGhost=null;if(ghostModel){sc.remove(ghostModel);disposeModel(ghostModel);ghostModel=null;ghostKey=''}}
function ensureGhostModel(c,station,rot,valid,side=1){
 const key=(station?'S:':'M:')+c[0]+':'+(rot||0)+':'+(valid?1:0)+':'+side;if(ghostKey===key)return;
 clearGhostModel();ghostKey=key;ghostModel=previewModel(c,station,side);ghostModel.rotation.y=(rot||0)*Math.PI/2;
 const materials=new Set();ghostModel.traverse(o=>{if(o.material)materials.add(o.material)});const tint=new THREE.Color(valid?0xcffff0:0xffb1b1);
 for(const material of materials){material.transparent=true;material.opacity=.52;material.depthWrite=false;material.color.multiply(tint)}
 sc.add(ghostModel);
}
function sizeGhost(w,h,d){
 const p=ghost.geometry.parameters;if(p.width===w&&p.height===h&&p.depth===d)return;
 ghost.geometry.dispose();ghost.geometry=new THREE.BoxGeometry(w,h,d);
}
function placeGhost(c,station,x,z,rot,valid,side=1){const size=footprint({w:c[2],d:c[4],rot});sizeGhost(size.w,c[3],size.d);ghost.position.set(x,c[3]/2+.12,z);ghost.material.color.set(valid?'#32bc86':'#d95655');ghost.visible=true;ensureGhostModel(c,station,rot,valid,side);ghostModel.position.set(x,.12,z);manualGhost=station?{w:c[2],d:c[4],rot:rot||0,station:true,side,pos:{x,z},valid}:null;}
function editorFrame(){alignmentFrame();updateRotationHandle();updateManualLaneGuide();if(!E.on||E.editorHome){helperGrid.visible=false;ghost.visible=false;clearGhostModel();AL.forEach(a=>{if(a.grid)a.grid.visible=false});handleEls.forEach(h=>h.style.display='none');refreshPorts();return}
 helperGrid.visible=false;const a=E.mode==='process'?E.process:A[E.selected];const showAreaGrid=(E.mode==='machines'||E.mode==='stations'||E.mode==='flow'&&!!E.from||!!E.placing||!!activeCatalogueDrag);AL.forEach(ar=>{if(ar.grid)ar.grid.visible=showAreaGrid&&ar.floor&&ar.floor.visible});handleEls.forEach((h,i)=>{if(!a||(E.mode!=='areas'&&E.mode!=='process')){h.style.display='none';return}const b=boxOf(a),x=i===0||i===2?b.x0:b.x1,z=i<=1?b.z0:b.z1;V.set(x,.4,z).project(cam3);h.style.display=inView(V)?'':'none';h.style.left=(V.x*.5+.5)*W+'px';h.style.top=(-V.y*.5+.5)*H+'px'});
 if(!E.placing&&!activeCatalogueDrag){ghost.visible=false;clearGhostModel();}refreshPorts();}
function selectEditorObject(e,u=hit(e)){
 // Esteiras têm prioridade sobre o piso, mas não sobre o equipamento sob o cursor.
 const conveyor=u?.m?null:hitConveyor(e);
 const mode=u?.m?(isStation(u.m)?'stations':'machines'):conveyor?'flow':u?.a?'areas':null;
 if(mode){const reason=editorToolBlock(mode);if(reason){status(reason,true);return true}E.editorHome=false;setEditorCollapsed(false)}
 if(u&&u.m&&u.m.mesh&&u.m.mesh.visible){
  E.machineSelected=u.m.id;E.selected=u.m.a;E.linkSelected=null;E.from=null;
  tip.style.display='none';
  E.mode=isStation(u.m)?'stations':'machines';drawEditor();revealMachineEditor();return true;
 }
 if(conveyor){E.linkSelected=conveyor;E.machineSelected=null;E.selected=null;E.mode='flow';drawEditor();revealMachineEditor();return true;}
 if(u&&u.a&&u.a.floor&&u.a.floor.visible){
  E.selected=u.a.id;E.machineSelected=null;E.linkSelected=null;E.mode='areas';drawEditor();revealMachineEditor();return true;
 }
 if(E.machineSelected){E.machineSelected=null;drawEditor();return true;}
 return false;
}
function editorPointerDown(e){if(!E.on||E.editorHome||e.button!==0)return false;
 if(E.drag?.kind==='machine-rotate')return true;
 if(!E.placing)clearAlignment();
 if(E.placing){const p=worldAt(e,.136);if(!p)return true;const x=snap(p.x),z=snap(p.z),a=AL.filter(a=>a.floor.visible).find(a=>inside(a,{x,z,w:0,d:0}));if(!a)return status('Selecione uma célula dentro de uma área de manufatura.',true),true;
 const moving=E.placing.moving&&M[E.placing.moving],cfg=E.placing.c;
 const proto=moving||{w:cfg[2],d:cfg[4],rot:E.placing.rot,station:E.placing.station,kind:cfg[0],side:E.placing.station?1:undefined};const placement=moving?null:manualPlacement(cfg,E.placing.station,E.placing.rot,a,x,z);const err=moving?validateMachine(proto,a,x,z):placement.error;if(err)return status(err,true),true;
 let id;if(moving){const oldArea=A[moving.a];oldArea.ms.splice(oldArea.ms.indexOf(moving),1);a.ms.push(moving);moving.a=a.id;moving.dx=x-a.x;moving.dz=z-a.z;moving.mesh.position.set(x,.12,z);themeMachine(moving);id=moving.id;updateLinks(l=>manualAffectedLink(l,id))}else{const installation={c:cfg,station:!!E.placing.station,side:placement.side,rot:E.placing.rot||0,x,z,a:a.id};E.placing=null;ghost.visible=false;openInstallDialog(installation);return true}
 E.machineSelected=id;E.placing=null;ghost.visible=false;refreshAreas();updateDashboard();drawEditor();status(id+' posicionado em '+a.n+'.');saveLayout();return true;}
 const u=hit(e);
 // Uma máquina/estação já selecionada é arrastável; um clique simples apenas seleciona.
 if(!e.ctrlKey&&u&&u.m&&E.machineSelected===u.m.id&&
    (E.mode==='machines'||E.mode==='stations')&&u.m.mesh&&u.m.mesh.visible){
  const p=worldAt(e,.136);if(p){const m=u.m;E.drag={kind:'machine-move',m,offsetX:m.pos.x-p.x,offsetZ:m.pos.z-p.z,pid:e.pointerId,changed:false,clickAt:[e.clientX,e.clientY]};
   cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';tip.style.display='none';return true;}
 }
 // Áreas só são arrastadas quando já estão selecionadas, evitando deslocamentos acidentais.
 if(!e.ctrlKey&&u&&u.a&&E.mode==='areas'&&E.selected===u.a.id&&u.a.floor.visible){
  const p=worldAt(e);if(p){const a=u.a;E.drag={kind:'move',a,offsetX:a.x-p.x,offsetZ:a.z-p.z,pid:e.pointerId,changed:false};
   cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';tip.style.display='none';return true;}
 }
 if(E.mode==='process'){
  // Clique esquerdo no piso inicia a movimentação do processo, sem girar a câmera.
  // Ctrl continua reservado para deslocar a câmera pelo grid.
  if(!e.ctrlKey){
   // Detecta a área pelo plano do grid, não pelo raycast no mesh 3D.
   // Assim o arrasto funciona mesmo com overlays e com outras áreas sobre o piso.
   const p=worldAt(e);
   if(p&&inside(E.process,{x:p.x,z:p.z,w:0,d:0})){
    E.drag={kind:'process-move',offsetX:E.process.x-p.x,offsetZ:E.process.z-p.z,pid:e.pointerId,clickAt:u?.m?[e.clientX,e.clientY]:null};
    cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';tip.style.display='none';return true;
   }
  }
  return false;
 }
 return false}
const isMachineClick=(drag,e)=>drag.clickAt&&Math.hypot(e.clientX-drag.clickAt[0],e.clientY-drag.clickAt[1])<5;
function editorPointerMove(e){if(!E.on||E.editorHome||E.drag&&E.drag.pid!==e.pointerId)return false;
 if(E.drag?.clickAt){if(isMachineClick(E.drag,e))return true;E.drag.clickAt=null}
 if(E.drag&&E.drag.kind==='machine-move'){
  const p=worldAt(e,.136);if(p){const m=E.drag.m,ar=A[m.a];
   const x=snap(p.x+E.drag.offsetX),z=snap(p.z+E.drag.offsetZ);
   const err=validateMachine(m,ar,x,z);showMachineAlignment(m,x,z,!err);
   if(!err&&(m.pos.x!==x||m.pos.z!==z)){
    m.dx=x-ar.x;m.dz=z-ar.z;m.mesh.position.set(x,.12,z);E.drag.changed=true;
    updateLinks(l=>manualAffectedLink(l,m.id));
   }else if(err)status(err,true);
  }return true;
 }

 if(E.drag&&E.drag.kind==='process-move'){
  const p=worldAt(e);
  if(p){
   const x=p.x+E.drag.offsetX,z=p.z+E.drag.offsetZ;
   const err=validateProcessMove(x,z);
   if(!err)moveProcessTo(x,z);else status(err,true);
  }
  return true;
 }
 if(E.mode==='flow'&&!E.drag&&!E.placing)requestFlowPreview(e);
 if(E.mode==='process'&&!E.drag&&!E.placing){
  const p=worldAt(e);
  cv.style.cursor=p&&inside(E.process,{x:p.x,z:p.z,w:0,d:0})?'move':'grab';
 }
 if(E.drag&&E.drag.kind==='move'){const p=worldAt(e);if(p){const a=E.drag.a,rect={x:snap(p.x+E.drag.offsetX),z:snap(p.z+E.drag.offsetZ),w:a.w,d:a.d};const err=validateArea(a,rect);if(!err){if(a.x!==rect.x||a.z!==rect.z){a.x=rect.x;a.z=rect.z;applyArea(a);E.drag.changed=true}}else status(err,true)}return true}
 if(!E.placing)return false;const p=worldAt(e,.136);if(!p)return true;const m=E.placing.moving&&M[E.placing.moving],c=E.placing.c,x=snap(p.x),z=snap(p.z);const proto=m||{w:c[2],d:c[4],rot:E.placing.rot,station:E.placing.station,kind:c[0],side:E.placing.station?1:undefined},sz=footprint(proto);sizeGhost(sz.w,m?m.h:c[3],sz.d);ghost.position.set(x,(m?m.h:c[3])/2+.12,z);ghost.visible=true;
 const a=AL.filter(a=>a.floor.visible).find(a=>inside(a,{x,z,w:0,d:0}));const placement=a&&!m?manualPlacement(c,E.placing.station,E.placing.rot,a,x,z):null;const err=a?(m?validateMachine(proto,a,x,z):placement.error):'Fora da área';if(!m)placeGhost(c,E.placing.station,x,z,E.placing.rot,!err,placement?.side||1);else{clearGhostModel();ghost.material.color.set(err?'#d95655':'#32bc86')}if(a)showMachineAlignment({...proto,a:a.id,side:m?m.side:E.placing.station?placement?.side:undefined},x,z,!err);else clearAlignmentLines();return true;}
function editorPointerUp(e){
 const d=E.drag;if(!d||d.pid!==e.pointerId||d.kind==='resize')return false;
 E.drag=null;clearAlignment();cv.style.cursor='grab';
 const picked=e.type==='pointerup'&&isMachineClick(d,e)&&hit(e);
 if(picked?.m)return selectEditorObject(e,picked);
 if(d.kind==='process-move'||d.changed)saveLayout();
 if(d.changed)drawEditor();
 return true;
}
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&E.drag?.kind==='machine-rotate'){cancelMachineRotation();e.preventDefault();return}
 if(e.key==='Escape'&&installPending){closeInstallDialog();return}
 if(installPending)return;
 if(e.key==='Escape'&&E.placing){clearAlignment();E.placing=null;ghost.visible=false;clearGhostModel();drawEditor();return}
 if((e.key==='Delete'||e.key==='Del')&&E.on&&!e.repeat){
  const target=e.target;
  if(target&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
  e.preventDefault();deleteSelected();
 }
});
function removeMachine(m){
 if(E.drag?.kind==='machine-rotate'&&E.drag.m===m)cancelMachineRotation();
 if(machineOutline.parent===m.mesh){clearMachineOutline();rotationHandle.style.display='none'}
 // Retirar as conexões primeiro evita referências a portas de uma máquina inexistente.
 for(const l of [...E.links])if(l.from===m.id||l.to===m.id){destroyLink(l);E.links.splice(E.links.indexOf(l),1);if(E.linkSelected===l)E.linkSelected=null}
 if(!E.links.length)E.flowDir=0;
 const a=A[m.a];if(a){const i=a.ms.indexOf(m);if(i>=0)a.ms.splice(i,1)}
 const i=MS.indexOf(m);if(i>=0)MS.splice(i,1);
 if(m.mesh){sc.remove(m.mesh);m.mesh.traverse(o=>{const idx=pick.indexOf(o);if(idx>=0)pick.splice(idx,1)});disposeModel(m.mesh,[glass,pole,shirt,skin])}
 if(m.lb)m.lb.remove();delete M[m.id];if(E.machineSelected===m.id)E.machineSelected=null;
 if(E.from===m.id)E.from=null;
 if(E.links.length)refreshManualLinks();
}
function removeArea(a){
 const idx=AL.indexOf(a);if(idx>=0)AL.splice(idx,1);
 if(a.floor){const pi=pick.indexOf(a.floor);if(pi>=0)pick.splice(pi,1);sc.remove(a.floor);a.floor.geometry.dispose();a.floor.material.dispose()}
 if(a.edge){sc.remove(a.edge);a.edge.geometry.dispose();a.edge.material.dispose()}
 if(a.grid){sc.remove(a.grid);a.grid.geometry.dispose();a.grid.material.dispose()}
 if(a.lb)a.lb.remove();delete A[a.id];E.selected=null;
 so.visible=sp.visible=false;
}
function deleteSelected(){
 if(!E.on||installPending)return;
 if(E.drag||E.placing||activeCatalogueDrag)return status('Conclua ou cancele a operação atual antes de excluir.',true);
 if(E.mode==='areas'){
  const a=A[E.selected];if(!a)return status('Selecione uma área antes de pressionar Delete.',true);
  const occupied=a.ms.filter(m=>m.mesh&&m.mesh.visible);
  if(occupied.length)return status('Não é possível excluir "'+a.n+'": remova primeiro os '+occupied.length+' equipamento(s) que estão dentro dela.',true);
  if(!confirm('Excluir a área "'+a.n+'"? Esta operação não poderá ser desfeita.'))return;
  const name=a.n;if(!a.id.startsWith('custom-'))E.removedAreas.push(a.id);removeArea(a);refreshAreas();updateDashboard();select(null);saveLayout();drawEditor();status('Área "'+name+'" excluída.');return;
 }
 if(E.mode==='machines'||E.mode==='stations'){
  const m=M[E.machineSelected];if(!m)return status('Selecione um equipamento no mapa ou na lista antes de pressionar Delete.',true);
  const linked=E.links.filter(l=>l.from===m.id||l.to===m.id).length;
  if(!confirm('Excluir o equipamento "'+m.id+'"'+(linked?' e suas '+linked+' esteira(s) conectada(s)':'')+'?'))return;
  const id=m.id;if(!m.custom)E.removedMachines.push(m.demoId);removeMachine(m);refreshAreas();updateDashboard();select(null);saveLayout();drawEditor();status('Equipamento '+id+' excluído.');return;
 }
 if(E.mode==='flow'){
  const l=E.linkSelected;if(!l||!E.links.includes(l))return status('Selecione uma esteira no mapa ou na lista antes de pressionar Delete.',true);
  if(!confirm('Excluir a esteira '+l.from+' → '+l.to+'?'))return;
  const title=l.from+' → '+l.to;destroyLink(l);E.links.splice(E.links.indexOf(l),1);E.linkSelected=null;E.from=null;
  if(!E.links.length)E.flowDir=0;refreshManualLinks();updateDashboard();saveLayout();drawEditor();status('Esteira '+title+' excluída.');
 }
}
function hitConveyor(e){const r=cv.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(nd,cam3);
 const parts=[];for(const l of E.links)for(const obj of l.group.children)if(obj.userData.isConveyorSegment)parts.push(obj);
 const found=ray.intersectObjects(parts,false)[0];return found?found.object.userData.link:null;
}


/* Editor de conexões: portas de entrada/saída e esteiras 3D */
const flowRoot=$('#flowPorts'),flowPortEls=new Map();
flowRoot.addEventListener('pointerleave',clearAlignment);
flowRoot.addEventListener('pointermove',e=>{const port=e.target.closest('.flow-port');if(port)requestFlowPreview(e,port.dataset.side==='in'?port.dataset.machine:null)});
function manualAffectedLink(l,id){return l.from===id||l.to===id||isStation(M[l.from])||isStation(M[l.to])}
function pairedStations(a,b){
 if(!isStation(a)||!isStation(b))return false;
 const x=stationLane(a),y=stationLane(b),ra=(a.rot||0)*Math.PI/2,rb=(b.rot||0)*Math.PI/2;
 return Math.hypot(x.x-y.x,x.z-y.z)<.15&&x.tx*y.tx+x.tz*y.tz>.99&&
  Math.cos(ra-rb)*manualSide(a)*manualSide(b)<-.99;
}
function curveHitsRect(curve,rect,padding=.6){
 if(!curve)return false;
 const bounds=boxOf(rect),steps=Math.max(12,Math.ceil(curve.getLength()*5));
 for(let i=0;i<=steps;i++){
  const p=curve.getPoint(i/steps);
  if(p.x>bounds.x0-padding+1e-6&&p.x<bounds.x1+padding-1e-6&&p.z>bounds.z0-padding+1e-6&&p.z<bounds.z1+padding-1e-6)return true;
 }
 return false;
}
function manualPathFor(from,to,links=E.links,machines=MS){
 const pa=portsFor(from),pb=portsFor(to);
 if(pairedStations(from,to)){
  const lane=stationLane(from),half=(Math.max(lane.half,stationLane(to).half)+.2)*(E.flowDir||1);
  return [new THREE.Vector3(lane.x-lane.tx*half,1.25,lane.z-lane.tz*half),
   new THREE.Vector3(lane.x+lane.tx*half,1.25,lane.z+lane.tz*half)];
 }
 const sourceManual=isStation(from),targetManual=isStation(to);
 const pairIncoming=links.some(l=>l.to===from.id&&machines.some(m=>m.id===l.from&&pairedStations(m,from)));
 const targetOutgoing=links.some(l=>l.from===to.id);
 const sourceStart=sourceManual?(pairIncoming?pa.out:pa.in):pa.outInner;
 const targetEnd=targetManual?(targetOutgoing?pb.in:pb.out):pb.inInner;
 const out=pa.out.clone().sub(sourceManual?pa.in:pa.outInner).normalize();
 const incoming=pb.in.clone().sub(targetManual?pb.out:pb.inInner).normalize();
 const a=pa.out.clone().addScaledVector(out,1.2),b=pb.in.clone().addScaledVector(incoming,1.2);
 const obstacles=machines.filter(m=>m.pos&&(![from.id,to.id].includes(m.id)||isStation(m)))
  .map(m=>({...machineRect(m,m.pos.x,m.pos.z),beltPadding:isStation(m)?.525:.6}));
 const process=boxOf(E.process),xs=[(a.x+b.x)/2,process.x0+1,process.x1-1],
  zs=[(a.z+b.z)/2,process.z0+1,process.z1-1];
 for(const obstacle of obstacles){
  const r=boxOf(obstacle);xs.push(r.x0-1.8,r.x1+1.8);zs.push(r.z0-1.8,r.z1+1.8);
 }
 const middle=[];
 if(Math.abs(a.x-b.x)<1e-6||Math.abs(a.z-b.z)<1e-6)middle.push([]);
 for(const x of xs)middle.push([new THREE.Vector3(x,1.25,a.z),new THREE.Vector3(x,1.25,b.z)]);
 for(const z of zs)middle.push([new THREE.Vector3(a.x,1.25,z),new THREE.Vector3(b.x,1.25,z)]);
 let best=null,length=Infinity;
 for(const turns of middle){
  const points=[sourceStart,pa.out,a,...turns,b,pb.in,targetEnd]
   .filter((p,i,list)=>!i||p.distanceToSquared(list[i-1])>1e-8).map(p=>p.clone());
  if(points.some(p=>!inside(E.process,{x:p.x,z:p.z,w:1.1,d:1.1},.2)))continue;
  const curve=roundedPath(points,.45);
  if(obstacles.some(rect=>curveHitsRect(curve,rect,rect.beltPadding)))continue;
  const distance=curve.getLength();if(distance<length){length=distance;best=points}
 }
 return best;
}
function manualLinkError(candidate){
 const machines=MS.filter(m=>m.id!==candidate.id);machines.push(candidate);
 const resolve=id=>id===candidate.id?candidate:M[id];
 for(const l of E.links){
  const from=resolve(l.from),to=resolve(l.to);
  if(!from||!to)continue;
  if(isStation(from)||isStation(to)){
   if(!manualPathFor(from,to,E.links,machines))return 'Não há passagem livre para a esteira dos postos manuais. Afaste ou reoriente o posto.';
  }else if(isStation(candidate)&&curveHitsRect(l.curve,machineRect(candidate,candidate.pos.x,candidate.pos.z),.525)){
   return 'O posto manual precisa ficar ao lado da esteira existente.';
  }
 }
 if(isStation(candidate)&&!E.blank){
  const rect=machineRect(candidate,candidate.pos.x,candidate.pos.z);
  if(demoBelts.some(b=>overlap(rect,{x:b.position.x,z:b.position.z,w:b.geometry.parameters.width,d:b.geometry.parameters.depth},-1e-6)))
   return 'Posicione o posto ao lado da esteira da demonstração, mantendo o operador fora do fluxo.';
 }
 return '';
}
function portsFor(m){const x=m.pos.x,z=m.pos.z,dir=E.flowDir||1,r=(m.rot||0)*Math.PI/2,v=new THREE.Vector3(Math.cos(r)*dir,0,-Math.sin(r)*dir);
 if(isStation(m)){
  const lane=stationLane(m),half=lane.half+.2,vector=new THREE.Vector3(lane.tx*dir,0,lane.tz*dir),center=new THREE.Vector3(lane.x,1.25,lane.z);
  const input=center.clone().addScaledVector(vector,-half),output=center.clone().addScaledVector(vector,half);
  return{in:input,out:output,inInner:input.clone(),outInner:output.clone()};
 }
 const half=m.w/2,portOffset=.2,beltInset=.58;
 return{
  out:new THREE.Vector3(x+v.x*(half+portOffset),1.25,z+v.z*(half+portOffset)),
  in:new THREE.Vector3(x-v.x*(half+portOffset),1.25,z-v.z*(half+portOffset)),
  outInner:new THREE.Vector3(x+v.x*Math.max(.15,half-beltInset),1.25,z+v.z*Math.max(.15,half-beltInset)),
  inInner:new THREE.Vector3(x-v.x*Math.max(.15,half-beltInset),1.25,z-v.z*Math.max(.15,half-beltInset))
 }}
function refreshPorts(){if(!E.on||E.editorHome||E.mode!=='flow'){if(flowPortEls.size){flowRoot.replaceChildren();flowPortEls.clear()}return}
 for(const m of MS){if(!m.mesh.visible)continue;for(const side of ['out','in']){const key=m.id+':'+side;if(flowPortEls.has(key))continue;const el=document.createElement('button');el.type='button';el.className='flow-port '+(side==='out'?'output':'input');el.title=(side==='out'?'Saída: ':'Entrada: ')+m.id;el.dataset.machine=m.id;el.dataset.side=side;el.onclick=()=>selectPort(m.id,side);flowRoot.appendChild(el);flowPortEls.set(key,el)}}
 for(const [key,el] of [...flowPortEls]){
  const {machine:id,side}=el.dataset,m=M[id];if(!m||!m.mesh.visible){el.remove();flowPortEls.delete(key);continue}
  const v=portsFor(m)[side].clone().project(cam3);let ox=0,oy=0;
  if(isStation(m)){
   const cell=m.pos.clone().project(cam3),dx=(cell.x-v.x)*W,dy=-(cell.y-v.y)*H,distance=Math.hypot(dx,dy)||1;
   ox=dx/distance*18;oy=dy/distance*18;
  }
  el.style.display=inView(v)?'':'none';el.style.left=(v.x*.5+.5)*W+ox+'px';el.style.top=(-v.y*.5+.5)*H+oy+'px';
  el.classList.toggle('offset',!!(ox||oy));el.style.setProperty('--port-x',-ox+'px');el.style.setProperty('--port-y',-oy+'px');el.style.setProperty('--port-angle',Math.atan2(-oy,-ox)+'rad');
  el.classList.toggle('active',E.from===id&&side==='out');
 }
}
function connectionError(fromId,toId){
 const from=M[fromId],to=M[toId];if(!from||!to)return 'O recurso não está mais disponível.';
 if(fromId===toId)return 'A saída e a entrada devem pertencer a máquinas diferentes.';
 if(E.links.some(l=>l.from===fromId&&l.to===toId))return 'Esses equipamentos já estão conectados.';
 if(E.links.some(l=>l.from===fromId))return 'Essa máquina já tem uma esteira de saída. Remova-a para alterar o fluxo.';
 if(E.links.some(l=>l.to===toId))return 'Essa máquina já tem uma esteira de entrada.';
 const manual=isStation(from)||isStation(to),dx=to.pos.x-from.pos.x,dz=to.pos.z-from.pos.z;
 const gap=machineGap({x:from.pos.x,z:from.pos.z,...footprint(from)},{x:to.pos.x,z:to.pos.z,...footprint(to)});
 if(!manual&&gap.x<3-1e-8&&gap.z<3-1e-8)return 'As máquinas precisam de ao menos 3 unidades de espaço livre para construir a esteira.';
 if(!E.flowDir&&!manual&&dx<1)return 'O fluxo inicial é sempre da esquerda para a direita. Coloque a segunda máquina à direita da primeira.';
 if(!manual&&dx*(E.flowDir||1)<-.5&&Math.abs(dz)<Math.max(from.d,to.d)+2)return 'Fluxo contrário na mesma fileira. Use uma curva em U, posicionando o próximo equipamento na fileira de retorno.';
 let current=toId;const seen=new Set();while(current){if(current===fromId)return 'A conexão criaria um ciclo no processo.';if(seen.has(current))break;seen.add(current);current=E.links.find(l=>l.from===current)?.to}
 if(manual&&!manualPathFor(from,to,[...E.links,{from:fromId,to:toId}]))return 'Não há corredor livre entre esses postos. Afaste ou reoriente as bancadas.';
 return '';
}
function selectPort(id,side){
 const reason=editorToolBlock('flow');if(reason){status(reason,true);return}
 if(!M[id]||!['out','in'].includes(side))return status('O recurso não está mais disponível.',true);
 if(side==='out'){clearAlignment();E.from=id;drawEditor();status('Saída de '+id+' selecionada. Clique na entrada verde de outra máquina.');return}
 if(!E.from)return status('Primeiro selecione a saída vermelha de uma máquina.',true);
 const error=connectionError(E.from,id);if(error)return status(error,true);
 if(!E.flowDir)E.flowDir=1;
 buildLink(E.from,id,true);const label=E.from+' → '+id;E.from=null;clearAlignment();drawEditor();status('Esteira '+label+' construída.');saveLayout();updateDashboard();
}
function pathFor(from,to,links=E.links){if(isStation(from)||isStation(to))return manualPathFor(from,to,links);
 const pa=portsFor(from),pb=portsFor(to),a=pa.out,b=pb.in;let pts=[pa.outInner.clone(),a.clone()],dir=E.flowDir||1;
 const backwards=(b.x-a.x)*dir<0;
 if(backwards){const edge=dir>0?Math.max(a.x,b.x)+Math.max(from.w,to.w)+3:Math.min(a.x,b.x)-Math.max(from.w,to.w)-3;
  pts.push(new THREE.Vector3(edge,1.25,a.z),new THREE.Vector3(edge,1.25,b.z));}
 else if(Math.abs(a.z-b.z)>1e-5){const middle=(a.x+b.x)/2;pts.push(new THREE.Vector3(middle,1.25,a.z),new THREE.Vector3(middle,1.25,b.z))}
 pts.push(b.clone(),pb.inInner.clone());
 // A aproximação deve ocorrer pelo lado externo da porta, inclusive após rotação.
 const outDir=a.clone().sub(pa.outInner).normalize(),inDir=b.clone().sub(pb.inInner).normalize();
 const next=pts[2],prev=pts[pts.length-3];
 if(next.clone().sub(a).dot(outDir)<-.01){
  const stub=a.clone().addScaledVector(outDir,1.2);
  const turn=Math.abs(outDir.x)>.5?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);
  const side=next.clone().sub(a).dot(turn)<0?-1:1;
  const bypass=stub.clone().addScaledVector(turn,side*(from.d/2+1));
  const elbow=next.clone().addScaledVector(turn,bypass.clone().sub(next).dot(turn));
  pts.splice(2,0,stub,bypass,elbow);
 }
 if(prev.clone().sub(b).dot(inDir)<-.01){
  const stub=b.clone().addScaledVector(inDir,1.2);
  const turn=Math.abs(inDir.x)>.5?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);
  const side=prev.clone().sub(b).dot(turn)<0?-1:1;
  const bypass=stub.clone().addScaledVector(turn,side*(to.d/2+1));
  const elbow=prev.clone().addScaledVector(turn,bypass.clone().sub(prev).dot(turn));
  pts.splice(pts.length-2,0,elbow,bypass,stub);
 }
 return pts.filter((p,i)=>!i||p.distanceToSquared(pts[i-1])>1e-8)}
function roundedPath(points,radius){const curve=new THREE.CurvePath();let last=points[0].clone();
 for(let i=1;i<points.length-1;i++){
  const prev=points[i-1],current=points[i],next=points[i+1],a=current.clone().sub(prev),b=next.clone().sub(current);
  const lenA=a.length(),lenB=b.length();if(lenA<.01||lenB<.01)continue;
  a.normalize();b.normalize();const cross=Math.abs(a.x*b.z-a.z*b.x);
  if(cross<.01){if(a.dot(b)<0&&last.distanceTo(current)>.001){curve.add(new THREE.LineCurve3(last,current.clone()));last=current.clone()}continue;}
  const r=Math.min(radius,lenA*.42,lenB*.42),start=current.clone().addScaledVector(a,-r),end=current.clone().addScaledVector(b,r);
  if(last.distanceTo(start)>.001)curve.add(new THREE.LineCurve3(last.clone(),start.clone()));
  curve.add(new THREE.QuadraticBezierCurve3(start.clone(),current.clone(),end.clone()));last=end;
 }
 if(last.distanceTo(points[points.length-1])>.001)curve.add(new THREE.LineCurve3(last,points[points.length-1].clone()));return curve}
function linkAt(l,t){if(!l.curve||!l.total)return{pos:new THREE.Vector3(),angle:0};
 const f=((t%l.total)+l.total)%l.total/l.total,pos=l.curve.getPoint(f),v=l.curve.getTangent(f);return{pos,angle:Math.atan2(v.z,v.x)}}
function conveyorRibbon(curve,length,link,material){const steps=Math.max(12,Math.ceil(length*5)),width=1.05,vertices=[],indices=[];
 for(let i=0;i<=steps;i++){
  const f=i/steps,p=curve.getPoint(f),t=curve.getTangent(f),nx=-t.z,nz=t.x;
  for(const [side,y] of [[-1,.53],[1,.53],[-1,.29],[1,.29]])vertices.push(p.x+nx*width*.5*side,y,p.z+nz*width*.5*side);
 }
 for(let i=0;i<steps;i++){const k=4*i,j=k+4;
  indices.push(k,j,k+1,k+1,j,j+1,k+2,k+3,j+2,k+3,j+3,j+2,k,k+2,j,k+2,j+2,j,k+1,j+1,k+3,k+3,j+1,j+3);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material||new THREE.MeshStandardMaterial({color:0x515b63,metalness:.3,roughness:.65,side:THREE.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.isConveyorSegment=true;mesh.userData.link=link;return mesh}
function destroyLink(l){disposeModel(l.group);l.group.clear();l.movers=[];l.smoke=[];sc.remove(l.group)}
function updateLinks(affected=()=>true){for(const l of E.links){if(!affected(l))continue;disposeModel(l.group);l.group.clear();constructLinkGeometry(l,false)}}
function constructLinkGeometry(l,animate){l.points=pathFor(M[l.from],M[l.to]);
 if(!l.points){l.curve=null;l.total=0;l.movers=[];l.smoke=[];l.ribbon=null;l.blocked=true;return}
 l.blocked=false;l.curve=roundedPath(l.points,(isStation(M[l.from])||isStation(M[l.to])) ? .45 : 1.15);l.total=l.curve.getLength();
 l.ribbon=conveyorRibbon(l.curve,l.total,l);l.group.add(l.ribbon);addMapConveyorProfile(l);
 l.movers=[];const n=Math.max(2,Math.floor(l.total/3.5));for(let i=0;i<n;i++){
  let obj;if(i%2===0)obj=new THREE.Mesh(new THREE.BoxGeometry(.88,.09,.72),new THREE.MeshStandardMaterial({color:0x268f54,emissive:0x052811}));
  else{const shape=new THREE.Shape();shape.moveTo(-.48,-.14);shape.lineTo(.12,-.14);shape.lineTo(.12,-.32);shape.lineTo(.53,0);shape.lineTo(.12,.32);shape.lineTo(.12,.14);shape.lineTo(-.48,.14);shape.closePath();obj=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0x39e989,side:THREE.DoubleSide}));obj.rotation.x=-Math.PI/2}
  l.group.add(obj);l.movers.push({obj,offset:i*l.total/n})}
 l.start=animate?performance.now():0;l.animated=animate;
 if(animate){l.smoke=[];for(let i=0;i<16;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.1+Math.random()*.14,7,6),new THREE.MeshBasicMaterial({color:0xc7cdd1,transparent:true,opacity:.38,depthWrite:false}));l.group.add(puff);l.smoke.push(puff)}}else l.smoke=[];
}
function refreshManualLinks(){updateLinks(l=>isStation(M[l.from])||isStation(M[l.to]))}
function buildLink(from,to,animate){const l={from,to,group:new THREE.Group(),movers:[],smoke:[]};E.links.push(l);constructLinkGeometry(l,animate);sc.add(l.group);if(isStation(M[from])||isStation(M[to]))updateLinks(other=>other!==l&&(isStation(M[other.from])||isStation(M[other.to])));return l}
function animateLinks(t){for(const l of E.links){if(!l.ribbon)continue;const elapsed=l.animated?Math.max(0,t-l.start)/1000:99,drop=Math.max(0,1-elapsed/.9)*4;
  l.ribbon.position.y=drop;if(l.profile)l.profile.position.y=drop;
  for(const item of l.movers){const v=linkAt(l,item.offset+t*.0032);item.obj.position.copy(v.pos);item.obj.position.y= .72+drop;item.obj.rotation.y=-v.angle;if(item.obj.geometry.type==='ShapeGeometry'){item.obj.rotation.set(-Math.PI/2,0,0);item.obj.rotateOnWorldAxis(new THREE.Vector3(0,1,0),-v.angle)}}
  for(let i=0;i<l.smoke.length;i++){const puff=l.smoke[i],origin=linkAt(l,l.total*(i+.5)/l.smoke.length).pos;const age=elapsed-.65-(i%4)*.08;puff.visible=age>=0&&age<1.3;if(puff.visible){puff.position.set(origin.x+(i%3-1)*.3,.65+Math.max(0,age)*1.6,origin.z+((i*7)%3-1)*.3);puff.material.opacity=.4*(1-age/1.3)}}if(elapsed>2.2&&l.smoke.length){for(const p of l.smoke){l.group.remove(p);p.geometry.dispose();p.material.dispose()}l.smoke=[];l.animated=false}}
}

const extras=document.createElement('details');extras.className='edproject';extras.innerHTML='<summary>Projeto</summary><div class="edproject-menu"><div class="edbuttons"><button id="edResetProcess">Restaurar demo</button></div><p style="margin-top:8px">Salvamento local automático neste navegador.</p></div>';
document.addEventListener('pointerdown',e=>{if(!extras.contains(e.target))extras.open=false});
const drawerObserver=new MutationObserver(()=>{if(!E.on)return;if(!ED.contains(extras))ED.querySelector('.edfooter')?.appendChild(extras)});drawerObserver.observe(ED,{childList:true});
extras.querySelector('#edResetProcess').onclick=()=>{if(confirm('Restaurar a demonstração original e limpar o layout salvo?')){try{localStorage.removeItem(storageKey);location.reload()}catch(err){storageNotice='Não foi possível limpar o layout salvo.';status('',true)}}};
restoreLayout();

select(null);
(function loop(t){updateCameraKeys(t);cam.t.lerp(goal.t,.1);cam.d+=(goal.d-cam.d)*.1;const s=Math.sin(cam.ph);
 cam3.position.set(cam.t.x+cam.d*s*Math.sin(cam.th),cam.d*Math.cos(cam.ph),cam.t.z+cam.d*s*Math.cos(cam.th));cam3.lookAt(cam.t);cam3.updateMatrixWorld();
 animateFixtures(t);boards.forEach((b,i)=>{const p=at(i*TOT/boards.length+t/1000*3);b.position.set(p[0]+demoOffset.x,.58,p[1]+demoOffset.z)});animateLinks(t);
 AL.forEach(a=>proj(a.lb,a.x,.3,a.z+a.d/2+.9,a.floor.visible));editorFrame();const tg=cam.d<58;MS.forEach(m=>proj(m.lb,m.pos.x,m.h+1.9,m.pos.z,tg&&m.mesh.visible));
 rd.render(sc,cam3);requestAnimationFrame(loop)})(0);
window.dispatchEvent(new Event('factory-map-ready'));
