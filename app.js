const APP_VERSION="5.1";
const icon=n=>`<svg class="ui-icon" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
const BOOK_KEY="readingRoomBooksV1";
const GENRE_KEY="readingRoomGenresV1";
const SYNC_KEY="readingRoomSyncSettingsV2";
const SESSION_KEY="readingRoomSupabaseSessionV2";
const CHANGE_KEY="readingRoomLastChangedV2";
const SYNCED_KEY="readingRoomLastSyncedV2";

const DEFAULT_GENRES=["Thriller","Mystery","Horror","Romance","Fantasy","Science Fiction","Contemporary","Historical Fiction","Literary Fiction","Non-Fiction","Biography","Self-Help","Other"];

let books=JSON.parse(localStorage.getItem(BOOK_KEY)||"[]");
let genres=JSON.parse(localStorage.getItem(GENRE_KEY)||"null")||[...DEFAULT_GENRES];
let syncSettings=JSON.parse(localStorage.getItem(SYNC_KEY)||"null")||{url:"",key:""};
let syncSession=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
let selectedRating=0;
let workingCover="";
let lastRoute="home";
let justFinishedBookId=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function todayISO(){return new Date().toISOString().slice(0,10);}
function statusLabel(s){return ({want:"TBR",reading:"Reading",finished:"Finished",dnf:"DNF"})[s]||s;}
function genreEmoji(name=""){
  const g=name.toLowerCase();
  if(g.includes("thriller"))return"🔪"; if(g.includes("mystery"))return"🕵️"; if(g.includes("horror"))return"👻";
  if(g.includes("romance"))return"💗"; if(g.includes("fantasy"))return"🐉"; if(g.includes("science fiction"))return"🚀";
  if(g.includes("historical"))return"🏛️"; if(g.includes("contemporary"))return"🌿"; if(g.includes("literary"))return"✒️";
  if(g.includes("biography"))return"👤"; if(g.includes("self-help"))return"🌱"; if(g.includes("non-fiction")||g.includes("nonfiction"))return"🧠";
  return"📚";
}
function formatIcon(){return"format";})[f]||"✨";}
function stars(r){r=Number(r)||0;if(!r)return"Not rated";return `${"★".repeat(Math.floor(r))}${r%1?"½":""} ${r}/5`;}
function pct(b){if(!b.pages||!b.currentPage)return 0;return Math.min(100,Math.round((Number(b.currentPage)/Number(b.pages))*100));}
function bookYear(b){const raw=b.dateFinished||b.dateStarted;if(raw){const y=new Date(raw+"T00:00:00").getFullYear();if(!Number.isNaN(y))return y;}return new Date().getFullYear();}
function dateDiffDays(a,b){if(!a||!b)return null;const d=Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);return Number.isFinite(d)&&d>=0?d:null;}
function sessionMinutes(b){return (Array.isArray(b.sessions)?b.sessions:[]).reduce((n,s)=>n+(Number(s.minutes)||0),0);}
function coverHTML(b,cls="cover"){return b.cover?`<img class="${cls}" src="${b.cover}" alt="${escapeHtml(b.title)} cover">`:`<div class="${cls} placeholder">${escapeHtml(b.title||"Book")}</div>`;}

function markChanged(){localStorage.setItem(CHANGE_KEY,String(Date.now()));}
function saveBooks({sync=true}={}){
  localStorage.setItem(BOOK_KEY,JSON.stringify(books));markChanged();renderAll();if(sync)cloudSync();
}
function saveGenres({sync=true}={}){
  localStorage.setItem(GENRE_KEY,JSON.stringify(genres));markChanged();renderGenreOptions();renderAll();if(sync)cloudSync();
}

function routeTo(route,{replace=false}={}){
  const valid=["home","tbr","reading","finished","stats","sync"];
  if(!valid.includes(route))route="home";
  lastRoute=route;
  $$(".page").forEach(p=>p.classList.toggle("active",p.dataset.page===route));
  $$("[data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
  if(replace)history.replaceState({route},"",`#${route}`); else if(location.hash!==`#${route}`)history.pushState({route},"",`#${route}`);
  window.scrollTo({top:0,behavior:"instant"});
  if(route==="stats")renderStats();
  if(route==="sync")renderSyncStatus();
}
window.addEventListener("popstate",()=>routeTo(location.hash.slice(1)||"home",{replace:true}));
$$("[data-route]").forEach(btn=>btn.addEventListener("click",()=>routeTo(btn.dataset.route)));
routeTo(location.hash.slice(1)||"home",{replace:true});

