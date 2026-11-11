(function(){
const $=s=>document.querySelector(s);
const mem={};
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return mem[k]??null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}},del(k){try{localStorage.removeItem(k)}catch(e){delete mem[k]}}};
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const MES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CATS={Moradia:'#22e08f','Alimentação':'#86efac',Transporte:'#2dd4bf',Lazer:'#3b8bff',Saúde:'#8a6bff',Outros:'#8a9d94'};
const ICON={Moradia:'⌂','Alimentação':'🛒',Transporte:'🚗',Lazer:'🎬',Saúde:'✚',Outros:'•',Salário:'↓',Receita:'↓'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S=null,D=null,view='home',hidden=false;
const DATA_VERSION='zero-v1';
 
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function iso(off,day){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-off);d.setDate(Math.min(day,28));return d.toISOString().slice(0,10)}
function seed(){return{tx:[],nid:1,inv:[{n:'Renda Fixa',v:0},{n:'Ações',v:0},{n:'Fundos',v:0},{n:'Criptomoedas',v:0}],goals:[],bud:{Moradia:0,'Alimentação':0,Transporte:0,Lazer:0,'Saúde':0,Outros:0}}}
async function load(){
 if(window.skarSupabase&&S.id){
  const {data,error}=await window.skarSupabase
   .from('dashboard_state')
   .select('data')
   .eq('user_id',S.id)
   .maybeSingle();
  if(!error&&data?.data){D=data.data;return}
  D=seed();
  await save();
  return;
 }
 const versionKey='skar_data_version_'+S.email;
 try{D=JSON.parse(LS.get('skar_d_'+S.email)||'null')}catch(e){D=null}
 if(!D||LS.get(versionKey)!==DATA_VERSION){D=seed();save();LS.set(versionKey,DATA_VERSION)}
}
async function save(){
 LS.set('skar_d_'+S.email,JSON.stringify(D));
 if(window.skarSupabase&&S.id){
  const {error}=await window.skarSupabase
   .from('dashboard_state')
   .upsert({user_id:S.id,data:D,updated_at:new Date().toISOString()});
  if(error)toast('Não foi possível sincronizar os dados');
 }
}
 
/* ENTRADA E SAÍDA DO DASHBOARD */
async function abrirDashboard(user){S=user;await load();view='home';$('#app').classList.remove('hide');render()}
async function fecharDashboard(){
 if(window.skarSupabase)await window.skarSupabase.auth.signOut();
 S=D=null;$('#app').classList.add('hide');if(window.aoSair)window.aoSair()
}
 
