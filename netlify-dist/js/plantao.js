'use strict';
const Plantao = (() => {
  const key = 'revalidda.plantao.v1';
  // Stethoscope, footprints and shield-check: Lucide (ISC).
  // Local SVG shapes only; see assets/licenses/lucide.txt.
  // Scalpel and heart/female mark are custom, on the same 24px / 2px grid.
  const sectors = [
    {id:'clinica',name:'Clínica Médica',label:'Enfermaria',numbers:[1,2,3],icon:'<path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>'},
    {id:'cirurgia',name:'Cirurgia',label:'Centro cirúrgico',numbers:[34,35,36],icon:'<path d="m3 21 9-9m-2-2 4 4M12 12l1-5 6-5 3 3-5 6-5 1Z"/><path d="m15 6 3 3"/>'},
    {id:'go',name:'Ginecologia e Obstetrícia',label:'Saúde da mulher',numbers:[53,54,55],icon:'<path d="M12 15 4.5 8A4 4 0 0 1 10 2.5L12 4l2-1.5A4 4 0 0 1 19.5 8L12 15Z"/><path d="M12 15v7m-3-3h6"/>'},
    {id:'pediatria',name:'Pediatria',label:'Ala pediátrica',numbers:[75,76,77],icon:'<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0ZM20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0ZM16 17h4M4 13h4"/>'},
    {id:'preventiva',name:'Medicina Preventiva',label:'Saúde coletiva',numbers:[90,91,92],icon:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'}
  ];
  const bank = EXAMS['tpi-2026-2-tpi2'].questions;
  const questions = new Map(sectors.flatMap(s=>s.numbers.map(n=>{const q=bank.find(q=>q.n===n);return [q.id,{...q,sector:s.id}];})));
  const reasons=['','Conteúdo','Interpretação','Desatenção','Tempo','Outro'];
  function empty(){return {version:1,answers:{},session:null,notebook:{}};}
  function normalize(raw){
    const s=empty();if(!raw||raw.version!==1)return s;
    for(const [id,r] of Object.entries(raw.answers||{})){
      if(questions.has(id)&&r&&/^[A-D]$/.test(r.answer)&&Number.isInteger(r.xp)&&[5,20].includes(r.xp))s.answers[id]={answer:r.answer,xp:r.xp};
    }
    for(const [id,r] of Object.entries(raw.notebook||{})){
      if(!questions.has(id)||!s.answers[id]||!r||typeof r!=='object')continue;
      const events=Array.isArray(r.events)?r.events.filter(e=>e&&/^[A-D]$/.test(e.answer)&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))).map(e=>({answer:e.answer,at:new Date(e.at).toISOString()})):[];
      s.notebook[id]={note:typeof r.note==='string'?r.note.slice(0,3000):'',reason:reasons.includes(r.reason)?r.reason:'',events,legacy:r.legacy===true};
    }
    // Only the last answer and first-answer XP existed before the notebook.
    // Preserve that evidence without inventing a date, count, or earlier alternative.
    for(const [id,r] of Object.entries(s.answers))if(!s.notebook[id]&&(r.answer!==questions.get(id).answer||r.xp===5))s.notebook[id]={note:'',reason:'',events:[],legacy:true};
    const x=raw.session;
    if(x&&Array.isArray(x.ids)&&x.ids.length>0&&x.ids.length<=3&&new Set(x.ids).size===x.ids.length&&x.ids.every(id=>questions.has(id))&&Number.isInteger(x.index)&&x.index>=0&&x.index<x.ids.length){
      s.session={ids:x.ids,index:x.index,answers:{},origin:x.origin==='notebook'?'notebook':'hospital'};
      for(const id of x.ids)if(/^[A-D]$/.test(x.answers?.[id]||''))s.session.answers[id]=x.answers[id];
      for(let i=0;i<x.index;i++)if(!s.session.answers[x.ids[i]]){s.session.index=i;break;}
    }return s;
  }
  let state=empty(),blocked=false;
  try{state=normalize(JSON.parse(localStorage.getItem(key)));}catch(_){blocked=true;}
  function persist(){try{localStorage.setItem(key,JSON.stringify(state));blocked=false;return true;}catch(_){blocked=true;return false;}}
  function snapshot(){return JSON.parse(JSON.stringify(state));}
  function stats(){
    const records=Object.entries(state.answers),xp=records.reduce((n,[,r])=>n+r.xp,0);
    const correct=records.filter(([id,r])=>questions.get(id).answer===r.answer).length;
    return {xp,answered:records.length,correct,errors:records.filter(([id,r])=>questions.get(id).answer!==r.answer).map(([id])=>id),areas:new Set(records.map(([id])=>questions.get(id).sector)).size};
  }
  function start(ids,origin='hospital'){if(!ids.length||ids.length>3||!ids.every(id=>questions.has(id)))return;state.session={ids:[...new Set(ids)],index:0,answers:{},origin:origin==='notebook'?'notebook':'hospital'};persist();}
  function answer(letter){
    const session=state.session;if(!session||!/^[A-D]$/.test(letter))return null;
    const id=session.ids[session.index],q=questions.get(id);if(session.answers[id])return null;
    session.answers[id]=letter;const first=!state.answers[id],correct=letter===q.answer;
    state.answers[id]={answer:letter,xp:state.answers[id]?.xp||(correct?20:5)};
    if(!correct&&!state.notebook[id])state.notebook[id]={note:'',reason:'',events:[],legacy:false};
    if(state.notebook[id])state.notebook[id].events.push({answer:letter,at:new Date().toISOString()});
    persist();
    return {correct,earned:first?(correct?20:5):0};
  }
  function next(){if(!state.session||!state.session.answers[state.session.ids[state.session.index]])return false;
    if(state.session.index===state.session.ids.length-1){state.session=null;persist();return true;}state.session.index++;persist();return false;
  }
  const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function notebook(filter={}){
    return Object.entries(state.notebook).map(([id,r])=>({id,...JSON.parse(JSON.stringify(r)),question:questions.get(id),lastAnswer:state.answers[id].answer,status:state.answers[id].answer===questions.get(id).answer?'reviewed':'pending'}))
      .filter(r=>(!filter.area||r.question.sector===filter.area)&&(!filter.status||r.status===filter.status)&&(!filter.query||fold(r.question.text+' '+r.question.commentTopic+' '+r.note).includes(fold(filter.query))))
      .sort((a,b)=>{if(a.status!==b.status)return a.status==='pending'?-1:1;return (b.events.at(-1)?.at||'').localeCompare(a.events.at(-1)?.at||'');});
  }
  function annotate(id,note,reason){
    if(!state.notebook[id]||typeof note!=='string'||note.length>3000||!reasons.includes(reason))return false;
    state.notebook[id].note=note;state.notebook[id].reason=reason;return persist();
  }
  return {key,sectors,questions,snapshot,stats,start,answer,next,notebook,annotate,reasons,blocked:()=>blocked};
})();

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);
  const screens=['hospital','errors','achievements','game','finished'];
  function show(view){
    $('plantao-main').setAttribute('data-view',view);
    for(const id of screens)$(id).hidden=id!==view;
    document.querySelectorAll('button[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    refresh();
    if(view==='errors'){$('errors').focus();$('errors').scrollIntoView?.({block:'start'});}
  }
  function refresh(){
    const s=Plantao.stats(),session=Plantao.snapshot().session;
    const target=s.xp<100?100:s.xp<200?200:300;
    $('xp').textContent=s.xp+' / '+target+' XP';$('rank').textContent=s.xp>=200?'Residente':s.xp>=100?'Interno':'Acadêmico';
    $('level').max=target;$('level').value=s.xp;$('level').setAttribute('aria-valuetext',s.xp+' de '+target+' XP acumulados');
    $('career-summary').textContent=s.answered?s.answered+'/15 casos respondidos · '+s.correct+(s.correct===1?' acerto':' acertos')+' na última resposta.':'Nenhuma questão respondida ainda.';
    $('next-rank').textContent=s.xp<100?(100-s.xp)+' XP para Interno':s.xp<200?(200-s.xp)+' XP para Residente':'Residente · continue revisando seus casos';
    $('hospital-progress').textContent=s.answered+'/15';
    $('guide-text').textContent=s.errors.length?'Você tem '+s.errors.length+' caso(s) no caderno de erros. Revise o comentário, tente novamente e use seus erros para direcionar o próximo estudo.':s.answered?'Você já respondeu '+s.answered+' dos 15 casos. Explore outra área para ampliar sua revisão.':'Escolha uma ala do hospital e responda três casos. Leia os comentários após cada resposta e volte ao hospital quando quiser mudar de área.';
    $('error-count').textContent=s.errors.length;$('resume').hidden=!session;
    $('storage-warning').hidden=!Plantao.blocked();$('storage-warning').textContent='Não foi possível salvar neste navegador. O jogo continua nesta aba; permita o armazenamento local para manter seu progresso.';
    const records=Plantao.snapshot().answers;
    $('departments').replaceChildren(...Plantao.sectors.map(sector=>{
      const b=document.createElement('button');b.type='button';b.className='department';
      const count=sector.numbers.filter(n=>records['tpi-2026-2-tpi2-'+String(n).padStart(3,'0')]).length;
      b.style.setProperty('--sector',({clinica:'#00f2fe',cirurgia:'#ff5252',go:'#e040fb',pediatria:'#ffd740',preventiva:'#00e676'})[sector.id]);
      b.setAttribute('data-sector',sector.id);
      if(count>0&&count<3)b.classList.add('in-progress');
      if(count===3)b.classList.add('complete');
      b.setAttribute('aria-label',sector.name+', '+count+' de 3 casos respondidos. '+(count===3?'Setor concluído. Revisar setor':'Iniciar plantão'));
      b.innerHTML='<span class="sector-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+sector.icon+'</svg><span class="sector-icon-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12 4 4 8-8"/></svg></span></span><span class="room-content"><strong>'+sector.name+'</strong><small>'+sector.label+'</small><span class="room-state">'+(count===3?'Concluída · revisar':count?'Em andamento':'Disponível para estudar')+'</span><span class="room-meta"><span>'+count+'/3 respondidos</span><span>'+(count===3?'Revisar setor':'Entrar na ala')+'</span></span><span class="room-dots" aria-hidden="true">'+[0,1,2].map(i=>'<i class="'+(i<count?'done':'')+'"></i>').join('')+'</span></span><span class="door" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>';
      b.onclick=()=>{Plantao.start(sector.numbers.map(n=>'tpi-2026-2-tpi2-'+String(n).padStart(3,'0')));show('game');renderCase();$('game').focus();};return b;
    }));
    renderNotebook();
    $('badges').replaceChildren(...[['Primeiro atendimento','Responda seu primeiro caso.',s.answered>=1],['Hospital em movimento','Responda ao menos um caso nas cinco áreas.',s.areas===5],['Plantão completo','Responda os 15 casos do piloto.',s.answered===15]].map(([name,desc,earned])=>{const li=document.createElement('li'),strong=document.createElement('strong'),small=document.createElement('span');li.className=earned?'earned':'';strong.textContent=(earned?'Conquistada · ':'A conquistar · ')+name;small.textContent=desc;li.append(strong,small);return li;}));
  }
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function notebookFilter(){return {area:$('notebook-area').value||'',status:$('notebook-status').value||'',query:$('notebook-search').value||''};}
  function beginReview(ids){if(!ids.length)return;Plantao.start(ids,'notebook');show('game');renderCase();$('game').focus();}
  function renderNotebook(){
    const all=Plantao.notebook(),pending=all.filter(r=>r.status==='pending'),list=Plantao.notebook(notebookFilter());
    $('notebook-summary').textContent=all.length+(all.length===1?' questão no histórico':' questões no histórico')+' · '+pending.length+' para revisar · '+(all.length-pending.length)+' revisadas com acerto';
    $('notebook-results').textContent=list.length+(list.length===1?' questão encontrada':' questões encontradas');
    const reviewable=list.filter(r=>r.status==='pending');
    $('review-errors').disabled=!reviewable.length;
    $('review-errors').textContent=reviewable.length?'Revisar '+Math.min(3,reviewable.length)+(reviewable.length===1?' questão pendente':' questões pendentes'):'Nenhuma questão pendente neste filtro';
    $('error-list').replaceChildren();
    if(!list.length){$('error-list').textContent=all.length?'Nenhuma questão corresponde aos filtros. Tente outra área, situação ou busca.':'Seu caderno está vazio. Ao errar no Plantão, o caso será guardado aqui com seu histórico de revisão.';return;}
    for(const record of list){
      const q=record.question,sector=Plantao.sectors.find(s=>s.id===q.sector),article=el('article','notebook-entry'),header=el('div','notebook-entry-header'),title=el('h3','',q.commentTopic.split(' › ').pop()),status=el('span','notebook-status '+record.status,record.status==='pending'?'Para revisar':'Revisada com acerto');
      header.append(title,status);article.append(header,el('p','notebook-source',sector.name+' · TPI 2 · Questão '+q.n));
      const last=record.events.at(-1);
      article.append(el('p','notebook-history',last?'Última tentativa: '+new Date(last.at).toLocaleString('pt-BR'):'Registro anterior: data e tentativas não estavam disponíveis.'));
      const read=el('details','notebook-read'),summary=el('summary','','Consultar questão, gabarito e comentário');
      read.append(summary,el('p','notebook-statement',q.text));
      if(q.image){const image=el('img','notebook-image');image.src=q.image;image.alt='Figura original da questão '+q.n;image.loading='lazy';read.append(image);}
      const alternatives=el('ol','notebook-alternatives');alternatives.type='A';
      q.opts.forEach((text,i)=>{const letter=String.fromCharCode(65+i);alternatives.append(el('li',letter===q.answer?'notebook-answer':'',text+(letter===q.answer?' — resposta correta do material':'')));});
      read.append(alternatives,el('p','', 'Sua última resposta: '+record.lastAnswer+' · Gabarito do material: '+q.answer+'.'),el('h4','','Comentário do material'),el('p','notebook-comment',q.officialComment));
      const history=el('details','notebook-attempts');history.append(el('summary','','Histórico de tentativas registradas ('+record.events.length+')'));
      if(record.legacy)history.append(el('p','','Há registro anterior de erro, mas o aplicativo antigo não guardava a sequência de tentativas.'));
      const attempts=el('ol','');for(const event of record.events.slice(-10).reverse())attempts.append(el('li','',new Date(event.at).toLocaleString('pt-BR')+' · '+event.answer+' · '+(event.answer===q.answer?'Acerto':'Erro')));
      if(record.events.length>10)history.append(el('p','','Exibindo as 10 tentativas mais recentes; o restante permanece salvo.'));
      history.append(attempts);read.append(history);article.append(read);
      const form=el('form','notebook-notes'),reasonLabel=el('label','','Por que errei?'),reason=el('select',''),noteLabel=el('label','','O que preciso lembrar?'),note=el('textarea',''),save=el('button','subtle','Salvar anotação'),message=el('p','notebook-save');
      reason.id='reason-'+q.id;reasonLabel.htmlFor=reason.id;for(const value of Plantao.reasons){const opt=el('option','',value||'Ainda não identifiquei');opt.value=value;reason.append(opt);}reason.value=record.reason;
      note.id='note-'+q.id;noteLabel.htmlFor=note.id;note.value=record.note;note.maxLength=3000;note.rows=3;note.placeholder='Registre a pista que você deixou passar e como evitar o erro.';
      save.type='submit';message.setAttribute('role','status');form.append(reasonLabel,reason,noteLabel,note,save,message);
      form.onsubmit=event=>{event.preventDefault();const saved=Plantao.annotate(q.id,note.value,reason.value);message.textContent=saved?'Anotação salva neste navegador.':'Não foi possível salvar. Copie sua anotação antes de sair e permita o armazenamento local.';$('storage-warning').hidden=!Plantao.blocked();};
      form.oninput=()=>{const saved=Plantao.annotate(q.id,note.value,reason.value);message.textContent=saved?'Anotação salva automaticamente.':'Não foi possível salvar. Copie sua anotação antes de sair.';$('storage-warning').hidden=!Plantao.blocked();};
      const retry=el('button','primary',record.status==='pending'?'Resolver novamente':'Testar novamente');retry.type='button';retry.onclick=()=>beginReview([q.id]);
      article.append(form,retry);$('error-list').append(article);
    }
  }
  function renderCase(){
    const session=Plantao.snapshot().session;if(!session){show('hospital');return;}
    const q=Plantao.questions.get(session.ids[session.index]),picked=session.answers[q.id],sector=Plantao.sectors.find(s=>s.id===q.sector);
    $('pause').textContent=session.origin==='notebook'?'← Caderno de erros':'← Hospital';
    $('case-progress').max=session.ids.length;$('case-progress').value=Object.keys(session.answers).length;
    $('case-title').textContent=sector.name;$('case-position').textContent='Caso '+(session.index+1)+' de '+session.ids.length;
    $('case-wing').textContent=sector.label;
    $('case-source').textContent='TPI 2026.2 — TPI 2 · Questão '+q.n;
    $('case-text').textContent=q.text;$('case-image').hidden=!q.image;$('image-open').hidden=!q.image;
    if(q.image){$('case-image').src=q.image;$('case-image').alt='Figura original da questão '+q.n;}
    $('options').replaceChildren(...q.opts.map((text,i)=>{const letter=String.fromCharCode(65+i),b=document.createElement('button');b.type='button';b.textContent=letter+' · '+text;b.disabled=!!picked;
      if(picked&&letter===q.answer)b.className='right';else if(picked===letter)b.className='wrong';
      b.onclick=()=>{const result=Plantao.answer(letter);renderCase();if(result){const badge=document.createElement('span');badge.className='xp-reward';badge.textContent=result.earned?'+'+result.earned+' XP':'Revisão · sem XP adicional';$('feedback').append(badge);}refresh();};return b;}));
    $('feedback').textContent=picked?(picked===q.answer?'Resposta correta.':'Resposta incorreta. Gabarito do material: '+q.answer+'. Caso salvo no caderno de erros.'):'';
    $('feedback').className=picked?(picked===q.answer?'correct':'incorrect'):'';
    $('comment').hidden=!picked;$('comment').open=!!picked;$('comment-text').textContent=q.officialComment;
    $('next').hidden=!picked;$('next').textContent=session.index===session.ids.length-1?'Concluir plantão':'Próximo caso';
  }
  document.querySelectorAll('button[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
  for(const id of ['notebook-area','notebook-status'])$(id).onchange=renderNotebook;
  $('notebook-search').oninput=renderNotebook;
  $('review-errors').onclick=()=>beginReview(Plantao.notebook(notebookFilter()).filter(r=>r.status==='pending').slice(0,3).map(r=>r.id));
  $('notebook-clear').onclick=()=>{$('notebook-area').value='';$('notebook-status').value='';$('notebook-search').value='';renderNotebook();};
  function toggleGuide(open){$('guide-panel').hidden=!open;$('brain-guide').setAttribute('aria-expanded',String(open));}
  $('brain-guide').onclick=()=>toggleGuide($('guide-panel').hidden);
  $('guide-close').onclick=()=>{toggleGuide(false);$('brain-guide').focus();};
  $('image-open').onclick=()=>{if($('case-image').hidden)return;$('zoom-image').src=$('case-image').src;$('zoom-image').alt=$('case-image').alt+' — ampliada';$('image-zoom').showModal();};
  $('image-close').onclick=()=>$('image-zoom').close();
  $('image-zoom').addEventListener('close',()=>$('image-open').focus());
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('guide-panel').hidden){toggleGuide(false);$('brain-guide').focus();}});
  $('resume').onclick=()=>{show('game');renderCase();$('game').focus();};
  $('resume').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg><span>Retomar plantão em andamento</span>';
  $('pause').onclick=()=>show(Plantao.snapshot().session?.origin==='notebook'?'errors':'hospital');$('back').onclick=()=>show('hospital');
  $('next').onclick=()=>{const session=Plantao.snapshot().session;
    const correct=session.ids.filter(id=>session.answers[id]===Plantao.questions.get(id).answer).length;
    if(Plantao.next()){$('finished-summary').textContent=correct+' de '+session.ids.length+' casos corretos nesta sessão. '+(session.origin==='notebook'?'Seu histórico de erros continua salvo, inclusive os casos revisados com acerto.':'Revise os comentários e volte para outro setor.');$('back').textContent=session.origin==='notebook'?'Voltar ao caderno':'Voltar ao hospital';$('back').onclick=()=>show(session.origin==='notebook'?'errors':'hospital');show('finished');$('finished').focus();}else{renderCase();$('game').focus();}
  };
  window.addEventListener('storage',event=>{if(event.key===Plantao.key)location.reload();});
  show('hospital');
}