function renderGenreOptions(selected){
  const bookSelect=$("#genre");
  if(bookSelect){
    const current=selected!==undefined?selected:bookSelect.value;
    const list=[...genres];
    if(current&&!list.includes(current))list.unshift(current);
    bookSelect.innerHTML=`<option value="">✨ Choose genre…</option>`+list.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    bookSelect.value=current||"";
  }
  ["tbrGenre","finishedGenre"].forEach(id=>{
    const el=$("#"+id);if(!el)return;const current=el.value||"all";
    el.innerHTML=`<option value="all">🏷️ All genres</option>`+genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    el.value=genres.includes(current)?current:"all";
  });
}
function renderGenreManager(){
  $("#genreList").innerHTML=genres.map((g,i)=>`<div class="genre-row">
    <input data-genre-index="${i}" value="${escapeHtml(g)}">
    <button type="button" class="secondary compact" onclick="renameGenre(${i})">Save</button>
    <button type="button" class="danger compact" onclick="deleteGenre(${i})">Delete</button>
  </div>`).join("");
}
window.renameGenre=i=>{
  const input=document.querySelector(`[data-genre-index="${i}"]`);const next=(input?.value||"").trim().replace(/\s+/g," ");const old=genres[i];
  if(!next)return alert("Genre name cannot be empty.");
  if(genres.some((g,j)=>j!==i&&g.toLowerCase()===next.toLowerCase()))return alert("That genre already exists.");
  genres[i]=next;books=books.map(b=>b.genre===old?{...b,genre:next}:b);localStorage.setItem(BOOK_KEY,JSON.stringify(books));saveGenres();
};
window.deleteGenre=i=>{const name=genres[i];if(!confirm(`Remove "${name}" from future choices? Existing books keep it.`))return;genres.splice(i,1);saveGenres();};

function woodBook(b){return `<button class="wood-book" onclick="openBook('${b.id}')">${coverHTML(b)}<span>${escapeHtml(b.title)}</span></button>`;}
function shelfCard(b){return `<button class="shelf-card" onclick="openBook('${b.id}')">${coverHTML(b)}<strong>${escapeHtml(b.title)}</strong><small>${escapeHtml(b.author||"Unknown")}</small></button>`;}

