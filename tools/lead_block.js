/* ===== Заявка: общий диалог с контекстом (кейс / пакет) ===== */
let attached='',leadCtx=null,lastLeadKey='';
const LEAD_DEFAULT={taskLabel:'Что зритель должен понять или сделать?',taskHint:'Например, понять, чем наша технология отличается от аналогов',placeLabel:'Город, площадка и желаемая дата',placeHint:'Например, съёмка в цехе к отраслевой выставке',format:'Другой проект'};
function buildBrief(){
  const L=[studioLine(),'Запрос предложения: '+$('#req-format').value];
  if(leadCtx){
    const isPkg=leadCtx.kind==='package';
    L.push([(isPkg?'Выбранный пакет: «':'Выбранная работа: «')+leadCtx.title+'»'+(leadCtx.detail?' — '+leadCtx.detail:''),'Тип проекта: '+leadCtx.type,'ID: '+leadCtx.id].join('\n'));
  }
  L.push('Задача: '+($('#req-task').value||'уточнить'),'Место и сроки: '+($('#req-place').value||'уточнить'),'Контакт: '+($('#req-contact').value||'не указан'),attached);
  return L.filter(Boolean).join('\n\n');
}
const leadDlg=$('#lead-dialog');
function setAttachment(text){attached=text||'';$('#attach-text').textContent=attached;$('#attachment').hidden=!attached}
function openLead(o){
  o=o||{};
  leadCtx=o.ctx||null;
  const key=leadCtx?leadCtx.id:'general';
  if(key!==lastLeadKey){$('#req-task').value='';$('#req-place').value=''}
  lastLeadKey=key;
  const c=leadCtx||{};
  const sel=$('#lead-selected'),q=$('#lead-question');
  sel.hidden=!leadCtx;
  if(leadCtx){
    $('#lead-selected-kind').textContent=leadCtx.kind==='package'?'Вы выбрали пакет':'Вы выбрали работу';
    $('#lead-selected-title').textContent='«'+leadCtx.title+'»';
  }
  q.hidden=!c.question;q.textContent=c.question||'';
  $('#lead-title').textContent=leadCtx?(leadCtx.kind==='package'?'Обсудим этот пакет':'Обсудим ваш проект'):'Расскажите о задаче';
  $('#req-task-label').textContent=c.taskLabel||LEAD_DEFAULT.taskLabel;
  $('#req-task').placeholder=c.taskHint||LEAD_DEFAULT.taskHint;
  $('#req-place-label').textContent=c.placeLabel||LEAD_DEFAULT.placeLabel;
  $('#req-place').placeholder=c.placeHint||LEAD_DEFAULT.placeHint;
  const fmt=o.format||c.format||LEAD_DEFAULT.format;
  const sf=$('#req-format');if([...sf.options].some(x=>x.value===fmt||x.text===fmt))sf.value=fmt;
  setAttachment(o.attach);
  if(!leadDlg.open){
    if(typeof leadDlg.showModal==='function')leadDlg.showModal();else leadDlg.setAttribute('open','');
    document.documentElement.classList.add('lead-open');
  }
}
function closeLead(){
  if(typeof leadDlg.close==='function'&&leadDlg.open)leadDlg.close();else leadDlg.removeAttribute('open');
  onLeadClosed();
}
function onLeadClosed(){
  document.documentElement.classList.remove('lead-open');
  leadCtx=null;attached='';$('#lead-selected').hidden=true;$('#lead-question').hidden=true;$('#attachment').hidden=true;
}
leadDlg.addEventListener('close',onLeadClosed);
leadDlg.addEventListener('click',e=>{if(e.target===leadDlg)closeLead()});
$('#lead-close').onclick=closeLead;
$('#lead-clear').onclick=()=>openLead({});
$('#detach').onclick=()=>setAttachment('');
function ctxFromButton(t){
  const d=t.dataset;
  if(d.leadCase)return{ctx:{kind:'case',id:d.leadCase,title:d.title,type:d.type,question:d.question,taskLabel:d.taskLabel,taskHint:d.taskHint,placeLabel:d.placeLabel,placeHint:d.placeHint,format:d.format}};
  if(d.leadPackage){
    let detail=d.detail||'';
    if(d.leadPackage==='expert'){const h=expertHoursSel;detail=h+' '+(h===1?'час':'часа')+' записи, '+money(expertPrices[h]);}
    return{ctx:{kind:'package',id:'pkg-'+d.leadPackage,title:d.title,type:'Подкаст / Shorts (готовый пакет)',detail,format:'Экспертный контент',question:'Вы выбрали пакет «'+d.title+'». Расскажите, о чём будет подкаст или серия видео и для кого.',taskLabel:'О чём подкаст или серия видео',taskHint:'Например: эксперт в своей нише, нужен регулярный выпуск',placeLabel:'Город и желаемая дата записи',placeHint:'Например: Новосибирск, в ближайшие две недели'}};
  }
  return{format:d.request};
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-lead],[data-lead-case],[data-lead-package],[data-request],[data-attach],a[href="#brief"]');
  if(!t)return;
  e.preventDefault();
  const o=ctxFromButton(t);
  if(t.dataset.attach){
    const isQuick=t.dataset.attach==='quick';
    if(isQuick?!quickItems.length:!currentEstimate.items.length){toast('Сначала выберите услуги');return}
    o.attach=isQuick?quickText():estimateText();
  }
  openLead(o);
});
$('#make-email').onclick=async()=>{
  const c=$('#req-contact').value.trim();
  if(!c){toast('Укажите контакт для ответа');$('#req-contact').focus();return}
  const text=buildBrief();const btn=$('#make-email');btn.disabled=true;
  const jobs=[];
  if(FORM.endpoint){jobs.push(fetch(FORM.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Заявка с сайта\n\n'+text})}).then(r=>r.ok))}
  if(FORM.web3formsKey){const fd=new FormData();fd.append('access_key',FORM.web3formsKey);fd.append('subject','VOLNA film — новая заявка'+(leadCtx?' · '+leadCtx.title:''));fd.append('from_name','Сайт VOLNA film');fd.append('message',text);jobs.push(fetch('https://api.web3forms.com/submit',{method:'POST',body:fd}).then(r=>r.json().then(j=>r.ok&&j.success!==false).catch(()=>r.ok)))}
  const res=await Promise.allSettled(jobs);
  const ok=res.some(r=>r.status==='fulfilled'&&r.value===true);
  btn.disabled=false;
  if(ok){toast('Заявка отправлена — продюсер свяжется с вами');$('#req-task').value='';$('#req-place').value='';lastLeadKey='';closeLead();return}
  try{await navigator.clipboard.writeText(text)}catch(e){}
  window.open(studio.tg+'?text='+encodeURIComponent(text),'_blank','noopener');
  toast('Не удалось отправить автоматически — открываем Telegram, текст скопирован');
};
$('#save-brief').onclick=()=>{let url=URL.createObjectURL(new Blob(['﻿'+buildBrief()],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='VOLNA-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)};

/* кнопка «Обсудить» в каждой карточке полного портфолио (контекст — только название и тип работы) */
$$('#workpage .caseunit').forEach(card=>{
  const stage=$('.video-stage',card),body=$('.casebody',card);if(!stage||!body||$('[data-lead-case]',card))return;
  const title=(stage.dataset.ytTitle||'').trim(),sec=card.closest('.vf-section')?.querySelector('h2')?.textContent.trim()||'Портфолио';
  const b=document.createElement('button');b.type='button';b.className='btn btn-outline case-ask';b.textContent='Хочу такой же проект';
  b.dataset.leadCase='vk-'+(stage.dataset.vk||title).replace(/[^0-9a-z_-]/gi,'');b.dataset.title=title;b.dataset.type=sec;b.dataset.format=/Реклама/.test(sec)?'Реклама':/событ/i.test(sec)?'Съёмка мероприятия':'Фильм';
  b.dataset.question='Вам понравилась работа «'+title+'». Расскажите, что хотите снять вы.';
  const w=document.createElement('div');w.className='case-actions';w.appendChild(b);body.appendChild(w);
});

/* число работ — из данных портфолио */
const worksN=$$('#workpage .video-stage').length;
const worksWord=n=>{const a=n%10,b=n%100;return a===1&&b!==11?'работа':a>=2&&a<=4&&(b<12||b>14)?'работы':'работ'};
if(worksN){
  $$('[data-works-count]').forEach(el=>el.textContent=worksN+' '+worksWord(worksN)+' в портфолио');
  $$('[data-works-link]').forEach(el=>el.textContent=(el.classList.contains('btn-accent')?'Все ':'Все ')+worksN+' '+worksWord(worksN)+' в портфолио '+(el.classList.contains('btn-accent')?'→':'↗'));
}
