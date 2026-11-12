/* Factory 3D Map: purpose-built low polygon equipment library.
   Geometry stays inside the functional footprints; routing belongs to engine.js. */
function mapModel(m,palette={}) {
 const root=new THREE.Group(),w=m.w,d=m.d,h=m.h||2.6;
 const station=isStation(m),s=manualSide(m),kind=machineKind(m),id=m.id||'';
 const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.58,metalness:.18});
 const body=palette.body||mat('#e1e5df'),trim=palette.trim||mat('#527268'),steel=mat('#889990'),ink=mat('#283e43'),copper=mat('#b46d48'),windowMat=mat('#69999a'),green=mat('#267858');
 const box=(p,x,y,z,a,b,c,material)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),material);o.position.set(x,y,z);p.add(o);return o};
 const cyl=(p,x,y,z,r,len,material,axis)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,8),material);o.position.set(x,y,z);if(axis)o.rotation.z=Math.PI/2;p.add(o);return o};
 const B=(x,y,z,a,b,c,material=body)=>box(root,x,y,z,a,b,c,material);
 const screen=(x,y,z,a=.55,b=.38)=>{B(x,y,z,a+.12,b+.12,.09,ink);B(x,y,z+.06,a,b,.025,windowMat)};
 const foot=()=>{for(const x of [-w*.36,w*.36])for(const z of [-d*.32,d*.32]){B(x,.18,z,.3,.32,.3,ink);B(x,.48,z,.13,.5,.13,steel)}};
 function person(z){
  const p=new THREE.Group();p.name='operator';p.position.z=z;p.rotation.y=station?(s===1?0:Math.PI):Math.PI;root.add(p);
  for(const x of [-.14,.14]){cyl(p,x,.43,0,.09,.65,ink);box(p,x,.1,.08,.2,.12,.34,ink)}
  box(p,0,1.03,0,.53,.58,.3,green);box(p,0,1.19,.17,.36,.12,.03,copper);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,1),mat('#cda784'));head.position.y=1.57;p.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.23,8,4,0,Math.PI*2,0,Math.PI/2),body);helmet.position.y=1.6;p.add(helmet);
  const arms=[];for(const x of [-.34,.34]){const arm=new THREE.Group();arm.position.set(x,1.24,0);p.add(arm);box(arm,0,-.12,.08,.13,.32,.14,green);box(arm,0,-.25,.26,.12,.12,.34,mat('#cda784'));arms.push(arm)}return {p,arms};
 }
 if(station){
  const tz=s*1.1,td=Math.min(1.8,d*.38);
  // Cantilever trestles, rear utility rail and three removable fixture pallets.
  B(0,1.08,tz,w-.18,.12,td,body);
  for(const x of [-w*.38,w*.38]){B(x,.5,tz,.15,1,.15,steel);B(x,.12,tz,.52,.12,td*.85,trim);B(x,.88,tz+s*td*.15,.12,.2,td*.6,copper)}
  B(0,.45,tz-s*td*.35,w*.78,.08,.1,steel);
  B(0,1.68,tz+s*td*.4,w*.82,.08,.1,trim);
  for(const x of [-w*.38,w*.38])B(x,1.38,tz+s*td*.4,.06,.6,.06,steel);
  const {p,arms}=person(manualOperatorZ(m)),jigs=[];
  if(manualStationType(m)==='test')for(const x of [-w*.29,0,w*.29]){
   const jig=new THREE.Group();jig.name='test-jig';jig.position.set(x,1.18,tz);root.add(jig);jigs.push(jig);
   box(jig,0,.06,0,1.04,.12,.8,ink);box(jig,0,.16,0,.76,.06,.52,green);
   for(const px of [-.44,.44])cyl(jig,px,.33,-s*.28,.035,.5,copper);
   box(jig,0,.52,-s*.28,.94,.08,.14,steel);box(jig,0,.42,0,.12,.38,.12,trim);
  }else {screen(-w*.25,1.52,tz+s*.35,.7,.4);B(w*.15,1.18,tz,.85,.04,.6,green);cyl(root,w*.3,1.5,tz,.05,.65,copper)}
  root.userData.operator=p;root.userData.jigs=jigs;
 } else if(['FCT','AUTO'].includes(kind)){
  // Test portal: open frame, sliding clamshell and side instrumentation tower.
  foot();B(0,.84,-d*.17,w*.86,.24,d*.57,trim);
  B(-w*.37,1.62,-d*.22,w*.18,1.48,d*.5,body);screen(-w*.37,1.72,d*.04,w*.12,.5);
  for(const x of [-w*.18,w*.3])B(x,1.66,-d*.32,.1,1.6,.1,steel);
  B(w*.06,2.4,-d*.32,w*.57,.17,.3,copper);
  const cage=new THREE.Group();cage.position.set(w*.06,2.05,-d*.17);root.add(cage);
  box(cage,0,.15,0,w*.47,.25,d*.42,trim);box(cage,0,-.08,0,w*.36,.22,d*.3,windowMat);
  const board=B(w*.06,1.3,-d*.17,w*.24,.035,d*.18,green);
  const {p,arms}=person(d*.32);root.userData.operator=p;root.userData.jigs=[];
  root.userData.fixture={cage,board,arm:arms[1],tableZ:-d*.17,operatorZ:d*.32,openY:2.05,closedY:1.2};
 } else {
  foot();
  if(kind==='RF'){
   // Suspended insulated tunnel, arched zone covers and independent exhausts.
   B(0,.75,0,w*.96,.35,d*.8,ink);
   const n=6;for(let i=0;i<n;i++){const x=-w*.45+(i+.5)*w*.9/n;B(x,1.42,0,w*.9/n-.08,1.05,d*.84,body);B(x,2.02,0,w*.9/n-.13,.16,d*.65,trim);cyl(root,x,2.18,-d*.22,.16,.35,steel);B(x,1.45,d*.43,w*.9/n-.2,.08,.04,copper)}screen(w*.28,1.67,d*.44);
  }else if(kind==='NXT'){
   B(0,.72,0,w*.95,.35,d*.86,ink);
   for(let i=0;i<3;i++){const x=(i-1)*w*.3;B(x,1.38,-d*.12,w*.27,.95,d*.65,body);const lid=B(x,2.02,-d*.13,w*.26,.18,d*.56,windowMat);lid.rotation.x=-.14;B(x,1.22,d*.32,w*.25,.12,d*.24,trim);for(let j=0;j<5;j++)B(x-w*.1+j*w*.05,1.04,d*.39,.08,.28,.5,copper)}screen(w*.32,2.1,d*.27);
  }else if(kind==='SPI'||kind==='PR'){
   B(0,.85,0,w*.86,.7,d*.78,body);B(-w*.32,1.64,-d*.23,.18,1.02,.22,trim);B(w*.32,1.64,-d*.23,.18,1.02,.22,trim);
   B(0,2.08,-d*.1,w*.84,.2,d*.62,trim);const lid=B(0,1.74,d*.14,w*.68,.1,d*.48,windowMat);lid.rotation.x=-.5;
   B(0,1.29,0,w*.64,.08,d*.5,ink);screen(w*.29,1.36,d*.42,.5,.35);
  }else if(kind==='AOI'){
   B(0,.81,0,w*.82,.55,d*.75,body);B(-w*.28,1.62,-d*.2,.32,1.3,.4,trim);B(0,2.2,-d*.15,w*.7,.23,d*.58,body);
   cyl(root,0,1.91,0,.26,.4,ink);cyl(root,0,1.66,0,.19,.13,copper);B(0,1.22,0,w*.64,.1,d*.55,trim);screen(w*.28,1.65,d*.36);
  }else if(kind==='ICT'){
   B(-w*.2,1.25,0,w*.46,1.65,d*.77,body);B(w*.24,.95,0,w*.33,1.06,d*.7,trim);for(let i=0;i<4;i++){B(-w*.2,.8+i*.3,d*.4,w*.36,.22,.08,ink);B(-w*.2,.8+i*.3,d*.45,.35,.03,.03,copper)}B(w*.24,1.6,0,w*.31,.18,d*.65,copper);screen(-w*.2,2.02,d*.4);
  }else if(kind==='CUT'){
   B(0,.85,0,w*.87,.5,d*.8,trim);for(const x of [-w*.34,w*.34])B(x,1.7,0,.14,1.4,d*.62,body);B(0,2.35,0,w*.78,.18,.25,copper);B(0,1.95,0,.3,.7,.35,ink);B(0,1.14,0,w*.7,.06,d*.62,windowMat);screen(w*.3,1.58,d*.4);
  }else if(id.startsWith('AR-')&& !id.endsWith('03')){
   for(const x of [-w*.43,w*.43])for(const z of [-d*.33,d*.33])B(x,1.9,z,.13,3.5,.13,trim);
   for(const y of [.55,1.7,2.9]){B(0,y,0,w*.93,.12,d*.73,copper);for(const x of [-w*.22,w*.22])B(x,y+.38,0,w*.32,.65,d*.5,body)}
  }else if(id==='AR-03'){
   B(0,.45,0,w*.8,.4,d*.7,trim);B(0,.78,0,w*.56,.27,d*.45,copper);for(const x of [-w*.28,w*.28])for(const z of [-d*.23,d*.23]){const wheel=cyl(root,x,.27,z,.2,.12,ink);wheel.rotation.x=Math.PI/2}
  }else if(kind==='EM'||id.startsWith('EM-')){
   B(0,.85,0,w*.86,.25,d*.65,trim);for(const x of [-w*.32,w*.32])B(x,1.6,0,.16,1.65,.3,steel);B(0,2.35,0,w*.78,.2,.4,body);B(0,1.58,0,.7,.65,.7,copper);screen(-w*.32,1.65,d*.32);
  }else if(id.startsWith('UT-')){
   for(const x of [-w*.23,w*.23])cyl(root,x,1.15,0,.65,1.7,trim);B(0,.52,0,w*.88,.2,d*.65,steel);screen(0,1.58,d*.3);for(let i=0;i<5;i++)B(w*.3,1+i*.13,d*.33,.5,.035,.04,ink);
  }else{
   B(-w*.2,1.05,0,w*.43,1.25,d*.72,body);B(w*.2,.73,0,w*.35,.55,d*.67,trim);B(w*.2,1.31,-d*.2,w*.3,.6,.16,copper);screen(-w*.2,1.6,d*.38);
  }
 }
 const status=mat(SC[m.s]||'#267858'),top=station?1.7:kind==='GENERAL'?1.75:2.3,statusZ=station?s*1.35:-d*.32;cyl(root,w*.39,top+.2,statusZ,.065,.4,steel);B(w*.39,top+.45,statusZ,.16,.22,.16,status);
 root.userData.design='factory-map-v1:'+kind;return root;
}
function addMapConveyorProfile(link){
 const root=new THREE.Group();link.profile=root;link.group.add(root);
 const steel=new THREE.MeshStandardMaterial({color:0x84978d,metalness:.65,roughness:.4}),copper=new THREE.MeshStandardMaterial({color:0xac7854});
 const steps=Math.max(2,Math.ceil(link.total/.55));
 // Twin raised guide rails follow the very same computed path as the belt.
 for(const side of [-1,1]){
  const pts=[];for(let i=0;i<=steps;i++){const f=i/steps,p=link.curve.getPoint(f),t=link.curve.getTangent(f);pts.push(new THREE.Vector3(p.x-t.z*.59*side,.66,p.z+t.x*.59*side))}
  const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),steps,.035,4,false),steel);root.add(rail);
 }
 for(let dist=.7;dist<link.total;dist+=2.6){const p=link.curve.getPointAt(dist/link.total),t=link.curve.getTangentAt(dist/link.total);
  for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,.45,.1),steel);leg.position.set(p.x-t.z*.49*side,.23,p.z+t.x*.49*side);root.add(leg)}
  const bar=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,1.3),copper);bar.position.set(p.x,.12,p.z);bar.rotation.y=-Math.atan2(t.z,t.x);root.add(bar);
 }
}