function renderHome(){
  const finished=books.filter(b=>b.status==="finished");
  const reading=books.filter(b=>b.status==="reading");
  const tbr=books.filter(b=>b.status==="want");
  $("#homeFinishedCount").textContent=finished.length;
  $("#homeSummary").textContent=finished.length?`You have finished ${finished.length} ${finished.length===1?"book":"books"} in your library.`:"Start filling your shelves.";
  $("#homeReading").innerHTML=reading.slice(0,3).map(b=>`<article class="reading-feature">
    ${coverHTML(b)}
    <div><p class="eyebrow">Reading</p><h3>${escapeHtml(b.title)}</h3><p class="meta">${escapeHtml(b.author||"Unknown author")}</p>
    <div class="progress"><span style="width:${pct(b)}%"></span></div><p class="meta">${b.currentPage||0}${b.pages?` / ${b.pages}`:""} pages · ${pct(b)}%</p>
    <button class="secondary compact" onclick="openBook('${b.id}')">Open</button></div></article>`).join("");
  $("#homeReadingEmpty").classList.toggle("hidden",reading.length>0);
  $("#homeFinishedShelf").innerHTML=finished.slice(0,9).map(woodBook).join("");
  $("#homeTbrShelf").innerHTML=tbr.slice(0,9).map(woodBook).join("");
  const favs=books.filter(b=>b.favoriteBook);
  $("#homeFavoritesSection").classList.toggle("hidden",favs.length===0);
  $("#homeFavorites").innerHTML=favs.map(b=>`<button class="cover-card" onclick="openBook('${b.id}')">${coverHTML(b)}<span>${escapeHtml(b.title)}</span></button>`).join("");
}
function renderTbr(){
  const q=$("#tbrSearch").value.trim().toLowerCase(),g=$("#tbrGenre").value;
  const list=books.filter(b=>b.status==="want").filter(b=>(!q||`${b.title} ${b.author}`.toLowerCase().includes(q))&&(g==="all"||b.genre===g));
  $("#tbrCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  $("#tbrShelf").innerHTML=list.map(shelfCard).join("");
  $("#tbrEmpty").classList.toggle("hidden",list.length>0);
}
function readingCard(b){return `<article class="reading-card">
  <div class="reading-card-top">${coverHTML(b)}<div><p class="eyebrow">Reading</p><h3>${escapeHtml(b.title)}</h3><p class="meta">${escapeHtml(b.author||"Unknown author")}</p>
  <div class="progress"><span style="width:${pct(b)}%"></span></div><p class="meta">${b.currentPage||0}${b.pages?` / ${b.pages}`:""} pages · ${pct(b)}%</p>
  <p class="meta">Started ${b.dateStarted||"not set"} · ${sessionMinutes(b)} min logged</p></div></div>
  <div class="card-actions"><button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Book</button><button class="primary" onclick="openSession('${b.id}')">${icon("session")} Add Session</button></div>
</article>`;}
function renderReading(){
  const list=books.filter(b=>b.status==="reading");
  $("#readingCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  $("#readingGrid").innerHTML=list.map(readingCard).join("");
  $("#readingEmpty").classList.toggle("hidden",list.length>0);
}
function renderFinished(){
  const q=$("#finishedSearch").value.trim().toLowerCase(),g=$("#finishedGenre").value,y=$("#finishedYear").value;
  const all=books.filter(b=>b.status==="finished");
  const years=[...new Set(all.map(bookYear))].sort((a,b)=>b-a);
  const old=$("#finishedYear").value||"all";
  $("#finishedYear").innerHTML=`<option value="all">All years</option>`+years.map(x=>`<option value="${x}">${x}</option>`).join("");
  $("#finishedYear").value=years.map(String).includes(old)?old:"all";
  const yy=$("#finishedYear").value;
  const list=all.filter(b=>(!q||`${b.title} ${b.author}`.toLowerCase().includes(q))&&(g==="all"||b.genre===g)&&(yy==="all"||String(bookYear(b))===yy));
  $("#finishedCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  const groups={};list.forEach(b=>(groups[bookYear(b)]??=[]).push(b));
  $("#finishedYearShelves").innerHTML=Object.keys(groups).sort((a,b)=>b-a).map(year=>`<section class="year-block"><h2>${year} Shelf</h2><div class="full-bookcase">
    <div class="bookcase-top-decor"><span>🪴</span><span>✨</span><span>🕯️</span></div><div class="large-shelf-grid">${groups[year].map(shelfCard).join("")}</div><div class="wood-board"></div>
  </div></section>`).join("");
  $("#finishedEmpty").classList.toggle("hidden",list.length>0);
}
function renderAll(){renderGenreOptions();renderHome();renderTbr();renderReading();renderFinished();if(lastRoute==="stats")renderStats();}

function countBy(list,key){return list.reduce((a,b)=>{const v=b[key]||"Unknown";a[v]=(a[v]||0)+1;return a;},{});}
function topKey(o){return Object.entries(o).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";}
function renderStatRows(target,obj){
  const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...entries.map(x=>x[1]));
  $(target).innerHTML=entries.length?entries.map(([n,v])=>`<div class="stat-row"><span>${escapeHtml(n)}</span><div class="stat-track"><span style="width:${v/max*100}%"></span></div><small>${v}</small></div>`).join(""):`<p class="muted">No data yet.</p>`;
}
function renderStats(){
  const years=[...new Set(books.filter(b=>b.status==="finished").map(bookYear))].sort((a,b)=>b-a);const current=new Date().getFullYear();if(!years.includes(current))years.unshift(current);
  const old=Number($("#statsYear").value)||current;$("#statsYear").innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join("");$("#statsYear").value=years.includes(old)?old:years[0];
  const year=Number($("#statsYear").value),list=books.filter(b=>b.status==="finished"&&bookYear(b)===year),rated=list.filter(b=>Number(b.rating)>0);
  $("#statBooks").textContent=list.length;$("#statPages").textContent=list.reduce((n,b)=>n+(Number(b.pages)||0),0).toLocaleString();
  $("#statRating").textContent=rated.length?(rated.reduce((n,b)=>n+Number(b.rating),0)/rated.length).toFixed(1):"—";
  $("#statGenre").textContent=topKey(countBy(list,"genre"));$("#statAuthor").textContent=topKey(countBy(list,"author"));
  $("#statMinutes").textContent=list.reduce((n,b)=>n+sessionMinutes(b),0).toLocaleString();
  const withDays=list.map(b=>({b,d:dateDiffDays(b.dateStarted,b.dateFinished)})).filter(x=>x.d!==null).sort((a,b)=>a.d-b.d);
  $("#statFastest").textContent=withDays.length?`${withDays[0].d}d`:"—";
  const longest=[...list].sort((a,b)=>(Number(b.pages)||0)-(Number(a.pages)||0))[0];$("#statLongest").textContent=longest?.pages?`${longest.pages}p`:"—";
  const months=Array(12).fill(0);list.forEach(b=>{if(b.dateFinished){const d=new Date(b.dateFinished+"T00:00:00");if(!Number.isNaN(d))months[d.getMonth()]++;}});
  const max=Math.max(1,...months),names=["J","F","M","A","M","J","J","A","S","O","N","D"];
  $("#monthlyBars").innerHTML=months.map((n,i)=>`<div class="bar-col"><div class="bar-fill" style="height:${Math.max(2,n/max*100)}%"><b>${n||""}</b></div><small>${names[i]}</small></div>`).join("");
  renderStatRows("#genreStats",countBy(list,"genre"));renderStatRows("#formatStats",countBy(list,"format"));
  const rc={};rated.forEach(b=>rc[String(b.rating)]=(rc[String(b.rating)]||0)+1);renderStatRows("#ratingStats",rc);
}

function setDialogOpen(open){document.body.classList.toggle("dialog-open",open);}
$$("dialog").forEach(d=>d.addEventListener("close",()=>setDialogOpen($$("dialog").some(x=>x.open))));

function buildRatingPicker(){
  const p=$("#ratingPicker");p.innerHTML="";
  for(let r=.5;r<=5;r+=.5){const b=document.createElement("button");b.type="button";b.className="rating-chip";b.textContent=r;b.onclick=()=>{selectedRating=r;$("#rating").value=r;$$(".rating-chip").forEach(x=>x.classList.toggle("active",Number(x.textContent)===r));};p.appendChild(b);}
}
buildRatingPicker();

function clearCover(){
  workingCover="";$("#coverInput").value="";$("#coverFileName").textContent="No file selected";$("#coverPreview").removeAttribute("src");$("#coverPreviewWrap").classList.add("hidden");
}
function resetBookForm(){
  $("#bookForm").reset();$("#bookId").value="";selectedRating=0;clearCover();$("#deleteBookBtn").classList.add("hidden");$("#dialogTitle").textContent="Add a Book";$("#status").value="want";
  $$(".rating-chip").forEach(x=>x.classList.remove("active"));renderGenreOptions("");updateStatusFields({auto:false});
}
function updateStatusFields({auto=true}={}){
  const s=$("#status").value;$("#readingFields").classList.toggle("hidden",s!=="reading");$("#finishedFields").classList.toggle("hidden",s!=="finished");
  if(s==="reading"&&auto&&!$("#dateStarted").value)$("#dateStarted").value=todayISO();
  if(s==="finished"){
    if(!$("#finishDateStarted").value)$("#finishDateStarted").value=$("#dateStarted").value||todayISO();
    if(auto&&!$("#dateFinished").value)$("#dateFinished").value=todayISO();
  }
}
function openAdd(){
  resetBookForm();$("#bookDialog").showModal();setDialogOpen(true);
}
$("#headerAddBook").onclick=openAdd;$("#floatingAddBook").onclick=openAdd;
$("#closeBookDialog").onclick=()=>$("#bookDialog").close();$("#cancelBookBtn").onclick=()=>$("#bookDialog").close();

$("#status").addEventListener("change",()=>{
  const id=$("#bookId").value,old=id?books.find(b=>b.id===id):null,s=$("#status").value;
  if(s==="reading"&&old?.status==="want"&&!$("#dateStarted").value)$("#dateStarted").value=todayISO();
  if(s==="finished"){if(!$("#finishDateStarted").value)$("#finishDateStarted").value=$("#dateStarted").value||todayISO();if(!$("#dateFinished").value)$("#dateFinished").value=todayISO();}
  updateStatusFields();
});
$("#chooseCoverBtn").onclick=()=>$("#coverInput").click();
$("#coverInput").onchange=e=>{const f=e.target.files[0];if(!f)return;$("#coverFileName").textContent=f.name;const r=new FileReader();r.onload=ev=>{workingCover=ev.target.result;$("#coverPreview").src=workingCover;$("#coverPreviewWrap").classList.remove("hidden");};r.readAsDataURL(f);};
$("#removeCover").onclick=clearCover;

window.editBook=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  resetBookForm();$("#dialogTitle").textContent="Edit Book";$("#deleteBookBtn").classList.remove("hidden");$("#bookId").value=b.id;
  ["title","author","status","format","pages","currentPage","dateStarted","dateFinished","prediction","review","spoilers","predictionResult"].forEach(k=>{const el=$("#"+k);if(el)el.value=b[k]??"";});
  $("#finishDateStarted").value=b.dateStarted||"";renderGenreOptions(b.genre||"");selectedRating=Number(b.rating)||0;$("#rating").value=selectedRating;
  $$(".rating-chip").forEach(x=>x.classList.toggle("active",Number(x.textContent)===selectedRating));$("#favoriteBook").checked=!!b.favoriteBook;
  workingCover=b.cover||"";if(workingCover){$("#coverPreview").src=workingCover;$("#coverPreviewWrap").classList.remove("hidden");$("#coverFileName").textContent="Saved cover";}
  updateStatusFields({auto:false});$("#detailDialog").close();$("#bookDialog").showModal();setDialogOpen(true);
};

$("#bookForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("#bookId").value||(crypto.randomUUID?crypto.randomUUID():String(Date.now()));const i=books.findIndex(x=>x.id===id);const prev=i>=0?books[i]:null;
  const status=$("#status").value;
  const b={
    ...(prev||{}),id,title:$("#title").value.trim(),author:$("#author").value.trim(),status,genre:$("#genre").value,format:$("#format").value,cover:workingCover,
    pages:Number($("#pages").value)||Number(prev?.pages)||0,currentPage:Number($("#currentPage").value)||0,
    dateStarted:status==="finished"?$("#finishDateStarted").value:$("#dateStarted").value,dateFinished:$("#dateFinished").value,
    prediction:$("#prediction").value.trim(),rating:selectedRating,review:$("#review").value.trim(),spoilers:$("#spoilers").value.trim(),
    predictionResult:$("#predictionResult").value,favoriteBook:$("#favoriteBook").checked,sessions:Array.isArray(prev?.sessions)?prev.sessions:[]
  };
  const becameFinished=status==="finished"&&prev?.status!=="finished";
  if(i>=0)books[i]=b;else books.unshift(b);saveBooks();$("#bookDialog").close();
  if(becameFinished)setTimeout(()=>showFinish(b),120);
});
$("#deleteBookBtn").onclick=()=>{
  const id=$("#bookId").value;if(id&&confirm("Delete this book from your journal?")){books=books.filter(b=>b.id!==id);saveBooks();$("#bookDialog").close();}
};

window.openBook=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  const mins=sessionMinutes(b),days=dateDiffDays(b.dateStarted,b.dateFinished),sessions=Array.isArray(b.sessions)?b.sessions:[];
  let extra="",actions="";
  if(b.status==="want"){
    extra=`<div class="reading-time-card"><strong>${icon("tbr")} TBR</strong><p class="meta">Move this book to Reading when you start it.</p></div>`;
    actions=`<button class="primary" onclick="editBook('${b.id}')">${icon("reading")} Start / Edit</button>`;
  }else if(b.status==="reading"){
    extra=`<div class="reading-time-card"><strong>Reading progress</strong><p class="meta">${b.currentPage||0}${b.pages?` / ${b.pages}`:""} pages · ${pct(b)}%</p><p class="meta">Started ${b.dateStarted||"—"} · ${mins} min logged</p></div>
      ${b.prediction?`<div class="detail-section"><h3>${icon("note")} My Prediction</h3><p>${escapeHtml(b.prediction)}</p></div>`:""}
      ${sessions.length?`<div class="detail-section"><h3>Reading Sessions</h3><div class="session-list">${sessions.map(s=>`<div class="session-item">${s.mood||"📖"} ${s.startPage||0} → ${s.endPage||0} · ${s.minutes||0} min · ${s.date||""}</div>`).join("")}</div></div>`:""}`;
    actions=`<button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Book</button><button class="primary" onclick="openSession('${b.id}')">${icon("session")} Add Session</button>`;
  }else{
    extra=`<div class="reading-time-card"><strong>Reading time</strong><p class="meta">${days===null?"—":days+" "+(days===1?"day":"days")} · ${mins} min logged</p><p class="meta">${b.dateStarted||"—"} → ${b.dateFinished||"—"}</p></div>
      ${b.review?`<div class="detail-section"><h3>My Thoughts</h3><p>${escapeHtml(b.review).replace(/\n/g,"<br>")}</p></div>`:""}
      ${b.spoilers?`<div class="detail-section"><h3>Story Memory</h3><button class="secondary compact" onclick="this.nextElementSibling.classList.toggle('hidden')">🔒 Reveal / Hide</button><p class="hidden">${escapeHtml(b.spoilers).replace(/\n/g,"<br>")}</p></div>`:""}`;
    actions=`<button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Journal</button>`;
  }
  $("#detailContent").innerHTML=`<div class="detail-top">${coverHTML(b)}<div><p class="eyebrow">${statusLabel(b.status)}</p><h2>${escapeHtml(b.title)}</h2><p class="muted">${escapeHtml(b.author||"Unknown author")}</p>
    <div class="pills"><span class="pill">${icon(genreIcon(b.genre))} ${escapeHtml(b.genre||"No genre")}</span><span class="pill">${icon(formatIcon())} ${escapeHtml(b.format||"No format")}</span>${b.status==="finished"?`<span class="pill">${stars(b.rating)}</span>`:""}</div>
    ${b.status==="finished"&&b.pages?`<p class="meta">${b.pages} pages</p>`:""}</div></div>${extra}<div class="detail-actions">${actions}<button class="secondary" onclick="document.getElementById('detailDialog').close()">Close</button></div>`;
  $("#detailDialog").showModal();setDialogOpen(true);
};