/* CÁLCULOS */
const ym=d=>d.slice(0,7);
function stats(){const now=new Date(),cur=ym(now.toISOString()),pd=new Date(now.getFullYear(),now.getMonth()-1,1),prev=ym(new Date(pd.getTime()-pd.getTimezoneOffset()*6e4).toISOString());
 const sum=(m,ty)=>D.tx.filter(t=>t.date.startsWith(m)&&t.type===ty).reduce((a,t)=>a+t.val,0);
 const r=sum(cur,'in'),d=sum(cur,'out'),pr=sum(prev,'in'),pdp=sum(prev,'out');
 const bal=D.tx.reduce((a,t)=>a+(t.type==='in'?t.val:-t.val),0);
 const ch=(a,b)=>b?((a-b)/b*100):null;
 const series=[];for(let o=5;o>=0;o--){const x=new Date(now.getFullYear(),now.getMonth()-o+1,0);const lim=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-31';series.push({l:MES[x.getMonth()],v:D.tx.filter(t=>t.date<=lim).reduce((a,t)=>a+(t.type==='in'?t.val:-t.val),0)})}
 const cats={};D.tx.filter(t=>t.date.startsWith(cur)&&t.type==='out').forEach(t=>cats[t.cat]=(cats[t.cat]||0)+t.val);
 const prevBal=bal-(r-d);
 return{r,d,bal,cr:ch(r,pr),cd:ch(d,pdp),cb:ch(bal,prevBal),series,cats,inv:D.inv.reduce((a,i)=>a+i.v,0)}}
const pct=v=>v==null?'0,0%':(v>=0?'+':'')+v.toFixed(1).replace('.',',')+'%';
const fmtD=d=>{const x=new Date(d+'T12:00:00');return x.getDate()+' '+MES[x.getMonth()]};
const money=v=>hidden?'R$ •••••':brl(v);
 
/* GRÁFICOS */
function line(s,w=640,h=220){const vs=s.map(p=>p.v),mn=Math.min(...vs,0),mx=Math.max(...vs,1),pad=34,X=i=>pad+i*(w-pad-14)/(s.length-1),Y=v=>h-28-(v-mn)/(mx-mn||1)*(h-56);
 let d='M'+X(0)+' '+Y(vs[0]);for(let i=1;i<vs.length;i++){const cx=(X(i-1)+X(i))/2;d+=` C${cx} ${Y(vs[i-1])} ${cx} ${Y(vs[i])} ${X(i)} ${Y(vs[i])}`}
 const area=d+` L${X(vs.length-1)} ${h-28} L${X(0)} ${h-28}Z`;
 const grid=[0,1,2].map(i=>{const v=mn+(mx-mn)*i/2;return`<line x1="${pad}" x2="${w-10}" y1="${Y(v)}" y2="${Y(v)}" stroke="#12372a" stroke-dasharray="3 5"/><text x="0" y="${Y(v)+4}" fill="#8a9d94" font-size="11">${Math.round(v/1000)}k</text>`}).join('');
 return`<svg class="ch" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22e08f" stop-opacity=".4"/><stop offset="1" stop-color="#22e08f" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#lg)"/><path d="${d}" fill="none" stroke="#22e08f" stroke-width="3"/>${s.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.v)}" r="${i==s.length-1?6:4}" fill="${i==s.length-1?'#fff':'#22e08f'}"/><text x="${X(i)}" y="${h-6}" fill="#8a9d94" font-size="12" text-anchor="middle">${p.l}</text>`).join('')}</svg>`}
function donut(cats,tot){let off=0;const R=60,C=2*Math.PI*R;const segs=Object.entries(cats).map(([k,v])=>{const l=v/tot*C,s=`<circle r="${R}" cx="80" cy="80" fill="none" stroke="${CATS[k]||'#8a9d94'}" stroke-width="22" stroke-dasharray="${l-2} ${C-l+2}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"/>`;off+=l;return s}).join('');
 return`<svg viewBox="0 0 160 160" width="170" height="170">${segs||'<circle r="60" cx="80" cy="80" fill="none" stroke="#12372a" stroke-width="22"/>'}<text x="80" y="78" fill="#fff" font-size="15" font-weight="700" text-anchor="middle">${hidden?'•••':brl(tot)}</text><text x="80" y="95" fill="#8a9d94" font-size="9" text-anchor="middle">Total de despesas</text></svg>`}
 
function spark(s){const v=s.map(p=>p.v),mn=Math.min(...v),mx=Math.max(...v),w=200,h=70,X=i=>i*w/(v.length-1),Y=x=>h-6-(x-mn)/(mx-mn||1)*(h-14);const d=v.map((x,i)=>(i?'L':'M')+X(i)+' '+Y(x)).join(' ');return`<svg class="spark" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22e08f" stop-opacity=".35"/><stop offset="1" stop-color="#22e08f" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#sg)"/><path d="${d}" fill="none" stroke="#22e08f" stroke-width="2.5"/><circle cx="${w}" cy="${Y(v[v.length-1])}" r="4" fill="#fff"/></svg>`}
/* VIEWS */
const SV={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',tx:'<path d="M4 8h14l-4-4M20 16H6l4 4"/>',inv:'<path d="M5 20V12M12 20V5M19 20v-9"/>',goals:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-6 15-6 16 0"/>',plan:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',rep:'<path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7"/>'};
const svg=k=>`<svg viewBox="0 0 24 24">${SV[k]}</svg>`;
const txRow=t=>`<div class="tx"><div class="ic" style="${t.type==='in'?'color:var(--g)':''}">${ICON[t.cat]||'•'}</div><div class="m"><b>${esc(t.desc)}</b><span>${esc(t.cat)}</span></div><div class="a" style="color:${t.type==='in'?'var(--g)':'var(--tx)'}">${t.type==='in'?'+ ':'- '}${hidden?'R$ •••':brl(t.val)}<span>${fmtD(t.date)}</span></div><button class="x" data-del="${t.id}" aria-label="Excluir">×</button></div>`;
const recent=n=>[...D.tx].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,n);
 
