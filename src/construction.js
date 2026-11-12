const mapConstructionTools=[
 ['process','Processo','<path d="M12 17h40v34H12zM7 11h50M7 8v6m50-6v6M19 17v34M19 26h33M19 43h33"/>'],
 ['areas','Área de manufatura','<path d="M10 10h44v44H10zM10 32h44M32 10v44M18 18h6v6h-6zM40 40h6v6h-6z"/>'],
 ['machines','Equipamento','<path d="M13 23h38v30H13zM18 23V12h28v11M21 31h22v12H21zM18 53v5m28-5v5M51 16h6v20h-6M26 47h12"/>'],
 ['stations','Estações','<path d="M8 31h48v6H8zM15 37v19m34-19v19M22 31V15h20v16M26 20h12M15 49h34"/><circle cx="51" cy="13" r="5"/>'],
 ['flow','Esteiras','<path d="M8 24h48v18H8zM13 24v18m9-18v18m10-18v18m10-18v18m9-18v18M15 42v12m34-12v12M24 14h18m-6-6 6 6-6 6"/>']
];
function drawEditor(){if(!E.on)return;
 extras.open=false;
 const blocked=editorToolBlock(E.mode);if(!E.editorHome&&blocked)E.editorHome=true;
 editorDrawer.classList.toggle('home',E.editorHome);
 const previousWorkspace=ED.querySelector('.edworkspace'),previousMode=previousWorkspace?.dataset.mode;
 const previousScroll=previousWorkspace?.scrollTop||0,previousCatalogScroll=ED.querySelector('.edcatalog')?.scrollLeft||0;
 syncMachineOutline();
 const which=E.selected&&A[E.selected],machine=E.machineSelected&&M[E.machineSelected];
 if(E.editorHome){
  ED.innerHTML=`<nav class="edmain-menu" aria-label="Ferramentas do criador">${editorTools.map(([key,title,icon])=>{const reason=editorToolBlock(key);return `<button type="button" data-edtab="${key}" class="edtool-card ${reason?'locked':''}" aria-disabled="${!!reason}" title="${safe(reason||title)}"><span class="edtool-icon"><svg viewBox="0 0 64 64" aria-hidden="true">${icon}</svg></span><span class="edtool-name">${title}</span>${reason?`<span class="edtool-lock">${toolLock}</span>`:''}</button>`}).join('')}</nav><p class="edmenu-feedback" id="edMenuMessage" role="status" hidden></p>`;
  ED.querySelectorAll('[data-edtab]').forEach(b=>b.onclick=()=>openEditorTool(b.dataset.edtab));
  if(storageNotice)status('');return;
 }
 const tool=editorTools.find(([key])=>key===E.mode);
 const step=E.mode==='process'?1:E.mode==='areas'?2:E.mode==='flow'?4:3;
 const tabs=`<button type="button" id="edBack" title="Voltar às ferramentas">← Voltar</button><strong>${tool[1]}</strong>${E.blank?`<span class="edprogress">Etapa ${step} de 4</span>`:'' }`;
 let content='';
 if(E.mode==='process'){
  const p=E.process;
  content=`<section class="edsection"><h3>Área geral do processo</h3><p>Arraste o piso para mover toda a fábrica. Use os quatro cantos verdes para dimensionar.</p><div class="edprocess-fields"><label>Nome do processo<input id="edProcessName" value="${safe(E.processName||'Nova linha de produção')}"></label><details class="eddimensions"><summary>Dimensões · ${p.w} × ${p.d}</summary><div class="edcompact-fields"><label>Largura<input id="edProcessW" type="number" min="14" max="180" value="${p.w}"></label><label>Profundidade<input id="edProcessD" type="number" min="14" max="130" value="${p.d}"></label></div></details><div class="edbuttons"><button id="edProcessApply">Aplicar dimensões e nome</button><button id="edNewProcess">Criar novo processo</button><button id="edProcessNext" class="edprimary">${E.processReady?'Ir para áreas':'Salvar processo e continuar →'}</button></div></div></section>`;
 }else if(E.mode==='areas'){
  content=`<section class="edsection"><h3>Áreas de manufatura</h3><div class="edarea-workspace"><div><p>Selecione uma área. Arraste o piso para mover ou use os quatro cantos para redimensionar.</p><div class="edlist">${AL.filter(a=>a.floor.visible).map(a=>`<button class="editem ${E.selected===a.id?'on':''}" data-edarea="${safe(a.id)}"><span>${safe(a.n)}</span><small>${Number(a.w.toFixed(2))}×${Number(a.d.toFixed(2))}</small></button>`).join('')||'<p>Nenhuma área cadastrada.</p>'}</div>${!E.newAreaForm?'<button class="edprimary edsecondary" id="edOpenArea">+ Adicionar área</button>':''}</div><div>${E.newAreaForm?`<div class="edform"><div class="edcompact-fields three"><label>Nome<input id="edNewName" placeholder="Ex.: SMT - Linha 02"></label><label>Cor<input id="edColor" type="color" value="#5689a5"></label></div><div class="edbuttons"><button id="edAddArea" class="edprimary">Salvar área</button><button id="edCancelArea">Cancelar</button></div></div>`:which?`<div class="edform"><label>Área selecionada<input id="edRename" value="${safe(which.n)}"></label><details class="eddimensions"><summary>Dimensões · ${Number(which.w.toFixed(2))} × ${Number(which.d.toFixed(2))}</summary><div class="edcompact-fields"><label>Largura<input id="edWidth" type="number" min="8" max="180" value="${Number(which.w.toFixed(2))}"></label><label>Profundidade<input id="edDepth" type="number" min="8" max="130" value="${Number(which.d.toFixed(2))}"></label></div></details><div class="edbuttons"><button class="edprimary" id="edApply">Salvar alterações</button></div></div>`:'<p>Selecione uma área no mapa para editar suas propriedades.</p>'}</div></div></section>`;
 }else if(E.mode==='machines'||E.mode==='stations'){
  const station=E.mode==='stations',items=MS.filter(m=>m.mesh&&m.mesh.visible&&isStation(m)===station),options=station?stations:catalogue.filter(c=>c[0]!=='BAN');
  content=`<section class="edsection" id="edSelectedEquipment" aria-labelledby="edSelectedEquipmentTitle"><div class="edselection-head"><h3 id="edSelectedEquipmentTitle">${station?'Estação selecionada':'Equipamento selecionado'}</h3><details class="edinstalled"><summary>Lista · ${items.length}</summary><div class="edlist">${items.map(m=>`<button class="editem ${E.machineSelected===m.id?'on':''}" data-edmachine="${safe(m.id)}"><span>${safe(m.id)} — ${safe(m.n)}</span><small>${(m.rot||0)*90}°</small></button>`).join('')||'<p>Nenhum item instalado.</p>'}</div></details></div>${machine&&isStation(machine)===station?`<p class="edselected-name">${safe(machine.id)} · ${safe(machine.n)}</p><div class="edform"><div class="edmachine-fields"><label>Nome<input id="edEditName" value="${safe(machine.n)}"></label><label>ID<input id="edEditId" value="${safe(machine.id)}"></label></div><input id="edEditRotation" type="hidden" value="${machine.rot||0}"><div class="edorientation"><span>Orientação</span><output id="edRotationValue">${(machine.rot||0)*90}°</output><button id="edRotate90" title="Girar 90 graus">↻ 90°</button><span>X ${machine.pos.x.toFixed(0)} · Z ${machine.pos.z.toFixed(0)}</span></div><p class="edhelp edworkcell-kind">${safe(workcellDescription(machine))}</p><div class="edbuttons"><button id="edSaveMachine" class="edprimary">Salvar alterações</button><button id="edMoveMachine">Mover no mapa</button></div>${station?`<div class="edmanual-fields"><label>Disposição<select id="edManualMode"><option value="parallel" ${manualDisposition(machine)==='parallel'?'selected':''}>Paralela à esteira</option><option value="lateral" ${manualDisposition(machine)==='lateral'?'selected':''}>Lateral colada</option></select></label><button id="edFlipStation" type="button" title="Trocar o lado da bancada em relação ao corredor">⇄ Inverter lado</button><label>Direção do fluxo<select id="edManualFlow"><option value="auto" ${machine.lineRot===undefined?'selected':''}>Acompanha o posto</option>${['→ X positivo','↑ Z negativo','← X negativo','↓ Z positivo'].map((text,i)=>`<option value="${i}" ${machine.lineRot===i?'selected':''}>${text}</option>`).join('')}</select></label></div><p class="edhelp" id="edManualRelation">${safe(manualRelation(machine))} · operador e faixa da esteira.</p>`:''}</div>`:`<p>${station?'Nenhuma estação selecionada.':'Nenhum equipamento selecionado.'} Selecione no mapa ou na lista.</p>`}</section><section class="edsection edcatalog-section"><h3>${station?'Catálogo de estações':'Catálogo de equipamentos'}</h3><div class="edcatalog">${options.map((c,i)=>`<button class="edcatalog-card" type="button" draggable="true" data-edcatalog="${i}" title="Arraste para a área de manufatura"><img src="${modelThumb(c,station)}" alt="Prévia 3D de ${safe(c[1])}" draggable="false"><strong>${safe(c[0])}</strong><small>${safe(c[1])} · ${c[2]}×${c[4]}</small></button>`).join('')}</div></section>`;
 }else if(E.mode==='flow'){
  content=`<div class="edsection"><h3>Esteiras e fluxo</h3><p>Conecte a saída vermelha de uma máquina à entrada verde da próxima. Nas curvas, setas e placas seguem um trajeto suavizado.</p><div class="flow-help">🔴 Saída → 🟢 Entrada · Primeiro fluxo para a direita · Retorno permitido em U.</div><div class="edlist">${E.links.map((l,i)=>`<button class="editem ${E.linkSelected===l?'on':''}" data-edlink="${i}">${safe(l.from)} → ${safe(l.to)}</button>`).join('')||'<p>Nenhuma esteira conectada.</p>'}</div>${E.linkSelected&&E.links.includes(E.linkSelected)?`<div class="edform"><h3>Esteira selecionada</h3><div class="kv"><span>Origem</span><b>${safe(E.linkSelected.from)}</b></div><div class="kv"><span>Destino</span><b>${safe(E.linkSelected.to)}</b></div><p class="edhelp">Para alterar o trajeto, mova os equipamentos nas respectivas posições. Pressione Delete para remover a ligação.</p></div>`:''}<div class="edbuttons"><button id="edCancelFlow">Cancelar conexão</button><button id="edUndoFlow">Desfazer última</button></div><div class="flow-help">${E.from?'Conectando saída de '+safe(E.from):'Escolha uma saída vermelha.'}</div></div>`;
 }
 ED.innerHTML=`<div class="edtabline eddetailbar">${tabs}</div><div class="edworkspace" data-mode="${E.mode}">${content}</div><div class="edfooter"><div class="edstatus" id="edStatus">${E.placing?'Clique no mapa para posicionar. ESC cancela.':E.mode==='process'?'Arraste o piso para mover · Use os cantos verdes para redimensionar.':'Selecione no mapa · Arraste para mover · WASD navega · Ctrl + arraste faz pan.'}</div>${E.mode==='process'?'':'<button id="edDelete" style="border-color:#c95959;color:#d66a65">Excluir (Delete)</button>'}</div>`;

 if(previousMode===E.mode){
  ED.querySelector('.edworkspace').scrollTop=previousScroll;
  const catalog=ED.querySelector('.edcatalog');if(catalog)catalog.scrollLeft=previousCatalogScroll;
 }
 if(storageNotice)status($('#edStatus').textContent);
 $('#edBack').onclick=backToEditorHome;
 if($('#edDelete'))$('#edDelete').onclick=deleteSelected;
 if(E.mode==='process'){
  $('#edNewProcess').onclick=freshProject;
  $('#edProcessApply').onclick=()=>{const rect={...E.process,w:snap(Number($('#edProcessW').value)),d:snap(Number($('#edProcessD').value))};const err=validateProcess(rect);if(err)return status(err,true);E.process=rect;E.processName=$('#edProcessName').value.trim()||'Nova linha de produção';E.processReady=true;applyProcess();saveLayout();drawEditor();status('Área geral redimensionada. Continue para as áreas de manufatura.')};
  $('#edProcessNext').onclick=()=>{if(!E.processReady){$('#edProcessApply').click();if(!E.processReady)return}E.mode='areas';drawEditor()};
 }
 if(E.mode==='areas'){
  ED.querySelectorAll('[data-edarea]').forEach(b=>b.onclick=()=>{E.selected=b.dataset.edarea;E.machineSelected=null;drawEditor()});
  if(which&&!E.newAreaForm)$('#edApply').onclick=()=>{
   const w=snap(Number($('#edWidth').value)),d=snap(Number($('#edDepth').value));
   if(!Number.isFinite(w)||!Number.isFinite(d))return status('Informe dimensões válidas.',true);
   const rect={x:which.x,z:which.z,w,d};const err=validateArea(which,rect);
   if(err){status(err,true);return} // Não altera área nem desabilita edição.
   which.n=$('#edRename').value.trim()||which.n;which.lb.textContent=which.n;
   applyResizedArea(which,rect);refreshAreas();saveLayout();drawEditor();status('Dimensões atualizadas.');
  };
  if(E.newAreaForm){$('#edCancelArea').onclick=()=>{E.newAreaForm=false;drawEditor()};$('#edAddArea').onclick=()=>{const name=$('#edNewName').value.trim();if(!name)return status('Informe o nome da área.',true);const color=$('#edColor').value,hue=new THREE.Color(color).getHSL({}).h*360;const a=createArea(name,hue,color);if(!a)return status('Não há espaço livre na área geral para outra área de manufatura.',true);E.newAreaForm=false;E.selected=a.id;saveLayout();updateDashboard();drawEditor();status('Área criada. Ajuste os cantos ou arraste o piso para movê-la.')}}
  else $('#edOpenArea').onclick=()=>{E.newAreaForm=true;drawEditor()};
 }
 if(E.mode==='machines'||E.mode==='stations'){
  const station=E.mode==='stations',options=station?stations:catalogue.filter(c=>c[0]!=='BAN');
  ED.querySelectorAll('[data-edmachine]').forEach(b=>b.onclick=()=>{E.machineSelected=b.dataset.edmachine;drawEditor()});
  if(machine&&isStation(machine)===station){$('#edSaveMachine').onclick=()=>{
   const newId=$('#edEditId').value.trim(),newName=$('#edEditName').value.trim(),rot=Number($('#edEditRotation').value);
   if(!newId||!newName)return status('Informe nome e ID.',true);if(newId!==machine.id&&!validMachineId(newId))return status('Informe um ID válido, como SPI-01.',true);if(newId!==machine.id&&M[newId])return status('Este ID já está em uso.',true);
   const err=machineRotationError(machine,rot);if(err)return status(err,true);
   if(newId!==machine.id){const old=machine.id;delete M[old];machine.id=newId;M[newId]=machine;for(const l of E.links){if(l.from===old)l.from=newId;if(l.to===old)l.to=newId}E.machineSelected=newId;}
   machine.n=newName;applyMachineRotation(machine,rot);machine.lb.textContent=newId;saveLayout();drawEditor();status('Equipamento atualizado.')};
   if(station){$('#edManualMode').onchange=e=>changeManualLayout(machine,manualModeChange(machine,e.target.value));$('#edFlipStation').onclick=()=>changeManualLayout(machine,{side:-manualSide(machine)});$('#edManualFlow').onchange=e=>changeManualLayout(machine,{lineRot:e.target.value==='auto'?undefined:Number(e.target.value)});}
   $('#edRotate90').onclick=()=>{const error=applyMachineRotation(machine,normalizeRotation((machine.rot||0)+1));if(error)return status(error,true);saveLayout();drawEditor();status('Orientação atualizada.');};
   $('#edMoveMachine').onclick=()=>{E.placing={moving:machine.id};status('Mova o cursor até a posição desejada. Clique para confirmar. ESC cancela.')};
  }
  ED.querySelectorAll('[data-edcatalog]').forEach(b=>{
   const index=Number(b.dataset.edcatalog),c=options[index];
   b.addEventListener('dragstart',e=>startCatalogueDrag(e,c,station));
   b.addEventListener('dragend',stopCatalogueDrag);
   // Clique continua acessível: ativa o fantasma para posicionar com clique no mapa.
   b.onclick=()=>{const reason=editorToolBlock(station?'stations':'machines');if(reason)return status(reason,true);E.placing={c,rot:0,station,catalogue:true};status('Mova o modelo pelo mapa e clique numa célula para confirmar a instalação. ESC cancela.');};
  });
 }
 if(E.mode==='flow'){
  ED.querySelectorAll('[data-edlink]').forEach(b=>b.onclick=()=>{E.linkSelected=E.links[Number(b.dataset.edlink)];E.machineSelected=null;drawEditor()});
  $('#edCancelFlow').onclick=()=>{E.from=null;drawEditor()};$('#edUndoFlow').onclick=()=>{const l=E.links.pop();if(l){destroyLink(l);refreshManualLinks();E.linkSelected=null;if(!E.links.length)E.flowDir=0;saveLayout();updateDashboard();drawEditor()}};
 }
}
