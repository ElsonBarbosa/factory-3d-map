/* painéis */
const br=(l,v)=>`<div class="br"><span>${safe(l)}</span><div class="tr"><i style="width:${Math.min(100,v)}%;background:${col(v)}"></i></div><b>${pc(v)}</b></div>`;
const kv=(k,v)=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`;
function home(){return `<div class="eb">Visão geral</div><h2>Unidade principal</h2><div class="note" style="border-color:var(--line)">Clique em uma máquina, bancada ou área do mapa para ver os detalhes. As placas seguem pela esteira de uma área para a outra.</div>
 <div class="sec"><h3>Precisam de atenção</h3>${MS.filter(m=>m.s!=='run').map(m=>`<button class="al" data-m="${safe(m.id)}"><i class="dot" style="background:${SC[m.s]}"></i><span>${safe(m.id)} ${safe(m.n)}<small class="cap">${SN[m.s]}: ${m.why}</small></span></button>`).join('')}</div>
 <div class="sec"><h3>OEE por área</h3>${AL.map(a=>br(a.n,a.oee)).join('')}<small class="cap">Meta de OEE: 85%. Verde a partir de 80%.</small></div>`}
function mPanel(m){const a=A[m.a],c=SC[m.s],mx=Math.max(1,...m.hr);
 return `<div class="eb">${m.side!==undefined?'Bancada':'Máquina'} ${safe(m.id)} na área <a data-a="${safe(a.id)}">${safe(a.n)}</a></div><h2>${safe(m.n)}</h2>
 ${workcellDescription(m)?'<div class="note">'+safe(workcellDescription(m))+(isStation(m)?'<br>'+safe(manualRelation(m)):' · ciclo visual de abrir e fechar')+'</div>':''}
 <div class="stat"><span class="bd" style="background:${c}">${SN[m.s]}</span><span>${m.s==='run'?'há '+m.since+' em operação':'há '+m.since}</span></div>
 ${m.why?`<div class="note" style="border-color:${c}">${m.why}</div>`:''}
 <div class="sec"><h3>OEE do turno</h3><div class="big" style="color:${col(m.oee)}">${pc(m.oee)}<small>Meta 85,0%</small></div>${br('Disponibilidade',m.disp)}${br('Performance',m.perf)}${br('Qualidade',m.qual)}</div>
 <div class="sec"><h3>Produção do turno</h3><div class="big">${nf(m.prod)}<small>de ${nf(m.meta)} pcs previstas até 14:00</small></div>
 <div class="tr l"><i style="width:${Math.min(100,m.prod/m.meta*100)}%;background:var(--ink)"></i><u style="left:65%"></u></div><span class="cap">O traço marca o ritmo esperado às 11:12 (65% do turno).</span>
 <div class="hb">${m.hr.map((v,i)=>`<div><i style="height:${Math.max(3,v/mx*100)}%"></i><s>${6+i}h</s></div>`).join('')}</div></div>
 <div class="sec"><h3>Qualidade e ritmo</h3>${kv('FPY (primeira passada)',pc(m.fpy))}${kv('Defeitos e rejeição',nf(m.ref)+' pcs ('+(m.prod?pc(m.ref/m.prod*100):'—')+')')}${kv('Retrabalho',nf(m.retr)+' pcs')}${kv('Ciclo real / padrão',f1(m.ciclo)+' s / '+f1(m.std)+' s')}${kv('Capacidade nominal',m.ideal+' pcs/h')}${kv('Alarmes ativos',m.alarm)}${kv('Paradas no turno',m.stops+' ('+m.park+' min)')}</div>
 <div class="sec"><h3>Em produção agora</h3>${kv('Produto',a.prod)}${kv('Ordem',a.op)}${kv('Programa',m.prg)}${kv('Operador responsável',m.oper)}</div>
 <div class="sec"><h3>Manutenção e energia</h3>${kv('Última preventiva',m.last)}${kv('Próxima preventiva',m.next)}${kv('MTBF',m.mtbf+' h')}${kv('MTTR',m.mttr+' min')}${kv('Energia no turno',m.kwh+' kWh')}</div>`}
function aPanel(a){if(!a.ms.length)return `<div class="eb">Área de manufatura</div><h2>${safe(a.n)}</h2><div class="note" style="border-color:var(--line)">Área criada. Abra o Editor para adicionar equipamentos.</div>${kv('Dimensões',a.w+' × '+a.d)}${kv('Equipamentos',0)}`;const cn=k=>a.ms.filter(m=>m.s===k).length,on=cn('run')+cn('setup'),o=a.ms[a.ms.length-1];
 return `<div class="eb">${a.i<6?`Área ${a.i+1} do fluxo de produção`:'Área de apoio'}</div><h2>${safe(a.n)}</h2><div class="stat"><span>Supervisor: ${a.team[0]?.[0]||'—'}</span></div>
 <div class="sec"><h3>Desempenho</h3>${br('OEE da área',a.oee)}${br('FPY da área',a.fpy)}<div>${Object.keys(SN).map(k=>`<span class="chip"><i class="dot" style="background:${SC[k]}"></i>${cn(k)} ${SN[k].toLowerCase()}</span>`).join('')}</div>
 ${kv('Máquinas online / offline',`${on} / <span style="color:var(--bad)">${a.ms.length-on}</span>`)}</div>
 <div class="sec"><h3>Colaboradores</h3><div class="big">${a.pres}<small>presentes de ${a.esc} escalados</small></div>${a.team.map(([n,r])=>kv(r,n)).join('')}</div>
 <div class="sec"><h3>Produto atual</h3>${kv('Produto',a.prod)}${kv('Ordem',a.op)}${kv('Lote',a.lote)}${kv('Quantidade da ordem',a.ord)}${kv('Meta do turno',nf(o.prod)+' de '+nf(o.meta)+' pcs ('+pc(o.prod/o.meta*100)+')')}<div class="tr l"><i style="width:${a.prog}%;background:var(--ink)"></i></div><span class="cap">${a.prog}% da ordem concluída</span></div>
 <div class="sec"><h3>Recursos e segurança</h3>${kv('Material em processo (WIP)',nf(a.wip)+' pcs')}${kv('Energia no turno',nf(a.kwh)+' kWh')}${kv('Temperatura ambiente',a.temp+' °C')}${kv('Uso correto de EPI',pc(a.epi))}${kv('Dias sem acidente','187')}</div>
 <div class="sec"><h3>Máquinas e bancadas</h3>${a.ms.map(m=>`<button class="al" data-m="${safe(m.id)}"><i class="dot" style="background:${SC[m.s]}"></i>${safe(m.id)} ${safe(m.n)}<b class="r">${pc(m.oee)}</b></button>`).join('')}</div>`}