window.openSession=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;$("#sessionBookId").value=id;$("#sessionStart").value=b.currentPage||0;$("#sessionEnd").value="";$("#sessionMinutes").value="";$("#sessionMood").value="";
  $("#detailDialog").close();$("#sessionDialog").showModal();setDialogOpen(true);
};
$("#closeSessionDialog").onclick=()=>$("#sessionDialog").close();$("#cancelSessionBtn").onclick=()=>$("#sessionDialog").close();
$("#sessionForm").addEventListener("submit",e=>{
  e.preventDefault();const id=$("#sessionBookId").value,b=books.find(x=>x.id===id);if(!b)return;
  const startPage=Number($("#sessionStart").value)||0,endPage=Number($("#sessionEnd").value)||0,minutes=Number($("#sessionMinutes").value)||0,mood=$("#sessionMood").value;
  if(endPage<startPage)return alert("End page should be greater than or equal to start page.");if(!endPage&&!minutes)return alert("Add an end page or reading minutes.");
  b.sessions=Array.isArray(b.sessions)?b.sessions:[];b.sessions.push({startPage,endPage,minutes,mood,date:todayISO()});if(endPage)b.currentPage=endPage;saveBooks();$("#sessionDialog").close();setTimeout(()=>openBook(id),80);
});

$("#manageGenresBtn").onclick=()=>{renderGenreManager();$("#genreDialog").showModal();setDialogOpen(true);};
$("#closeGenreDialog").onclick=()=>$("#genreDialog").close();
$("#addGenreBtn").onclick=()=>{const i=$("#newGenreInput"),v=i.value.trim().replace(/\s+/g," ");if(!v)return;if(genres.some(g=>g.toLowerCase()===v.toLowerCase()))return alert("That genre already exists.");genres.push(v);i.value="";saveGenres();renderGenreManager();};

