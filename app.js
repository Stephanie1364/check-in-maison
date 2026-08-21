const SB_URL="https://itotjwvqhvdfmluzrjkd.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b3Rqd3ZxaHZkZm1sdXpyamtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTUwNTYsImV4cCI6MjEwMjYzMTA1Nn0.qSO_uBExBpo3Yt93Ps6bAcdfrTZJpi56RSIgQrETEGw";
const sb=window.supabase.createClient(SB_URL,SB_KEY);
const SHARE="https://stephanie1364.github.io/check-in-maison/voir.html";
const $=function(s){return document.querySelector(s);};
const $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s));};
const todayISO=function(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());};
const fmt=function(iso){if(!iso)return"";var p=iso.split("-");return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date(+p[0],+p[1]-1,+p[2]));};
const esc=function(s){
  return String(s||"").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,""").replace(/'/g,"&#39;");
};
function toast(m){var t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2200);}

function initNav(){
  $$("#nav button").forEach(function(b){
    b.addEventListener("click",function(e){
      e.preventDefault();
      $$("#nav button").forEach(function(x){x.classList.remove("active");});
      b.classList.add("active");
      $$(".panel").forEach(function(p){p.classList.remove("active");});
      var panel=$("#p-"+b.getAttribute("data-p"));
      if(panel) panel.classList.add("active");
    });
  });
}

function initSlider(){
  var satInput=$("input[name=saturation]");
  var satVal=$("#satVal");
  if(!satInput||!satVal) return;
  function sync(){satVal.textContent=satInput.value;}
  satInput.addEventListener("input",sync);
  satInput.addEventListener("change",sync);
}

function initChips(){
  var desire=$("#desireChips");
  if(desire) desire.addEventListener("click",function(e){
    var c=e.target.closest(".chip");
    if(!c) return;
    var ta=$("textarea[name=desires]");
    var t=c.getAttribute("data-t")||"";
    if(!ta.value.trim()) ta.value=t;
    else if(ta.value.indexOf(t.trim())===-1) ta.value=ta.value.trim()+"\n"+t;
    ta.focus();
  });
  var need=$("#needChips");
  if(need) need.addEventListener("click",function(e){
    var c=e.target.closest(".chip");
    if(!c) return;
    $$("#needChips .chip").forEach(function(x){x.classList.remove("active");});
    c.classList.add("active");
    var inp=$("input[name=need]");
    if(inp) inp.value=c.getAttribute("data-n")||"";
  });
}

async function loadCadre(){
  try{
    var res=await sb.from("maison_cadre").select("*").eq("id","current").maybeSingle();
    var data=res.data;
    if(!data) return;
    var td=$("#tagDenial");
    if(td){td.textContent=data.denial_active?("Déni · "+(data.denial_note||"actif")):"Déni · non";td.classList.toggle("on",!!data.denial_active);}
    var tn=$("#tagNeed");
    if(tn) tn.textContent=data.dominant_need?("Besoin · "+data.dominant_need):"Besoin · —";
    var tf=$("#tagFocus");
    if(tf){if(data.focus_order){tf.style.display="";tf.textContent="Focus · "+data.focus_order;}else{tf.style.display="none";}}
    var cd=$("#cadreDenial"); if(cd) cd.checked=!!data.denial_active;
    var cdn=$("#cadreDenialNote"); if(cdn) cdn.value=data.denial_note||"";
    var cn=$("#cadreNeed"); if(cn) cn.value=data.dominant_need||"";
    var cf=$("#cadreFocus"); if(cf) cf.value=data.focus_order||"";
  }catch(e){console.error(e);}
}

async function loadHistory(){
  var box=$("#historyList");
  if(!box) return;
  try{
    var res=await sb.from("maison_check_ins").select("*").order("created_at",{ascending:false}).limit(7);
    var data=res.data, error=res.error;
    if(error||!data||!data.length){box.className="empty";box.textContent=error?"Erreur":"Aucun check-in encore.";return;}
    box.className="";
    box.innerHTML=data.map(function(c){
      return '<article class="card"><div class="meta"><span class="date">'+fmt(c.date)+'</span><span class="sat2">sat '+c.saturation+'/10</span></div><div class="line"><strong>Corps</strong> · '+esc(c.body)+'</div><div class="line"><strong>Mental</strong> · '+esc(c.mental)+'</div>'+(c.need?'<div class="line"><strong>Besoin</strong> · '+esc(c.need)+'</div>':'')+'<div class="detail"><div class="line"><strong>Observation</strong> · '+esc(c.observation)+'</div><div class="line"><strong>Désirs</strong> · '+esc(c.desires)+'</div></div></article>';
    }).join("");
    box.querySelectorAll(".card").forEach(function(c){c.addEventListener("click",function(){c.classList.toggle("expanded");});});
  }catch(e){box.className="empty";box.textContent="Erreur";console.error(e);}
}

var SECTIONS={en_vigueur:"En vigueur",en_discussion:"En discussion",a_revoir:"À revoir"};
async function loadContract(){
  var box=$("#contractList");
  if(!box) return;
  try{
    var res=await sb.from("maison_contract_items").select("*").neq("status","archived").order("sort_order");
    var data=res.data, error=res.error;
    if(error||!data||!data.length){box.innerHTML='<p class="empty">'+(error?"Erreur":"Contrat vide")+'</p>';return;}
    var g={en_vigueur:[],en_discussion:[],a_revoir:[]};
    data.forEach(function(i){if(g[i.section]) g[i.section].push(i);});
    box.innerHTML=Object.keys(g).map(function(sec){
      var items=g[sec];
      if(!items.length) return "";
      return '<div class="sl">'+SECTIONS[sec]+'</div>'+items.map(function(it){
        return '<div class="ci">'+(it.status==="proposed"?'<div style="font-size:.65rem;color:var(--dim);text-transform:uppercase;margin-bottom:4px">proposé</div>':'')+'<div class="t">'+esc(it.title)+'</div><div class="b">'+esc(it.body)+'</div></div>';
      }).join("");
    }).join("");
  }catch(e){box.innerHTML='<p class="empty">Erreur</p>';console.error(e);}
}

async function loadDecisions(){
  var box=$("#decisionList");
  if(!box) return;
  try{
    var res=await sb.from("maison_decisions").select("*").order("decided_at",{ascending:false}).limit(20);
    var data=res.data, error=res.error;
    if(error||!data||!data.length){box.innerHTML='<p class="empty">'+(error?"Erreur":"Aucune décision encore.")+'</p>';return;}
    box.innerHTML=data.map(function(d){
      return '<div class="dec"><div class="dd">'+fmt(d.decided_at)+'</div><div class="dt">'+esc(d.title)+'</div>'+(d.body?'<div class="db">'+esc(d.body)+'</div>':'')+'</div>';
    }).join("");
  }catch(e){box.innerHTML='<p class="empty">Erreur</p>';}
}

async function loadReviews(){
  var box=$("#reviewList");
  if(!box) return;
  try{
    var res=await sb.from("maison_reviews").select("*").order("week_of",{ascending:false}).limit(6);
    var data=res.data, error=res.error;
    if(error||!data||!data.length){box.className="empty";box.textContent="Aucune encore.";return;}
    box.className="";
    box.innerHTML=data.map(function(r){
      return '<div class="card"><div class="meta"><span class="date">Semaine du '+fmt(r.week_of)+'</span></div>'+(r.held?'<div class="line"><strong>Tenu</strong> · '+esc(r.held)+'</div>':'')+(r.friction?'<div class="line"><strong>Friction</strong> · '+esc(r.friction)+'</div>':'')+(r.desire?'<div class="line"><strong>Envie</strong> · '+esc(r.desire)+'</div>':'')+'</div>';
    }).join("");
  }catch(e){box.className="empty";box.textContent="Erreur";}
}

function initForm(){
  var form=$("#form");
  if(!form) return;
  form.addEventListener("submit",async function(e){
    e.preventDefault();
    var fd=new FormData(form);
    var desires=(fd.get("desires")||"").toString().trim();
    var unsaid=(fd.get("unsaid")||"").toString().trim();
    if(unsaid) desires=desires?(desires+"\n[non dit] "+unsaid):("[non dit] "+unsaid);
    var row={date:todayISO(),body:(fd.get("body")||"").toString().trim(),mental:(fd.get("mental")||"").toString().trim(),saturation:Number(fd.get("saturation")||5),observation:(fd.get("observation")||"").toString().trim(),desires:desires,need:(fd.get("need")||"").toString().trim()};
    var saveBtn=$("#saveBtn");
    if(saveBtn) saveBtn.disabled=true;
    try{
      var res=await sb.from("maison_check_ins").insert(row);
      if(res.error){toast("Échec");console.error(res.error);if(saveBtn)saveBtn.disabled=false;return;}
      var summary="Check-in "+row.date+" · sat "+row.saturation+"/10 · besoin: "+(row.need||"—");
      await sb.from("dense_memory").insert({source:"check-in-maison",summary:summary.slice(0,280),content:JSON.stringify(row),tags:["check-in","maison","ds",row.date],texture:"rituel quotidien",context:"Check-in Maison"});
      if(row.need){await sb.from("maison_cadre").upsert({id:"current",dominant_need:row.need,saturation_hint:row.saturation,updated_at:new Date().toISOString()});await loadCadre();}
      toast("Check-in enregistré");
      form.reset();
      var sv=$("#satVal"); if(sv) sv.textContent="5";
      $$("#needChips .chip").forEach(function(c){c.classList.remove("active");});
      await loadHistory();
    }catch(err){toast("Échec");console.error(err);}
    if(saveBtn) saveBtn.disabled=false;
  });
}

function initOther(){
  var cadreSave=$("#cadreSave");
  if(cadreSave) cadreSave.addEventListener("click",async function(){
    await sb.from("maison_cadre").upsert({id:"current",denial_active:!!$("#cadreDenial").checked,denial_note:($("#cadreDenialNote").value||"").trim(),dominant_need:($("#cadreNeed").value||"").trim(),focus_order:($("#cadreFocus").value||"").trim(),updated_at:new Date().toISOString()});
    await loadCadre();toast("Cadre mis à jour");
  });
  var propBtn=$("#propBtn");
  if(propBtn) propBtn.addEventListener("click",async function(){
    var title=($("#propTitle").value||"").trim();
    var body=($("#propBody").value||"").trim();
    if(!title){toast("Titre requis");return;}
    await sb.from("maison_contract_items").insert({section:"en_discussion",title:title,body:body,status:"proposed",sort_order:100});
    $("#propTitle").value="";$("#propBody").value="";toast("Mis en discussion");await loadContract();
  });
  var decBtn=$("#decBtn");
  if(decBtn) decBtn.addEventListener("click",async function(){
    var title=($("#decTitle").value||"").trim();
    var body=($("#decBody").value||"").trim();
    if(!title){toast("Titre requis");return;}
    await sb.from("maison_decisions").insert({decided_at:todayISO(),title:title,body:body});
    $("#decTitle").value="";$("#decBody").value="";toast("Décision notée");await loadDecisions();
  });
  var reviewForm=$("#reviewForm");
  if(reviewForm) reviewForm.addEventListener("submit",async function(e){
    e.preventDefault();
    var fd=new FormData(reviewForm);
    var now=new Date();var day=(now.getDay()+6)%7;var monday=new Date(now);monday.setDate(now.getDate()-day);
    await sb.from("maison_reviews").insert({week_of:monday.toISOString().slice(0,10),held:(fd.get("held")||"").toString().trim(),friction:(fd.get("friction")||"").toString().trim(),desire:(fd.get("desire")||"").toString().trim()});
    toast("Revue enregistrée");reviewForm.reset();await loadReviews();
  });
  var shareUrl=$("#shareUrl"); if(shareUrl) shareUrl.textContent=SHARE;
  var copyLink=$("#copyLink");
  if(copyLink) copyLink.addEventListener("click",async function(){try{await navigator.clipboard.writeText(SHARE);toast("Lien copié");}catch(e){toast(SHARE);}});
  var copyText=$("#copyText");
  if(copyText) copyText.addEventListener("click",async function(){
    var res=await sb.from("maison_check_ins").select("*").order("created_at",{ascending:false}).limit(1).maybeSingle();
    var data=res.data;
    if(!data){toast("Aucun check-in");return;}
    var text=["Check-in Maison — "+fmt(data.date),"Saturation : "+data.saturation+"/10","Corps : "+(data.body||"—"),"Mental : "+(data.mental||"—"),"Observation : "+(data.observation||"—"),"Désirs : "+(data.desires||"—"),"Besoin : "+(data.need||"—")].join("\n");
    try{await navigator.clipboard.writeText(text);toast("Texte copié");}catch(e){toast("Copie manuelle nécessaire");}
  });
}

function boot(){
  var tl=$("#todayLabel"); if(tl) tl.textContent=fmt(todayISO());
  initNav();
  initSlider();
  initChips();
  initForm();
  initOther();
  loadCadre();
  loadHistory();
  loadContract();
  loadDecisions();
  loadReviews();
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
else boot();