function vHome(){const s=stats(),first=esc(S.name.split(' ')[0]);const gd=D.goals.filter(g=>g.c>=g.t).length,gp=D.goals.length?Math.round(gd/D.goals.length*100):0;
 const tot=Object.values(s.cats).reduce((a,b)=>a+b,0);
 const invHtml=`<div class="card big"><span class="mu small">Patrimônio investido</span><b style="font-size:26px">${hidden?'R$ •••':brl(s.inv)}</b></div>`+D.inv.map(i=>`<div class="card"><span class="small mu">${esc(i.n)}</span><b>${hidden?'R$ •••':brl(i.v)}</b><div class="bar"><i style="width:${s.inv?i.v/s.inv*100:0}%;background:var(--g)"></i></div></div>`).join('');
 return`<div class="eyebrow dk">VISÃO GERAL</div><div class="hi">Olá, <span>${first}</span></div><div class="mu">Disciplina hoje. Liberdade amanhã.</div>
 <div class="grid stats">
  <div class="card bal">${spark(s.series)}<div class="hd"><span>Saldo total</span><button class="ico" id="eye" style="width:40px;height:40px" aria-label="Ocultar valores"><svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="v">${money(s.bal)}</div><div class="small ${s.cb>=0?'up':'dn'}">${pct(s.cb)} <span class="mu">em relação ao mês passado</span></div></div>
  <div class="card stat"><div class="l"><i class="chip up">↗</i>Receitas</div><div class="v">${money(s.r)}</div><div class="small up">${pct(s.cr)} <span class="mu">vs. mês anterior</span></div></div>
  <div class="card stat"><div class="l"><i class="chip dn">↘</i>Despesas</div><div class="v">${money(s.d)}</div><div class="small ${s.cd<=0?'up':'dn'}">${pct(s.cd)} <span class="mu">vs. mês anterior</span></div></div>
  <div class="card stat dk" data-go="inv" style="cursor:pointer"><div class="l"><i class="chip up">▮</i>Investimentos</div><div class="v">${money(s.inv)}</div><div class="small mu">${D.inv.length} classes</div></div>
  <div class="card stat dk" data-go="goals" style="cursor:pointer"><div class="l"><i class="chip up">◎</i>Metas</div><div class="v">${gd} de ${D.goals.length}</div><div class="bar"><i style="width:${gp}%;background:var(--g)"></i></div></div>
 </div>
 <div class="grid two"><div class="card"><div class="hd"><h3>Resumo financeiro</h3><span class="small mu">Últimos 6 meses</span></div>${line(s.series)}</div>
 <div class="card dk"><h3>Despesas por categoria</h3><div class="donut">${donut(s.cats,tot)}<div class="leg">${Object.entries(s.cats).map(([k,v])=>`<div><i style="background:${CATS[k]||'#8a9d94'}"></i>${esc(k)}<span>${Math.round(v/tot*100)}%</span><em>${hidden?'':brl(v)}</em></div>`).join('')||'<span class="mu">Sem despesas neste mês.</span>'}</div></div></div></div>
 <div class="grid two g3"><div class="card"><div class="hd"><h3>Últimas transações</h3><a class="lk small" data-go="tx" style="text-decoration:none">Ver todas ›</a></div>${recent(5).map(txRow).join('')||'<p class="mu">Nenhuma transação. Toque em + para começar.</p>'}</div>
 <div class="card dk"><div class="hd"><h3>Meus investimentos</h3><a class="lk small" data-go="inv" style="text-decoration:none">Ver todos ›</a></div><div class="inv">${invHtml}</div></div></div>`}