function showFinish(b){
  justFinishedBookId=b.id;$("#finishTitle").textContent=`You finished ${b.title}!`;$("#finishSubtitle").textContent=b.rating?`${stars(b.rating)} · Welcome to the finished shelf.`:"Another story has joined your library.";
  $("#finishCoverWrap").innerHTML=coverHTML(b);$("#finishFavoriteBtn").textContent=b.favoriteBook?"${icon("heart")} In Hall of Fame":"${icon("heart")} Hall of Fame";$("#finishDialog").showModal();setDialogOpen(true);
}
$("#finishCloseBtn").onclick=()=>$("#finishDialog").close();
$("#finishFavoriteBtn").onclick=()=>{const b=books.find(x=>x.id===justFinishedBookId);if(!b)return;b.favoriteBook=true;saveBooks();$("#finishFavoriteBtn").textContent="${icon("heart")} In Hall of Fame";};

$("#tbrSearch").oninput=renderTbr;$("#tbrGenre").onchange=renderTbr;$("#finishedSearch").oninput=renderFinished;$("#finishedGenre").onchange=renderFinished;$("#finishedYear").onchange=renderFinished;$("#statsYear").onchange=renderStats;

/* SUPABASE AUTH + AUTO SYNC */
function configured(){return !!(syncSettings.url&&syncSettings.key);}
function signedIn(){return !!(syncSession?.access_token&&syncSession?.user?.id);}
function authHeaders(access=false){const h={apikey:syncSettings.key,"Content-Type":"application/json"};if(access&&signedIn())h.Authorization=`Bearer ${syncSession.access_token}`;return h;}
function renderSyncStatus(){
  $("#supabaseUrl").value=syncSettings.url||"";$("#supabaseKey").value=syncSettings.key||"";
  if(signedIn())$("#syncStatus").innerHTML=`<span class="status-dot good"></span><div><strong>Cloud sync active</strong><p class="meta">Signed in securely with Supabase Authentication.</p></div>`;
  else if(configured())$("#syncStatus").innerHTML=`<span class="status-dot"></span><div><strong>Connection saved</strong><p class="meta">Sign in below to start syncing.</p></div>`;
  else $("#syncStatus").innerHTML=`<span class="status-dot"></span><div><strong>Local mode</strong><p class="meta">Your books are saved on this device.</p></div>`;
  $("#signedOutPanel").classList.toggle("hidden",signedIn());$("#signedInPanel").classList.toggle("hidden",!signedIn());
  if(signedIn())$("#signedInEmail").textContent=syncSession.user.email||"Reading Room account";
}
async function refreshSession(){
  if(!syncSession?.refresh_token||!configured())return false;const exp=Number(syncSession.expires_at||0)*1000;if(exp&&Date.now()<exp-60000)return true;
  try{const r=await fetch(`${syncSettings.url.replace(/\/$/,"")}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:authHeaders(),body:JSON.stringify({refresh_token:syncSession.refresh_token})});if(!r.ok)throw Error();syncSession=await r.json();localStorage.setItem(SESSION_KEY,JSON.stringify(syncSession));return true;}
  catch{syncSession=null;localStorage.removeItem(SESSION_KEY);renderSyncStatus();return false;}
}
async function signIn(email,password){
  const r=await fetch(`${syncSettings.url.replace(/\/$/,"")}/auth/v1/token?grant_type=password`,{method:"POST",headers:authHeaders(),body:JSON.stringify({email,password})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.msg||d.error_description||"Sign in failed.");syncSession=d;localStorage.setItem(SESSION_KEY,JSON.stringify(d));renderSyncStatus();
}
async function cloudSync(force=false){
  if(!configured()||!signedIn())return false;if(!(await refreshSession()))return false;
  try{
    const uid=syncSession.user.id,base=`${syncSettings.url.replace(/\/$/,"")}/rest/v1/reading_room_sync`,ep=`${base}?user_id=eq.${encodeURIComponent(uid)}&select=user_id,payload,updated_at_ms`;
    $("#lastSyncText")&&($("#lastSyncText").textContent="Checking cloud…");
    const gr=await fetch(ep,{headers:authHeaders(true)});if(!gr.ok)throw Error("Cloud read failed");const rows=await gr.json();
    const local=Number(localStorage.getItem(CHANGE_KEY)||0),last=Number(localStorage.getItem(SYNCED_KEY)||0);
    if(rows.length&&rows[0].payload){
      const remote=Number(rows[0].updated_at_ms||0);
      if(!force&&remote>local){
        books=Array.isArray(rows[0].payload.books)?rows[0].payload.books:books;genres=Array.isArray(rows[0].payload.genres)?rows[0].payload.genres:genres;
        localStorage.setItem(BOOK_KEY,JSON.stringify(books));localStorage.setItem(GENRE_KEY,JSON.stringify(genres));localStorage.setItem(CHANGE_KEY,String(remote));localStorage.setItem(SYNCED_KEY,String(remote));renderAll();
        $("#lastSyncText")&&($("#lastSyncText").textContent=`Downloaded latest · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;
      }
    }
    if(rows.length&&!force&&local<=last){$("#lastSyncText")&&($("#lastSyncText").textContent=`Up to date · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;}
    const now=Date.now(),payload={user_id:uid,payload:{books,genres},updated_at_ms:now};
    const pr=await fetch(`${base}?on_conflict=user_id`,{method:"POST",headers:{...authHeaders(true),Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(payload)});if(!pr.ok)throw Error("Cloud write failed");
    localStorage.setItem(CHANGE_KEY,String(now));localStorage.setItem(SYNCED_KEY,String(now));$("#lastSyncText")&&($("#lastSyncText").textContent=`Synced automatically · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;
  }catch(e){console.warn("Reading Room sync:",e);$("#lastSyncText")&&($("#lastSyncText").textContent="Sync failed — check connection or policies.");return false;}
}
$("#saveSyncSettings").onclick=()=>{const url=$("#supabaseUrl").value.trim().replace(/\/$/,""),key=$("#supabaseKey").value.trim();if(!url||!key)return alert("Enter Project URL and Publishable key.");syncSettings={url,key};localStorage.setItem(SYNC_KEY,JSON.stringify(syncSettings));renderSyncStatus();alert("Supabase connection saved.");};
$("#clearSyncSettings").onclick=()=>{if(!confirm("Clear Supabase connection from this device?"))return;syncSettings={url:"",key:""};syncSession=null;localStorage.removeItem(SYNC_KEY);localStorage.removeItem(SESSION_KEY);renderSyncStatus();};
$("#signInBtn").onclick=async()=>{const email=$("#syncEmail").value.trim(),password=$("#syncPassword").value;if(!email||!password)return alert("Enter email and password.");const b=$("#signInBtn"),t=b.textContent;b.disabled=true;b.textContent="Signing in…";try{await signIn(email,password);$("#syncPassword").value="";await cloudSync();alert("Signed in successfully. Automatic cloud sync is active.");}catch(e){alert(e.message);}finally{b.disabled=false;b.textContent=t;}};
$("#signOutBtn").onclick=async()=>{if(signedIn()){try{await fetch(`${syncSettings.url.replace(/\/$/,"")}/auth/v1/logout`,{method:"POST",headers:authHeaders(true)});}catch{}}syncSession=null;localStorage.removeItem(SESSION_KEY);renderSyncStatus();};
$("#syncNowBtn").onclick=()=>cloudSync(true);

$("#exportBackup").onclick=()=>{const blob=new Blob([JSON.stringify({version:5,exportedAt:new Date().toISOString(),books,genres},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`reading-room-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);};
$("#importBackupBtn").onclick=()=>$("#importBackupInput").click();
$("#importBackupInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.books))throw Error();if(!confirm(`Restore ${d.books.length} books? This replaces current local data.`))return;books=d.books;if(Array.isArray(d.genres))genres=d.genres;localStorage.setItem(BOOK_KEY,JSON.stringify(books));localStorage.setItem(GENRE_KEY,JSON.stringify(genres));markChanged();renderAll();cloudSync();alert("Backup restored.");}catch{alert("Invalid Reading Room backup.");}e.target.value="";};

renderGenreOptions();renderAll();renderSyncStatus();cloudSync();
window.addEventListener("focus",()=>{if(signedIn())cloudSync();});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&signedIn())cloudSync();});
window.addEventListener("online",()=>{if(signedIn())cloudSync();});
setInterval(()=>{if(document.visibilityState==="visible"&&signedIn())cloudSync();},60000);

/* PWA auto-update without stale app-shell cache */
if("serviceWorker" in navigator){
  window.addEventListener("load",async()=>{
    try{
      const reg=await navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"});await reg.update();
      let refreshing=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(refreshing)return;refreshing=true;location.reload();});
      document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update().catch(()=>{});});
    }catch(e){console.warn("Service worker:",e);}
  });
}
console.info(`Reading Room v${APP_VERSION}`);
