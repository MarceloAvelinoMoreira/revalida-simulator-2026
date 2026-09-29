(function(){
// Injeta o HTML do modal dentro do overlay placeholder
var overlay = document.getElementById('review-overlay');
if (!overlay) return;
overlay.innerHTML = `
<div id="review-modal" style="max-width:820px;margin:40px auto 60px;background:#0b1220;border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.6);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 28px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:#0b1220;z-index:10;">
    <div>
      <div style="font-family:monospace;font-size:10px;color:#3b82f6;text-transform:uppercase;letter-spacing:.15em;margin-bottom:4px;">Simulado · Revisão</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#e8edf5;">Gabarito Comentado</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="display:flex;gap:6px;">
        <button onclick="rvFilter('all')" id="rvf-all" style="font-family:monospace;font-size:10px;padding:5px 12px;border-radius:20px;border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.15);color:#60a5fa;cursor:pointer;">Todas</button>
        <button onclick="rvFilter('wrong')" id="rvf-wrong" style="font-family:monospace;font-size:10px;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#8a9ab5;cursor:pointer;">Erradas</button>
        <button onclick="rvFilter('correct')" id="rvf-correct" style="font-family:monospace;font-size:10px;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#8a9ab5;cursor:pointer;">Corretas</button>
        <button onclick="rvFilter('skipped')" id="rvf-skipped" style="font-family:monospace;font-size:10px;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#8a9ab5;cursor:pointer;">Puladas</button>
      </div>
      <button onclick="closeReview()" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#8a9ab5;cursor:pointer;font-size:16px;line-height:1;flex-shrink:0;">✕</button>
    </div>
  </div>
  <div style="display:flex;border-bottom:1px solid rgba(255,255,255,.08);">
    <div style="flex:1;padding:16px 0;text-align:center;border-right:1px solid rgba(255,255,255,.06);"><div id="rv-s-correct" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#22c55e;">0</div><div style="font-family:monospace;font-size:9px;color:#4a5a72;text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Corretas</div></div>
    <div style="flex:1;padding:16px 0;text-align:center;border-right:1px solid rgba(255,255,255,.06);"><div id="rv-s-wrong" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#e74c3c;">0</div><div style="font-family:monospace;font-size:9px;color:#4a5a72;text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Erradas</div></div>
    <div style="flex:1;padding:16px 0;text-align:center;border-right:1px solid rgba(255,255,255,.06);"><div id="rv-s-skipped" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#f59e0b;">0</div><div style="font-family:monospace;font-size:9px;color:#4a5a72;text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Puladas</div></div>
    <div style="flex:1;padding:16px 0;text-align:center;"><div id="rv-s-annulled" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#8b949e;">0</div><div style="font-family:monospace;font-size:9px;color:#4a5a72;text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Anuladas</div></div>
  </div>
  <div id="rv-list" style="padding:8px 0;"></div>
</div>`;

overlay.addEventListener('click', function(e){ if(e.target===this) closeReview(); });
})();
// ══════════ REVIEW MODAL LOGIC ══════════
window.openReview = function(){
  buildReviewList('all');
  document.getElementById('review-overlay').style.display='block';
  document.body.style.overflow='hidden';
};
window.closeReview = function(){
  document.getElementById('review-overlay').style.display='none';
  document.body.style.overflow='';
};
window.rvFilter = function(f){
  ['all','wrong','correct','skipped'].forEach(function(k){
    var btn=document.getElementById('rvf-'+k);
    if(!btn)return;
    if(k===f){btn.style.background='rgba(59,130,246,.15)';btn.style.color='#60a5fa';btn.style.borderColor='rgba(59,130,246,.3)';}
    else{btn.style.background='transparent';btn.style.color='#8a9ab5';btn.style.borderColor='rgba(255,255,255,.08)';}
  });
  buildReviewList(f);
};
function buildReviewList(filter){
  var list=document.getElementById('rv-list');
  if(!list)return;
  list.innerHTML='';
  if(typeof questions==="undefined"||!questions||!questions.length||typeof questionStatus==="undefined"||!questionStatus){
    list.innerHTML='<div style="padding:40px;text-align:center;font-family:monospace;font-size:12px;color:#4a5a72;">Nenhuma questão respondida ainda.</div>';
    return;
  }
  var letters=['A','B','C','D'];
  var nc=0,nw=0,ns=0,na=0;
  questions.forEach(function(q,i){
    var st=questionStatus[i];
    if(st==='correct')nc++;else if(st==='wrong')nw++;else if(st==='skipped')ns++;else if(st==='annulled')na++;
  });
  var sc=document.getElementById('rv-s-correct');var sw=document.getElementById('rv-s-wrong');
  var ss=document.getElementById('rv-s-skipped');var sa=document.getElementById('rv-s-annulled');
  if(sc)sc.textContent=nc;if(sw)sw.textContent=nw;if(ss)ss.textContent=ns;if(sa)sa.textContent=na;
  var shown=0;
  questions.forEach(function(q,i){
    var st=questionStatus[i]||'skipped';
    if(filter!=='all'&&st!==filter)return;
    shown++;
    var isAnn=q.answer==='Anulada'||q.answer==='X';
    var ua=window.userAnswers?(userAnswers[i]||null):null;
    var badgeChar=st==='correct'?'✓':st==='wrong'?'✗':st==='annulled'?'–':'?';
    var optsHtml='';
    if(q.opts){q.opts.forEach(function(opt,oi){
      var ltr=letters[oi];var cls='';
      if(!isAnn&&ltr===q.answer)cls='correct-ans';
      else if(ltr===ua&&ua!==q.answer&&!isAnn)cls='user-wrong';
      optsHtml+='<div class="rv-opt '+cls+'"><span class="rv-opt-letter">'+ltr+'</span><span class="rv-opt-text">'+opt+'</span></div>';
    });}
    var pillsHtml='';
    if(isAnn){pillsHtml='<span class="rv-answer-pill neutral">⚠️ Questão Anulada</span>';}
    else{
      pillsHtml='<span class="rv-answer-pill correct">✓ Gabarito: '+q.answer+'</span>';
      if(ua)pillsHtml+='<span class="rv-answer-pill '+(ua===q.answer?'correct':'wrong')+'">'+(ua===q.answer?'✓':'✗')+' Sua resposta: '+ua+'</span>';
      else pillsHtml+='<span class="rv-answer-pill neutral">— Não respondida</span>';
    }
    var item=document.createElement('div');
    item.className='rv-item';item.dataset.idx=i;
    var shortText=q.text.length>160?q.text.slice(0,157)+'…':q.text;
    item.innerHTML='<div class="rv-item-head" onclick="rvToggle('+i+')">'
      +'<div class="rv-badge '+st+'">'+badgeChar+'</div>'
      +'<div class="rv-qnum">Q '+q.n+'<br><span style="font-size:8px;color:#4a5a72;">'+(q.year||'')+'</span></div>'
      +'<div class="rv-qtext">'+shortText+'</div>'
      +'<span class="rv-chevron">›</span>'
      +'</div>'
      +'<div class="rv-detail">'
        +'<div class="rv-answers-row">'+pillsHtml+'</div>'
        +'<div class="rv-options">'+optsHtml+'</div>'
        +'<button class="rv-justify-btn" id="rv-jbtn-'+i+'" onclick="rvJustify('+i+')">✦ Ver justificativa</button>'
        +'<div class="rv-ai-box" id="rv-ai-'+i+'"></div>'
      +'</div>';
    list.appendChild(item);
  });
  if(shown===0){list.innerHTML='<div style="padding:40px;text-align:center;font-family:monospace;font-size:12px;color:#4a5a72;">Nenhuma questão nesta categoria.</div>';}
}
window.rvToggle=function(i){
  var item=document.querySelector('.rv-item[data-idx="'+i+'"]');
  if(item)item.classList.toggle('open');
};
window.rvJustify=async function(i){
  var q=questions[i];if(!q)return;
  var btn=document.getElementById('rv-jbtn-'+i);
  var box=document.getElementById('rv-ai-'+i);
  if(box.classList.contains('show')&&box.textContent.trim()){
    box.classList.remove('show');
    btn.innerHTML='✦ Ver justificativa';
    return;
  }
  btn.classList.add('loading');
  btn.innerHTML='⏳ Carregando...';
  box.className='rv-ai-box show';
  box.textContent='';
  try{
    var resolved = await QuestionEoResolver.resolve(q.id);
    var view = resolved.view || {};
    var parts = [];
    if(view.takeHome) parts.push('Mensagem final:\n'+view.takeHome);
    if(view.correctRationale) parts.push('Justificativa:\n'+view.correctRationale);
    if(view.comment) parts.push('Comentário:\n'+view.comment);
    if(view.hasMnemonic && view.mnemonic) parts.push('Macete:\n'+view.mnemonic);
    box.textContent = parts.length ? parts.join('\n\n') : (q.explanation || 'Justificativa indisponível.');
    btn.innerHTML='✦ Ocultar justificativa';
    btn.classList.remove('loading');
  }catch(e){
    box.textContent = q.explanation || 'Não foi possível carregar a justificativa educacional.';
    btn.innerHTML='✦ Ver justificativa';
    btn.classList.remove('loading');
  }
};