function vTx(){const l=[...D.tx].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);return`<div class="hd"><div class="hi">Transações</div><button class="add" data-add>＋ Nova</button></div><div class="card" style="margin-top:16px">${l.map(txRow).join('')||'<p class="mu">Nenhuma transação ainda.</p>'}</div>`}
function vInv(){const s=stats();return`<div class="hd"><div class="hi">Investimentos</div><button class="add" data-addinv>＋ Aportar</button></div><div class="card" style="margin-top:16px"><div class="mu">Patrimônio investido</div><div class="hi" style="font-size:36px">${money(s.inv)}</div></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${D.inv.map((i,ix)=>`<div class="card"><div class="hd"><span>${esc(i.n)}</span><span class="small mu">${s.inv?Math.round(i.v/s.inv*100):0}%</span></div><div class="hi" style="font-size:24px">${hidden?'R$ •••':brl(i.v)}</div><div class="bar"><i style="width:${s.inv?i.v/s.inv*100:0}%;background:${['#22e08f','#3b8bff','#8a6bff','#f5b73a'][ix%4]}"></i></div></div>`).join('')}</div>`}
function vGoals(){return`<div class="hd"><div class="hi">Metas</div><button class="add" data-addgoal>＋ Nova meta</button></div><div class="card" style="margin-top:16px">${D.goals.map((g,i)=>{const p=Math.min(100,Math.round(g.c/g.t*100));return`<div class="goal"><div class="t"><b>${esc(g.n)}</b><span class="${p>=100?'up':'mu'}">${p}%</span></div><div class="bar"><i style="width:${p}%;background:var(--g)"></i></div><div class="hd" style="margin-top:10px"><span class="small mu">${brl(g.c)} de ${brl(g.t)}</span><span><button class="mini" data-dep="${i}">Guardar</button> <button class="x" data-delg="${i}" aria-label="Excluir meta">×</button></span></div></div>`}).join('')||'<p class="mu">Crie sua primeira meta.</p>'}</div>`}
function vMe(){return`<div class="hi">Perfil</div><div class="card" style="margin-top:16px"><div class="mu small">Nome</div><b>${esc(S.name)}</b><div class="mu small" style="margin-top:14px">E-mail</div><b>${esc(S.email)}</b></div>
 <div class="grid"><button class="btn out" data-go="goals">Metas</button><button class="btn out" data-go="plan">Planejamento</button><button class="btn out" data-go="rep">Relatórios</button><button class="btn out" id="reset">Restaurar painel zerado</button><button class="btn out" id="wipe">Apagar todos os dados</button><button class="btn" id="out">Sair da conta</button></div>`}
 
function vPlan(){const s=stats();D.bud=D.bud||{Moradia:0,'Alimentação':0,Transporte:0,Lazer:0,'Saúde':0,Outros:0};
 return`<div class="hi">Planejamento</div><div class="mu">Limite mensal por categoria</div><div class="card" style="margin-top:16px">${Object.keys(CATS).map(k=>{const lim=D.bud[k]||0,u=s.cats[k]||0,over=lim&&u>lim,p=lim?Math.min(100,u/lim*100):0;return`<div class="goal"><div class="t"><b>${k}</b><span class="${over?'dn':'mu'}">${hidden?'•••':brl(u)} / ${brl(lim)}</span></div><div class="bar"><i style="width:${p}%;background:${over?'var(--red)':CATS[k]}"></i></div><div style="margin-top:10px"><button class="mini" data-bud="${k}">Definir limite</button></div></div>`}).join('')}</div>`}
