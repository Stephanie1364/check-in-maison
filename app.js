const SB_URL="https://itotjwvqhvdfmluzrjkd.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b3Rqd3ZxaHZkZm1sdXpyamtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTUwNTYsImV4cCI6MjEwMjYzMTA1Nn0.qSO_uBExBpo3Yt93Ps6bAcdfrTZJpi56RSIgQrETEGw";
const sb=window.supabase.createClient(SB_URL,SB_KEY);
const SHARE="https://cdn.jsdelivr.net/gh/Stephanie1364/check-in-maison@main/voir.html?token=feu-calme-cbb7";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const fmt=iso=>{if(!iso)return"";const[y,m,d]=iso.split("-");return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date(+y,+m-1,+d))};
const esc=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
$$("#nav button").forEach(b=>b.onclick=()=>{$$("#nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".panel").forEach(p=>p.classList.remove("active"));$("#p-"+b.dataset.p).classList.add("active")});
$("input[name=saturation]").oninput=e=>$("#satVal").textContent=e.target.value;
$("#desireChips").onclick=e=>{const c=e.target.closest(".chip");if(!c)return;const ta=$("textarea[name=desires]");const t=c.dataset.t;if(!ta.value.trim())ta.value=t;else if(!ta.value.includes(t.trim()))ta.value=ta.value.trim()+"\n"+t;ta.focus()};
$("#needChips").onclick=e=>{const c=e.target.closest(".chip");if(!c)return;$$("#needChips .chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");$("input[name=need]").value=c.dataset.n};
async function loadCadre(){const{data}=await sb.from("maison_cadre").select("*").eq("id","current").maybeSingle();if(!data)return;
$("#tagDenial").textContent=data.denial_active?("Déni · "+(data.denial_note||"actif")):"Déni · non";$("#tagDenial").classList.toggle("on",!!data.denial_active);
$("#tagNeed").textContent=data.dominant_need?("Besoin · "+data.dominant_need):"Besoin · —";
if(data.focus_order){$("#tagFocus").style.display="";$("#tagFocus").textContent="Focus · "+data.focus_order}else $("#tagFocus").style.display="none";
$("#cadreDenial").checked=!!data.denial_active;$("#cadreDenialNote").value=data.denial_note||"";$("#cadreNeed").value=data.dominant_need||"";$("#cadreFocus").value=data.focus_order||""}
$("#cadreSave").onclick=async()=>{await sb.from("maison_cadre").upsert({id:"current",denial_active:$("#cadreDenial").checked,denial_note:$("#cadreDenialNote").value.trim(),dominant_need:$("#cadreNeed").value.trim(),focus_order:$("#cadreFocus").value.trim(),updated_at:new Date().toISOString()});await loadCadre();toast("Cadre mis à jour")};
$("#todayLabel").textContent=fmt(todayISO());
$("#form").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);let desires=(fd.get("desires")||"").toString().trim();const unsaid=(fd.get("unsaid")||"").toString().trim();if(unsaid)desires=desires?(desires+"\n[non dit] "+unsaid):("[non dit] "+unsaid);
const row={date:todayISO(),body:(fd.get("body")||"").toString().trim(),mental:(fd.get("mental")||"").toString().trim(),saturation:Number(fd.get("saturation")||5),observation:(fd.get("observation")||"").toString().trim(),desires,need:(fd.get("need")||"").toString().trim()};
$("#saveBtn").disabled=true;const{error}=await sb.from("maison_check_ins").insert(row);if(error){toast("Échec");$("#saveBtn").disabled=false;return}
const summary=`Check-in ${row.date} · sat ${row.saturation}/10 · besoin: ${row.need||"—"}`;
await sb.from("dense_memory").insert({source:"check-in-maison",summary:summary.slice(0,280),content:JSON.stringify(row),tags:["check-in","maison","ds",row.date],texture:"rituel quotidien",context:"Check-in Maison"});
if(row.need){await sb.from("maison_cadre").upsert({id:"current",dominant_need:row.need,saturation_hint:row.saturation,updated_at:new Date().toISOString()});await loadCadre()}
toast("Check-in enregistré");e.target.reset();$("#satVal").textContent="5";$$("#needChips .chip").forEach(c=>c.classList.remove("active"));$("#saveBtn").disabled=false;await loadHistory()};
async function loadHistory(){const{data,error}=await sb.from("maison_check_ins").select("*").order("created_at",{ascending:false}).limit(7);const box=$("#historyList");
if(error||!data?.length){box.className="empty";box.textContent=error?"Erreur":"Aucun check-in encore.";return}
box.className="";box.innerHTML=data.map(c=>`<article class="card"><div class="meta"><span class="date">${fmt(c.date)}</span><span class="sat2">sat ${c.saturation}/10</span></div><div class="line"><strong>Corps</strong> · ${esc(c.body)}</div><div class="line"><strong>Mental</strong> · ${esc(c.mental)}</div>${c.need?`<div class="line"><strong>Besoin</strong> · ${esc(c.need)}</div>`:""}<div class="detail"><div class="line"><strong>Observation</strong> · ${esc(c.observation)}</div><div class="line"><strong>Désirs</strong> · ${esc(c.desires)}</div></div></article>`).join("");
box.querySelectorAll(".card").forEach(c=>c.onclick=()=>c.classList.toggle("expanded"))}
const SECTIONS={en_vigueur:"En vigueur",en_discussion:"En discussion",a_revoir:"À revoir"};
async function loadContract(){const{data,error}=await sb.from("maison_contract_items").select("*").neq("status","archived").order("sort_order");const box=$("#contractList");
if(error||!data?.length){box.innerHTML=`<p class="empty">${error?"Erreur":"Contrat vide"}</p>`;return}
const g={en_vigueur:[],en_discussion:[],a_revoir:[]};data.forEach(i=>{if(g[i.section])g[i.section].push(i)});
box.innerHTML=Object.entries(g).map(([sec,items])=>{if(!items.length)return"";return `<div class="sl">${SECTIONS[sec]||sec}</div>`+items.map(it=>`<div class="ci">${it.status==="proposed"?`<div style="font-size:.65rem;color:var(--dim);text-transform:uppercase;margin-bottom:4px">proposé</div>`:""}<div class="t">${esc(it.title)}</div><div class="b">${esc(it.body)}</div></div>`).join("")}).join("")}
$("#propBtn").onclick=async()=>{const title=$("#propTitle").value.trim(),body=$("#propBody").value.trim();if(!title){toast("Titre requis");return}
await sb.from("maison_contract_items").insert({section:"en_discussion",title,body,status:"proposed",sort_order:100});$("#propTitle").value="";$("#propBody").value="";toast("Mis en discussion");await loadContract()};
async function loadDecisions(){const{data,error}=await sb.from("maison_decisions").select("*").order("decided_at",{ascending:false}).limit(20);const box=$("#decisionList");
if(error||!data?.length){box.innerHTML=`<p class="empty">${error?"Erreur":"Aucune décision encore."}</p>`;return}
box.innerHTML=data.map(d=>`<div class="dec"><div class="dd">${fmt(d.decided_at)}</div><div class="dt">${esc(d.title)}</div>${d.body?`<div class="db">${esc(d.body)}</div>`:""}</div>`).join("")}
$("#decBtn").onclick=async()=>{const title=$("#decTitle").value.trim(),body=$("#decBody").value.trim();if(!title){toast("Titre requis");return}
await sb.from("maison_decisions").insert({decided_at:todayISO(),title,body});$("#decTitle").value="";$("#decBody").value="";toast("Décision notée");await loadDecisions()};
async function loadReviews(){const{data,error}=await sb.from("maison_reviews").select("*").order("week_of",{ascending:false}).limit(6);const box=$("#reviewList");
if(error||!data?.length){box.className="empty";box.textContent="Aucune encore.";return}
box.className="";box.innerHTML=data.map(r=>`<div class="card"><div class="meta"><span class="date">Semaine du ${fmt(r.week_of)}</span></div>${r.held?`<div class="line"><strong>Tenu</strong> · ${esc(r.held)}</div>`:""}${r.friction?`<div class="line"><strong>Friction</strong> · ${esc(r.friction)}</div>`:""}${r.desire?`<div class="line"><strong>Envie</strong> · ${esc(r.desire)}</div>`:""}</div>`).join("")}
$("#reviewForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const now=new Date();const day=(now.getDay()+6)%7;const monday=new Date(now);monday.setDate(now.getDate()-day);
await sb.from("maison_reviews").insert({week_of:monday.toISOString().slice(0,10),held:(fd.get("held")||"").toString().trim(),friction:(fd.get("friction")||"").toString().trim(),desire:(fd.get("desire")||"").toString().trim()});
toast("Revue enregistrée");e.target.reset();await loadReviews()};
$("#shareUrl").textContent=SHARE;
$("#copyLink").onclick=async()=>{try{await navigator.clipboard.writeText(SHARE);toast("Lien copié")}catch{toast(SHARE)}};
$("#copyText").onclick=async()=>{const{data}=await sb.from("maison_check_ins").select("*").order("created_at",{ascending:false}).limit(1).maybeSingle();if(!data){toast("Aucun check-in");return}
const text=[`Check-in Maison — ${fmt(data.date)}`,`Saturation : ${data.saturation}/10`,`Corps : ${data.body||"—"}`,`Mental : ${data.mental||"—"}`,`Observation : ${data.observation||"—"}`,`Désirs : ${data.desires||"—"}`,`Besoin : ${data.need||"—"}`].join("\n");
try{await navigator.clipboard.writeText(text);toast("Texte copié")}catch{toast("Copie manuelle nécessaire")}};
loadCadre();loadHistory();loadContract();loadDecisions();loadReviews();