function vRep(){const now=new Date();let rows='';for(let o=0;o<6;o++){const d=new Date(now.getFullYear(),now.getMonth()-o,1),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const f=ty=>D.tx.filter(t=>t.date.startsWith(m)&&t.type===ty).reduce((a,t)=>a+t.val,0),r=f('in'),x=f('out');rows+=`<tr><td>${MES[d.getMonth()]}/${d.getFullYear()}</td><td class="up">${money(r)}</td><td class="dn">${money(x)}</td><td>${money(r-x)}</td></tr>`}
 return`<div class="hi">Relatórios</div><div class="mu">Resultado dos últimos 6 meses</div><div class="card" style="margin-top:16px;overflow-x:auto"><table class="rt"><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Resultado</th></tr>${rows}</table></div>`}
function render(){
 const items=[['home','Início','Visão Geral'],['tx','Transações','Transações'],['inv','Investimentos','Investimentos'],['goals','Metas','Metas'],['plan','Planejamento','Planejamento'],['rep','Relatórios','Relatórios'],['me','Perfil','Perfil']];
 const body={home:vHome,tx:vTx,inv:vInv,goals:vGoals,plan:vPlan,rep:vRep,me:vMe}[view]();
 const logo='<svg viewBox="0 0 40 40" style="height:28px"><rect x="2" y="24" width="8" height="14" fill="#22e08f"/><rect x="15" y="14" width="8" height="24" fill="#22e08f"/><rect x="28" y="2" width="8" height="36" fill="#22e08f"/></svg>';
 $('#app').innerHTML=`<div class="banner"></div><aside class="side"><div class="logo">${logo}SKAR <b>FINANCE</b></div>${items.map(i=>`<button class="nav ${view===i[0]?'on':''}" data-go="${i[0]}">${svg(i[0])}${i[2]}</button>`).join('')}<div class="sp"></div><div class="quoteb"><div>DISCIPLINA<br>HOJE<br><b>LIBERDADE</b><br>SEMPRE</div></div></aside>
 <main><div class="top"><div class="mob"><div class="logo">${logo}SKAR <b>FINANCE</b></div><div class="tag2">DISCIPLINA GERA LIBERDADE</div></div><div style="display:flex;gap:10px"><button class="ico dot" aria-label="Notificações" data-n><svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/></svg></button><button class="ico mob" data-go="me" aria-label="Perfil">${svg('me')}</button><button class="uchip dk" data-go="me"><i>${esc(S.name[0].toUpperCase())}</i>${esc(S.name.split(' ')[0])} ▾</button></div></div>${body}</main>
 <button class="fab" data-add aria-label="Nova transação"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
 <nav class="bnav">${['home','tx','inv','me'].map(k=>{const i=items.find(x=>x[0]===k);return`<button class="bn ${view===k?'on':''}" data-go="${k}">${svg(k)}${i[1]}</button>`}).join('')}</nav>`;
 window.scrollTo(0,0)}
 
/* EVENTOS */
function sheet(h){$('#modal').innerHTML=`<div class="ov" id="ov"><div class="sheet">${h}</div></div>`;$('#ov').onclick=e=>{if(e.target.id==='ov')$('#modal').innerHTML=''}}
const close=()=>$('#modal').innerHTML='';
function formTx(){const today=new Date().toISOString().slice(0,10);let ty='out';
 sheet(`<h3>Nova transação</h3><div class="seg"><button data-ty="out" class="on">Despesa</button><button data-ty="in">Receita</button></div>
 <label class="field"><input id="fd" placeholder="Descrição (ex.: Mercado)"></label>
 <label class="field"><input id="fv" inputmode="decimal" placeholder="Valor (ex.: 150,00)"></label>
 <label class="field"><select id="fc">${Object.keys(CATS).map(c=>`<option>${c}</option>`).join('')}</select></label>
 <label class="field"><input id="fdt" type="date" value="${today}"></label><div class="err" id="fe"></div><button class="btn" id="fs">Salvar transação</button>`);
 document.querySelectorAll('[data-ty]').forEach(b=>b.onclick=()=>{ty=b.dataset.ty;document.querySelectorAll('[data-ty]').forEach(x=>x.classList.toggle('on',x===b));$('#fc').innerHTML=(ty==='in'?['Salário','Receita']:Object.keys(CATS)).map(c=>`<option>${c}</option>`).join('')});
 $('#fs').onclick=()=>{const v=num($('#fv').value),d=$('#fd').value.trim();if(!d||!(v>0)){$('#fe').textContent='Preencha a descrição e um valor maior que zero.';return}
  D.tx.push({id:D.nid++,date:$('#fdt').value||today,desc:d,cat:$('#fc').value,type:ty,val:v});save();close();render();toast('Transação salva')}}
const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
function simple(title,fields,cb){sheet(`<h3>${title}</h3>${fields.map((f,i)=>`<label class="field">${f[1]==='sel'?`<select id="s${i}">${f[2].map(o=>`<option>${o}</option>`).join('')}</select>`:`<input id="s${i}" placeholder="${f[0]}" ${f[1]==='n'?'inputmode="decimal"':''}>`}</label>`).join('')}<div class="err" id="se"></div><button class="btn" id="ss">Salvar</button>`);
 $('#ss').onclick=()=>{const vals=fields.map((f,i)=>{const v=$('#s'+i).value.trim();return f[1]==='n'?num(v):v});if(vals.some((v,i)=>fields[i][1]==='n'?!(v>0):!v)){$('#se').textContent='Preencha todos os campos com valores válidos.';return}cb(vals);save();close();render()}}
document.addEventListener('click',e=>{if(!S)return;const t=e.target.closest('button,a,[data-go]');if(!t)return;
 if(t.dataset.go){view=t.dataset.go;render();return}
 if('add' in t.dataset){formTx();return}
 if(t.dataset.del){D.tx=D.tx.filter(x=>x.id!=t.dataset.del);save();render();toast('Transação excluída');return}
 if(t.id==='eye'){hidden=!hidden;render();return}
 if('n' in t.dataset){toast('Nenhuma notificação nova');return}
 if('addinv' in t.dataset){simple('Novo aporte',[['','sel',D.inv.map(i=>i.n)],['Valor (ex.: 500,00)','n']],v=>{D.inv.find(i=>i.n===v[0]).v+=v[1];toast('Aporte registrado')});return}
 if('addgoal' in t.dataset){simple('Nova meta',[['Nome da meta','t'],['Valor da meta (ex.: 5000)','n']],v=>{D.goals.push({n:v[0],t:v[1],c:0})});return}
 if(t.dataset.dep){const g=D.goals[t.dataset.dep];simple('Guardar em '+esc(g.n),[['Valor (ex.: 200,00)','n']],v=>{g.c+=v[0];toast('Valor guardado')});return}
 if(t.dataset.delg){D.goals.splice(t.dataset.delg,1);save();render();return}
 if(t.dataset.bud){const k=t.dataset.bud;simple('Limite de '+k,[['Valor mensal (ex.: 800)','n']],v=>{D.bud=D.bud||{};D.bud[k]=v[0]});return}
 if(t.id==='out'){fecharDashboard();return}
 if(t.id==='reset'){D=seed();save();render();toast('Painel zerado');return}
 if(t.id==='wipe'){D={tx:[],nid:1,inv:D.inv.map(i=>({n:i.n,v:0})),goals:[]};save();render();toast('Dados apagados');return}
});
window.abrirDashboard=abrirDashboard;
window.fecharDashboard=fecharDashboard;
})();
 
