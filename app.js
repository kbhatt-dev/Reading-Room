const APP_VERSION="6.7.2";
const icon=n=>`<svg class="ui-icon" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
const BOOK_KEY="readingRoomBooksV1";
const GENRE_KEY="readingRoomGenresV1";
const SYNC_KEY="readingRoomSyncSettingsV2";
const SESSION_KEY="readingRoomSupabaseSessionV2";
const CHANGE_KEY="readingRoomLastChangedV2";
const SYNCED_KEY="readingRoomLastSyncedV2";
const DECOR_KEY="readingRoomDecorV1";
const GOAL_KEY="readingRoomGoalsV1";
const LAST_BACKUP_KEY="readingRoomLastBackupExportV1";

const DEFAULT_GENRES=["Thriller","Mystery","Horror","Romance","Fantasy","Science Fiction","Contemporary","Historical Fiction","Literary Fiction","Non-Fiction","Biography","Self-Help","Other"];

let books=JSON.parse(localStorage.getItem(BOOK_KEY)||"[]");
let genres=JSON.parse(localStorage.getItem(GENRE_KEY)||"null")||[...DEFAULT_GENRES];
let syncSettings=JSON.parse(localStorage.getItem(SYNC_KEY)||"null")||{url:"",key:""};
let syncSession=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
let selectedRating=0;
let workingCover="";
let lastRoute="home";
let justFinishedBookId=null;
let activeFullBookId=null;
let sessionsManagerBookId=null;
let decorSettings=JSON.parse(localStorage.getItem(DECOR_KEY)||"null");
let goalSettings=JSON.parse(localStorage.getItem(GOAL_KEY)||"null")||{yearly:{}};
if(!goalSettings.yearly || typeof goalSettings.yearly!=="object")goalSettings.yearly={};
if(!goalSettings.monthly || typeof goalSettings.monthly!=="object")goalSettings.monthly={};
if(!decorSettings || !decorSettings.themes){
  const oldTheme=decorSettings?.theme||"classic";
  decorSettings={themes:{home:oldTheme,tbr:oldTheme,finished:oldTheme}};
  localStorage.setItem(DECOR_KEY,JSON.stringify(decorSettings));
}
decorSettings.themes??={home:"classic",tbr:"classic",finished:"classic"};
let activeDecorZone=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function todayISO(){return new Date().toISOString().slice(0,10);}
function statusLabel(s){return ({want:"TBR",reading:"Reading",finished:"Finished",dnf:"DNF"})[s]||s;}
function genreIcon(name=""){
  const g=name.toLowerCase();
  if(g.includes("thriller")||g.includes("mystery"))return"search";
  if(g.includes("romance"))return"heart";
  if(g.includes("fantasy")||g.includes("science fiction"))return"sparkle";
  if(g.includes("historical")||g.includes("biography")||g.includes("non-fiction")||g.includes("nonfiction")||g.includes("self-help")||g.includes("literary"))return"note";
  return"genre";
}
function formatIcon(){return"format";}
function stars(r){r=Number(r)||0;if(!r)return"Not rated";return `${"★".repeat(Math.floor(r))}${r%1?"½":""} ${r}/5`;}
function pct(b){if(!b.pages||!b.currentPage)return 0;return Math.min(100,Math.round((Number(b.currentPage)/Number(b.pages))*100));}
function bookYear(b){const raw=b.dateFinished||b.dateStarted;if(raw){const y=new Date(raw+"T00:00:00").getFullYear();if(!Number.isNaN(y))return y;}return new Date().getFullYear();}
function dateDiffDays(a,b){if(!a||!b)return null;const d=Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);return Number.isFinite(d)&&d>=0?d:null;}
function yearlyGoal(year){return Math.max(0,Number(goalSettings.yearly?.[String(year)])||0);}
function yearlyFinishedCount(year){return books.filter(b=>b.status==="finished"&&bookYear(b)===Number(year)).length;}
function goalProgress(year){
  const target=yearlyGoal(year),finished=yearlyFinishedCount(year);
  return {target,finished,percent:target?Math.min(100,Math.round(finished/target*100)):0,remaining:target?Math.max(0,target-finished):0};
}
function saveYearlyGoal(year,target){
  const value=Math.max(1,Math.min(999,Math.round(Number(target)||0)));
  if(!value)return false;
  goalSettings.yearly[String(year)]=value;
  localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));
  markChanged();renderAll();cloudSync();return true;
}

function sessionMinutes(b){return (Array.isArray(b.sessions)?b.sessions:[]).reduce((n,s)=>n+(Number(s.minutes)||0),0);}
function moodLabel(value=""){
  const map={
    loved:"Loved it",intense:"Intense","mind-blown":"Mind blown",emotional:"Emotional",cozy:"Cozy",neutral:"Neutral",
    "😍":"Loved it","😱":"Intense","🤯":"Mind blown","😭":"Emotional","😌":"Cozy","😐":"Neutral"
  };
  return map[value]||value||"No mood";
}

function detectiveScoreForBook(b){
  if(!b.prediction || !b.predictionResult)return null;
  if(b.predictionResult==="yes")return 100;
  if(b.predictionResult==="partial")return 50;
  if(b.predictionResult==="no")return 0;
  return null;
}
function detectiveLabel(score){
  if(score===null)return "No score";
  if(score>=90)return "Master Detective";
  if(score>=70)return "Sharp Reader";
  if(score>=50)return "Good Hunch";
  if(score>0)return "Close Call";
  return "Plot Twist Won";
}
function progressHTML(b){
  const current=Number(b.currentPage)||0,total=Number(b.pages)||0;
  if(total>0){
    const percent=Math.min(100,Math.max(0,Math.round(current/total*100)));
    return `<div class="progress-wrap"><div class="progress"><span style="width:${percent}%"></span></div><span class="progress-percent">${percent}%</span></div>
      <div class="progress-copy"><span class="progress-primary">Page ${current} of ${total}</span><span class="progress-secondary">${Math.max(0,total-current)} pages remaining</span></div>`;
  }
  return `<div class="progress-wrap"><div class="progress no-total"><span></span></div><span class="progress-percent">Page ${current}</span></div>
    <div class="progress-copy"><span class="progress-primary">Current page: ${current}</span><span class="progress-secondary">Set total pages to calculate %</span></div>`;
}
function coverHTML(b,cls="cover"){return b.cover?`<img class="${cls}" src="${b.cover}" alt="${escapeHtml(b.title)} cover">`:`<div class="${cls} placeholder">${escapeHtml(b.title||"Book")}</div>`;}


/* V6.7.1 Ultra-Light Covers.
   New and existing embedded covers are converted to compact WebP thumbnails.
   Goal: roughly 25–40 KB for typical book covers while keeping shelf text/art readable. */
const COVER_MAX_W=280,COVER_MAX_H=420,COVER_QUALITY=.58,COVER_TARGET_BYTES=8*1024,COVER_SOFT_MAX_BYTES=10*1024,COVER_HARD_INPUT_BYTES=12*1024*1024;
function dataUrlBytes(s=""){const i=s.indexOf(",");return i<0?0:Math.ceil((s.length-i-1)*3/4);}
function readBlobAsDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("This image format could not be processed."));img.src=src;});}
async function compressCoverSource(src,{force=false}={}){
  if(!src||!String(src).startsWith("data:image/"))return src;
  const originalBytes=dataUrlBytes(src);
  if(!force&&src.startsWith("data:image/webp")&&originalBytes<=COVER_SOFT_MAX_BYTES)return src;

  const img=await loadImage(src),ratio=Math.min(1,COVER_MAX_W/img.naturalWidth,COVER_MAX_H/img.naturalHeight);
  let w=Math.max(1,Math.round(img.naturalWidth*ratio)),
      h=Math.max(1,Math.round(img.naturalHeight*ratio)),
      quality=COVER_QUALITY,
      best=src,
      bestBytes=originalBytes||Number.MAX_SAFE_INTEGER;

  for(let pass=0;pass<12;pass++){
    const c=document.createElement("canvas");
    c.width=w;c.height=h;
    const ctx=c.getContext("2d",{alpha:false});
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.fillStyle="#f7f0e7";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
    const blob=await new Promise(resolve=>c.toBlob(resolve,"image/webp",quality));
    if(!blob)break;

    if(blob.size<bestBytes){
      best=await readBlobAsDataURL(blob);
      bestBytes=blob.size;
    }
    if(blob.size<=COVER_TARGET_BYTES)break;

    quality=Math.max(.30,quality-.045);
    if(pass>=2){
      w=Math.max(170,Math.round(w*.90));
      h=Math.max(255,Math.round(h*.90));
    }
  }
  return bestBytes<originalBytes?best:src;
}
async function optimizeCoverFile(file){
  if(!file?.type?.startsWith("image/"))throw new Error("Please choose an image file for the cover.");
  if(file.size>COVER_HARD_INPUT_BYTES)throw new Error("That cover is over 12 MB. Please choose a smaller image.");
  return compressCoverSource(await readBlobAsDataURL(file),{force:true});
}
async function optimizeExistingCovers(){
  let changed=0,before=0,after=0;
  for(const b of books){
    if(!b.cover||!String(b.cover).startsWith("data:image/"))continue;
    const oldBytes=dataUrlBytes(b.cover);before+=oldBytes;
    if(String(b.cover).startsWith("data:image/webp")&&oldBytes<=COVER_SOFT_MAX_BYTES){after+=oldBytes;continue;}
    try{
      const optimized=await compressCoverSource(b.cover,{force:true}),newBytes=dataUrlBytes(optimized);
      if(newBytes&&newBytes<oldBytes){
        /* Replace the old embedded cover in-place. No second copy is retained. */
        b.cover=optimized;changed++;after+=newBytes;
      }else after+=oldBytes;
    }catch{after+=oldBytes;}
  }
  if(changed){
    localStorage.setItem(BOOK_KEY,JSON.stringify(books));
    markChanged();
    renderAll();
  }
  return {changed,before,after};
}
function coverKey(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return `c${(h>>>0).toString(36)}_${s.length}`;}
function packBooksForStorage(sourceBooks){
  const covers={};
  const packed=sourceBooks.map(b=>{if(!b.cover||!String(b.cover).startsWith("data:image/"))return {...b};const key=coverKey(b.cover);covers[key]=b.cover;const copy={...b,coverRef:key};delete copy.cover;return copy;});
  return {books:packed,covers};
}
function unpackBooksFromStorage(payload){
  const list=Array.isArray(payload?.books)?payload.books:[];const covers=payload?.covers&&typeof payload.covers==="object"?payload.covers:{};
  return list.map(b=>b.coverRef?{...b,cover:covers[b.coverRef]||""}:{...b});
}
function persistentSyncPayload(){const packed=packBooksForStorage(books);return {books:packed.books,covers:packed.covers,genres,decorSettings,goalSettings,storageVersion:3};}

function markChanged(){localStorage.setItem(CHANGE_KEY,String(Date.now()));}
function saveBooks({sync=true}={}){
  localStorage.setItem(BOOK_KEY,JSON.stringify(books));markChanged();renderAll();if(sync)cloudSync();
}
function saveGenres({sync=true}={}){
  localStorage.setItem(GENRE_KEY,JSON.stringify(genres));markChanged();renderGenreOptions();renderAll();if(sync)cloudSync();
}

function routeTo(route,{replace=false}={}){
  const valid=["home","tbr","reading","finished","book-detail","stats","sync"];
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
    bookSelect.innerHTML=`<option value="">Choose genre…</option>`+list.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    bookSelect.value=current||"";
  }
  ["tbrGenre","finishedGenre"].forEach(id=>{
    const el=$("#"+id);if(!el)return;const current=el.value||"all";
    el.innerHTML=`<option value="all">All genres</option>`+genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
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


function decorThemeFor(zone){
  if(zone?.startsWith("finished-")) return decorSettings.themes?.[zone]||decorSettings.themes?.finished||"classic";
  return decorSettings.themes?.[zone]||"classic";
}

function applyDecorations(){
  $$("[data-decor-zone]").forEach(root=>{
    const zone=root.dataset.decorZone;
    root.dataset.shelfTheme=decorThemeFor(zone);
    root.querySelectorAll(".decor-layer").forEach(x=>x.remove());
  });

  $$(".year-block .full-bookcase").forEach(root=>{
    const zone=root.dataset.decorZone||"finished";
    root.dataset.shelfTheme=decorThemeFor(zone);
    root.querySelectorAll(".decor-layer").forEach(x=>x.remove());
  });
}

function saveDecorSettings({sync=true}={}){
  localStorage.setItem(DECOR_KEY,JSON.stringify(decorSettings));
  markChanged();
  applyDecorations();
  if(sync)cloudSync();
}


function advancedSearchHaystack(b){
  const sessions=(Array.isArray(b.sessions)?b.sessions:[]).map(s=>[s.notes,s.mood,s.date,s.sessionDate].filter(Boolean).join(" ")).join(" ");
  return [
    b.title,b.author,b.status,b.genre,b.format,b.pages,b.dateStarted,b.dateFinished,b.rating,
    b.review,b.spoilers,b.favoriteCharacter,b.favoriteScene,b.favoriteQuote,b.prediction,
    b.predictionResult,sessions
  ].filter(v=>v!==undefined&&v!==null).join(" ").toLowerCase();
}
function populateAdvancedSearchFilters(){
  const genre=$("#advancedSearchGenre"),year=$("#advancedSearchYear");if(!genre||!year)return;
  const oldGenre=genre.value||"all",oldYear=year.value||"all";
  const usedGenres=[...new Set(books.map(b=>b.genre).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  genre.innerHTML=`<option value="all">All genres</option>`+usedGenres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
  genre.value=usedGenres.includes(oldGenre)?oldGenre:"all";
  const years=[...new Set(books.map(bookYear).filter(Boolean))].sort((a,b)=>b-a);
  year.innerHTML=`<option value="all">All years</option>`+years.map(y=>`<option value="${y}">${y}</option>`).join("");
  year.value=years.map(String).includes(oldYear)?oldYear:"all";
}
function renderAdvancedSearch(){
  const root=$("#advancedSearchResults");if(!root)return;
  populateAdvancedSearchFilters();
  const q=($("#advancedSearchQuery").value||"").trim().toLowerCase(),
        status=$("#advancedSearchStatus").value,
        genre=$("#advancedSearchGenre").value,
        year=$("#advancedSearchYear").value,
        rating=$("#advancedSearchRating").value;
  const hasFilter=q||status!=="all"||genre!=="all"||year!=="all"||rating!=="all";
  const results=hasFilter?books.filter(b=>{
    if(q&&!advancedSearchHaystack(b).includes(q))return false;
    if(status!=="all"&&b.status!==status)return false;
    if(genre!=="all"&&b.genre!==genre)return false;
    if(year!=="all"&&String(bookYear(b))!==year)return false;
    if(rating!=="all"&&(Number(b.rating)||0)<Number(rating))return false;
    return true;
  }):[];
  $("#advancedSearchCount").textContent=`${results.length} ${results.length===1?"result":"results"}`;
  root.innerHTML=results.map(b=>`<button class="advanced-result-card" onclick="openBook('${b.id}')">
    ${coverHTML(b,"advanced-result-cover")}
    <span class="advanced-result-copy"><strong>${escapeHtml(b.title||"Untitled")}</strong><small>${escapeHtml(b.author||"Unknown author")} · ${statusLabel(b.status)}${b.genre?` · ${escapeHtml(b.genre)}`:""}${b.status==="finished"&&b.rating?` · ${escapeHtml(stars(b.rating))}`:""}</small>
    <span>${b.favoriteQuote?`Quote: “${escapeHtml(String(b.favoriteQuote).slice(0,100))}${String(b.favoriteQuote).length>100?"…":""}”`:b.review?`${escapeHtml(String(b.review).slice(0,120))}${String(b.review).length>120?"…":""}`:"Open book details"}</span></span>
  </button>`).join("");
  const empty=$("#advancedSearchEmpty");empty.classList.toggle("hidden",results.length>0);
  empty.textContent=hasFilter?"No books matched those search filters.":"Start typing or use filters to search your library.";
}

function currentMonthKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function finishedInMonth(key){return books.filter(b=>b.status==="finished"&&String(b.dateFinished||"").slice(0,7)===key).length;}
function achievementStats(){
  const finished=books.filter(b=>b.status==="finished"),pages=finished.reduce((n,b)=>n+(Number(b.pages)||0),0),minutes=books.reduce((n,b)=>n+sessionMinutes(b),0),sessions=books.reduce((n,b)=>n+(Array.isArray(b.sessions)?b.sessions.length:0),0);
  return {finished,pages,minutes,sessions};
}
function achievementDefinitions(){
  const s=achievementStats();
  return [
    {name:"First Chapter",note:"Finish your first book",value:s.finished.length,target:1},
    {name:"Shelf Starter",note:"Finish 10 books",value:s.finished.length,target:10},
    {name:"Book Lover",note:"Finish 25 books",value:s.finished.length,target:25},
    {name:"Library Builder",note:"Finish 50 books",value:s.finished.length,target:50},
    {name:"1,000 Pages",note:"Read 1,000 finished-book pages",value:s.pages,target:1000},
    {name:"5,000 Pages",note:"Read 5,000 finished-book pages",value:s.pages,target:5000},
    {name:"Reading Ritual",note:"Log 10 reading sessions",value:s.sessions,target:10},
    {name:"Time Well Spent",note:"Log 1,000 reading minutes",value:s.minutes,target:1000}
  ];
}
function renderReadingExtras(){
  if(!$("#readingFunDetails")?.open)return;
  const defs=achievementDefinitions(),unlocked=defs.filter(a=>a.value>=a.target).length;
  $("#achievementCount").textContent=`${unlocked} of ${defs.length} unlocked`;
  $("#achievementGrid").innerHTML=defs.map(a=>{const done=a.value>=a.target,p=Math.min(100,Math.round(a.value/a.target*100));return `<article class="achievement-badge ${done?"unlocked":"locked"}"><span class="achievement-mark">${done?icon("trophy"):icon("lock")}</span><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.note)}</small><div class="mini-progress"><span style="width:${p}%"></span></div><em>${done?"Unlocked":`${Math.min(a.value,a.target).toLocaleString()} / ${a.target.toLocaleString()}`}</em></article>`;}).join("");
  const key=currentMonthKey(),target=Math.max(0,Number(goalSettings.monthly[key])||0),finished=finishedInMonth(key),percent=target?Math.min(100,Math.round(finished/target*100)):0,remaining=Math.max(0,target-finished);
  $("#monthlyChallengeCount").textContent=target?`${finished} of ${target} books`:`${finished} finished this month`;
  $("#monthlyChallengePercent").textContent=target?`${percent}%`:"No challenge set";
  $("#monthlyChallengeBar").style.width=`${percent}%`;
  $("#monthlyChallengeMessage").textContent=target?(remaining?`${remaining} ${remaining===1?"book":"books"} to complete this month's challenge.`:"Challenge complete — nicely done."):"Set an optional target if you want a little extra motivation.";
}
let randomPickedBookId=null;
function chooseRandomTbr(){
  const list=books.filter(b=>b.status==="want");if(!list.length){alert("Your TBR shelf is empty.");return;}
  const b=list[Math.floor(Math.random()*list.length)];randomPickedBookId=b.id;
  $("#randomPickResult").innerHTML=`<div class="random-pick-book">${coverHTML(b,"random-pick-cover")}<div><span class="count-pill">Random pick</span><h3>${escapeHtml(b.title)}</h3><p class="muted">${escapeHtml(b.author||"Unknown author")}${b.genre?` · ${escapeHtml(b.genre)}`:""}</p><p>This one gets the spotlight from your TBR.</p></div></div>`;
}
function renderHome(){
  const finished=books.filter(b=>b.status==="finished");
  const reading=books.filter(b=>b.status==="reading");
  const tbr=books.filter(b=>b.status==="want");
  $("#homeFinishedCount").textContent=finished.length;
  $("#homeSummary").textContent=finished.length?`You have finished ${finished.length} ${finished.length===1?"book":"books"} in your library.`:"Start filling your shelves.";
  $("#homeReading").innerHTML=reading.slice(0,3).map(b=>`<article class="reading-feature">
    ${coverHTML(b)}
    <div><p class="eyebrow">Reading</p><h3>${escapeHtml(b.title)}</h3><p class="meta">${escapeHtml(b.author||"Unknown author")}</p>
    ${progressHTML(b)}
    <button class="secondary compact" onclick="openBook('${b.id}')">Open</button></div></article>`).join("");
  $("#homeReadingEmpty").classList.toggle("hidden",reading.length>0);
  $("#homeFinishedShelf").innerHTML=finished.slice(0,9).map(woodBook).join("");
  $("#homeTbrShelf").innerHTML=tbr.slice(0,9).map(woodBook).join("");
  const favs=books.filter(b=>b.favoriteBook);
  $("#homeFavoritesSection").classList.toggle("hidden",favs.length===0);
  $("#homeFavorites").innerHTML=favs.map(b=>`<button class="cover-card" onclick="openBook('${b.id}')">${coverHTML(b)}<span>${escapeHtml(b.title)}</span></button>`).join("");

  const goalYear=new Date().getFullYear(),goal=goalProgress(goalYear);
  $("#homeGoalYear").textContent=goalYear;
  $("#homeGoalCount").textContent=goal.target?`${goal.finished} of ${goal.target} books`:`${goal.finished} books finished`;
  $("#homeGoalPercent").textContent=goal.target?`${goal.percent}%`:`No goal set`;
  $("#homeGoalBar").style.width=`${goal.percent}%`;
  $("#homeGoalMessage").textContent=goal.target?(goal.remaining?`${goal.remaining} ${goal.remaining===1?"book":"books"} to go.`:`Goal reached — every extra book is a bonus.`):`Set a yearly goal in Stats and your progress will update automatically.`;

  renderReadingExtras();
  applyDecorations();
}
function renderTbr(){
  const q=$("#tbrSearch").value.trim().toLowerCase(),g=$("#tbrGenre").value;
  const list=books.filter(b=>b.status==="want").filter(b=>(!q||`${b.title} ${b.author}`.toLowerCase().includes(q))&&(g==="all"||b.genre===g));
  $("#tbrCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  $("#tbrShelf").innerHTML=list.map(shelfCard).join("");
  $("#tbrEmpty").classList.toggle("hidden",list.length>0);

  const dnf=books.filter(b=>b.status==="dnf").filter(b=>(!q||`${b.title} ${b.author}`.toLowerCase().includes(q))&&(g==="all"||b.genre===g));
  $("#dnfArchiveSection").classList.toggle("hidden",dnf.length===0);
  $("#dnfCount").textContent=`${dnf.length} ${dnf.length===1?"book":"books"}`;
  $("#dnfShelf").innerHTML=dnf.map(b=>`<button class="dnf-card" onclick="openBook('${b.id}')">${coverHTML(b)}<strong>${escapeHtml(b.title)}</strong><small>${escapeHtml(b.author||"Unknown author")}</small></button>`).join("");
}
function readingCard(b){const sessions=Array.isArray(b.sessions)?b.sessions:[];return `<article class="reading-card">
  <div class="reading-card-top">${coverHTML(b)}<div><p class="eyebrow">Reading</p><h3>${escapeHtml(b.title)}</h3><p class="meta">${escapeHtml(b.author||"Unknown author")}</p>
  ${progressHTML(b)}
  <p class="meta">Started ${b.dateStarted||"not set"} · ${sessionMinutes(b)} min logged · ${sessions.length} ${sessions.length===1?"session":"sessions"}</p></div></div>
  <div class="card-actions three-actions">
    <button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Book</button>
    <button class="primary" onclick="openSession('${b.id}')">${icon("session")} Add Session</button>
    <button class="secondary" onclick="openSessionsManager('${b.id}')">${icon("list")} Sessions (${sessions.length})</button>
  </div>
</article>`;}
function renderReading(){
  const list=books.filter(b=>b.status==="reading");
  $("#readingCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  $("#readingGrid").innerHTML=list.map(readingCard).join("");
  $("#readingEmpty").classList.toggle("hidden",list.length>0);
}
function journalSearchText(b){return [b.title,b.author,b.review,b.spoilers,b.favoriteCharacter,b.favoriteScene,b.favoriteQuote,b.prediction,b.predictionResult].filter(Boolean).join(" ").toLowerCase();}
function renderJournalCollections(){
  const finished=books.filter(b=>b.status==="finished");
  const qq=($("#quoteSearch")?.value||"").trim().toLowerCase(),quotes=finished.filter(b=>b.favoriteQuote&&(!qq||`${b.favoriteQuote} ${b.title} ${b.author}`.toLowerCase().includes(qq)));
  $("#quoteCount").textContent=`${quotes.length} ${quotes.length===1?"quote":"quotes"}`;
  $("#quotesCollection").innerHTML=quotes.map(b=>`<button class="quote-collection-item" onclick="openFullBook('${b.id}')"><blockquote>“${escapeHtml(b.favoriteQuote)}”</blockquote><span>${escapeHtml(b.title)} · ${escapeHtml(b.author||"Unknown author")}</span></button>`).join("");
  $("#quotesEmpty").classList.toggle("hidden",quotes.length>0);
  const mq=($("#memorySearch")?.value||"").trim().toLowerCase(),results=mq?finished.filter(b=>journalSearchText(b).includes(mq)):[];
  $("#memoryResults").innerHTML=results.map(b=>{const pieces=[b.review,b.spoilers,b.favoriteCharacter,b.favoriteScene,b.prediction,b.favoriteQuote].filter(Boolean);const match=pieces.find(x=>String(x).toLowerCase().includes(mq))||pieces[0]||"Open this book to view its journal.";return `<button class="memory-result" onclick="openFullBook('${b.id}')"><strong>${escapeHtml(b.title)}</strong><small>${escapeHtml(b.author||"Unknown author")}</small><p>${escapeHtml(String(match).slice(0,180))}${String(match).length>180?"…":""}</p></button>`;}).join("");
  $("#memorySearchHint").textContent=mq?(results.length?`${results.length} ${results.length===1?"book":"books"} found.`:"No saved memories matched that search."):"Search across the journal information you already saved.";
}

function renderFinished(){
  if($("#journalTools")?.open)renderJournalCollections();
  const q=$("#finishedSearch").value.trim().toLowerCase(),g=$("#finishedGenre").value,y=$("#finishedYear").value;
$("#quoteSearch").addEventListener("input",renderJournalCollections);$("#memorySearch").addEventListener("input",renderJournalCollections);
$("#journalTools")?.addEventListener("toggle",e=>{const hint=e.currentTarget.querySelector(".journal-tools-hint");if(hint)hint.textContent=e.currentTarget.open?"Close":"Open";if(e.currentTarget.open)renderJournalCollections();});
  const all=books.filter(b=>b.status==="finished");
  const years=[...new Set(all.map(bookYear))].sort((a,b)=>b-a);
  const old=$("#finishedYear").value||"all";
  $("#finishedYear").innerHTML=`<option value="all">All years</option>`+years.map(x=>`<option value="${x}">${x}</option>`).join("");
  $("#finishedYear").value=years.map(String).includes(old)?old:"all";
  const yy=$("#finishedYear").value;
  const list=all.filter(b=>(!q||`${b.title} ${b.author}`.toLowerCase().includes(q))&&(g==="all"||b.genre===g)&&(yy==="all"||String(bookYear(b))===yy));
  $("#finishedCount").textContent=`${list.length} ${list.length===1?"book":"books"}`;
  const groups={};list.forEach(b=>(groups[bookYear(b)]??=[]).push(b));
  $("#finishedYearShelves").innerHTML=Object.keys(groups).sort((a,b)=>b-a).map(year=>`<section class="year-block">
    <div class="year-shelf-heading"><h2>${year} Shelf</h2><button class="secondary compact customize-shelf-btn year-customize-btn" data-customize-zone="finished-${year}">${icon("palette")} Customize Shelf</button></div>
    <div class="full-bookcase custom-decor-zone" data-decor-zone="finished-${year}">
      <div class="large-shelf-grid">${groups[year].map(shelfCard).join("")}</div><div class="wood-board"></div>
    </div></section>`).join("");
  $("#finishedEmpty").classList.toggle("hidden",list.length>0);

  applyDecorations();
}
function renderAll(){renderGenreOptions();renderHome();renderTbr();renderReading();renderFinished();populateAdvancedSearchFilters();if(lastRoute==="stats")renderStats();}

function countBy(list,key){return list.reduce((a,b)=>{const v=b[key]||"Unknown";a[v]=(a[v]||0)+1;return a;},{});}
function topKey(o){return Object.entries(o).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";}
function renderStatRows(target,obj){
  const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...entries.map(x=>x[1]));
  $(target).innerHTML=entries.length?entries.map(([n,v])=>`<div class="stat-row"><span>${escapeHtml(n)}</span><div class="stat-track"><span style="width:${v/max*100}%"></span></div><small>${v}</small></div>`).join(""):`<p class="muted">No data yet.</p>`;
}
function sessionDateValue(s){return s?.date||s?.sessionDate||s?.createdDate||s?.createdAt?.slice?.(0,10)||"";}
function sessionsForYear(year){
  const rows=[];books.forEach(b=>(Array.isArray(b.sessions)?b.sessions:[]).forEach(s=>{const date=sessionDateValue(s);if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number(date.slice(0,4))===Number(year))rows.push({...s,_date:date,_bookId:b.id});}));return rows;
}
function activityByDate(year){const map={};sessionsForYear(year).forEach(s=>{map[s._date]=(map[s._date]||0)+(Number(s.minutes)||0);});return map;}
function streakStats(activity,year){
  const dates=Object.keys(activity).filter(d=>activity[d]>0).sort();if(!dates.length)return {current:0,longest:0};
  const ord=d=>Math.floor(new Date(d+"T12:00:00").getTime()/86400000);let longest=1,run=1;
  for(let i=1;i<dates.length;i++){if(ord(dates[i])-ord(dates[i-1])===1){run++;longest=Math.max(longest,run);}else run=1;}
  const today=todayISO(),yearEnd=`${year}-12-31`,anchor=String(year)===today.slice(0,4)?today:yearEnd;let current=0,cursor=ord(anchor),set=new Set(dates.map(ord));
  /* A streak stays current through today if the reader read today or yesterday. */
  if(!set.has(cursor)&&set.has(cursor-1))cursor--;while(set.has(cursor)){current++;cursor--;}
  return {current,longest};
}
function renderReadingHeatmap(year,activity){
  const root=$("#readingHeatmap"),empty=$("#heatmapEmpty");if(!root)return;const start=new Date(year,0,1,12),end=new Date(year,11,31,12),max=Math.max(1,...Object.values(activity));
  const days=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,minutes=activity[date]||0,level=!minutes?0:Math.min(4,Math.max(1,Math.ceil(minutes/max*4)));days.push(`<span class="heat-day" data-level="${level}" title="${date}: ${minutes} min" aria-label="${date}, ${minutes} minutes"></span>`);}
  root.innerHTML=`<div class="heat-spacer" style="--offset:${start.getDay()}"></div>`+days.join("");empty.classList.toggle("hidden",Object.keys(activity).length>0);$("#heatmapTitle").textContent=`${year} Reading Calendar`;
}

function renderStats(){
  const years=[...new Set(books.filter(b=>b.status==="finished").map(bookYear))].sort((a,b)=>b-a);const current=new Date().getFullYear();if(!years.includes(current))years.unshift(current);
  const old=Number($("#statsYear").value)||current;$("#statsYear").innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join("");$("#statsYear").value=years.includes(old)?old:years[0];
  const year=Number($("#statsYear").value),list=books.filter(b=>b.status==="finished"&&bookYear(b)===year),rated=list.filter(b=>Number(b.rating)>0);
  const goal=goalProgress(year);
  $("#goalYearLabel").textContent=year;
  $("#yearlyGoalInput").value=goal.target||"";
  $("#statsGoalCount").textContent=goal.target?`${goal.finished} of ${goal.target} books`:`${goal.finished} books finished`;
  $("#statsGoalPercent").textContent=goal.target?`${goal.percent}%`:`No goal set`;
  $("#statsGoalBar").style.width=`${goal.percent}%`;
  $("#statsGoalMessage").textContent=goal.target?(goal.remaining?`${goal.remaining} ${goal.remaining===1?"book":"books"} remaining for ${year}.`:`You reached your ${year} reading goal.`):`Choose how many books you want to finish in ${year}.`;
  $("#statBooks").textContent=list.length;$("#statPages").textContent=list.reduce((n,b)=>n+(Number(b.pages)||0),0).toLocaleString();
  $("#statRating").textContent=rated.length?(rated.reduce((n,b)=>n+Number(b.rating),0)/rated.length).toFixed(1):"—";
  $("#statGenre").textContent=topKey(countBy(list,"genre"));$("#statAuthor").textContent=topKey(countBy(list,"author"));
  $("#statMinutes").textContent=list.reduce((n,b)=>n+sessionMinutes(b),0).toLocaleString();
  const withDays=list.map(b=>({b,d:dateDiffDays(b.dateStarted,b.dateFinished)})).filter(x=>x.d!==null).sort((a,b)=>a.d-b.d);
  $("#statFastest").textContent=withDays.length?`${withDays[0].d}d`:"—";
  const longest=[...list].sort((a,b)=>(Number(b.pages)||0)-(Number(a.pages)||0))[0];$("#statLongest").textContent=longest?.pages?`${longest.pages}p`:"—";
  const detectiveBooks=list.map(b=>detectiveScoreForBook(b)).filter(v=>v!==null);
  $("#statDetective").textContent=detectiveBooks.length?`${Math.round(detectiveBooks.reduce((a,b)=>a+b,0)/detectiveBooks.length)}%`:"—";
  const months=Array(12).fill(0);list.forEach(b=>{if(b.dateFinished){const d=new Date(b.dateFinished+"T00:00:00");if(!Number.isNaN(d))months[d.getMonth()]++;}});
  const max=Math.max(1,...months),names=["J","F","M","A","M","J","J","A","S","O","N","D"];
  $("#monthlyBars").innerHTML=months.map((n,i)=>`<div class="bar-col"><div class="bar-fill" style="height:${Math.max(2,n/max*100)}%"><b>${n||""}</b></div><small>${names[i]}</small></div>`).join("");
  renderStatRows("#genreStats",countBy(list,"genre"));renderStatRows("#formatStats",countBy(list,"format"));
  const rc={};rated.forEach(b=>rc[String(b.rating)]=(rc[String(b.rating)]||0)+1);renderStatRows("#ratingStats",rc);
  const yearSessions=sessionsForYear(year),activity=activityByDate(year),streak=streakStats(activity,year),totalSessionMinutes=yearSessions.reduce((n,s)=>n+(Number(s.minutes)||0),0);
  $("#statActiveDays").textContent=Object.keys(activity).length;
  $("#statSessions").textContent=yearSessions.length;
  $("#statAvgSession").textContent=yearSessions.length?`${Math.round(totalSessionMinutes/yearSessions.length)} min`:`—`;
  $("#statCurrentStreak").textContent=`${streak.current} ${streak.current===1?"day":"days"}`;
  $("#statLongestStreak").textContent=`${streak.longest} ${streak.longest===1?"day":"days"}`;
  renderReadingHeatmap(year,activity);
}

function setDialogOpen(open){document.body.classList.toggle("dialog-open",open);}
$$("dialog").forEach(d=>d.addEventListener("close",()=>setDialogOpen($$("dialog").some(x=>x.open))));

function buildRatingPicker(){
  const p=$("#ratingPicker");p.innerHTML="";
  for(let r=.5;r<=5;r+=.5){const b=document.createElement("button");b.type="button";b.className="rating-chip";b.textContent=r;b.onclick=()=>{selectedRating=r;$("#rating").value=r;$$(".rating-chip").forEach(x=>x.classList.toggle("active",Number(x.textContent)===r));};p.appendChild(b);}
}
buildRatingPicker();

function formatBytes(n){if(!n)return "";return n<1024?`${n} B`:n<1024*1024?`${Math.round(n/1024)} KB`:`${(n/1024/1024).toFixed(1)} MB`;}
function updateCoverStorageInfo(){const el=$("#coverStorageInfo");if(el)el.textContent=workingCover?`Tiny cover · ${formatBytes(dataUrlBytes(workingCover))}`:"";}
function clearCover(){
  workingCover="";$("#coverInput").value="";$("#coverFileName").textContent="No file selected";$("#coverPreview").removeAttribute("src");$("#coverPreviewWrap").classList.add("hidden");updateCoverStorageInfo();
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
$("#chooseCoverBtn").onclick=()=>$("#coverInput").click();$("#replaceCover").onclick=()=>$("#coverInput").click();
$("#coverInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;$("#coverFileName").textContent="Optimizing cover…";try{workingCover=await optimizeCoverFile(f);$("#coverPreview").src=workingCover;$("#coverPreviewWrap").classList.remove("hidden");$("#coverFileName").textContent=`${f.name} · optimized`;updateCoverStorageInfo();}catch(err){workingCover="";$("#coverInput").value="";$("#coverFileName").textContent="No file selected";alert(err.message||"Could not optimize this cover image.");}};
$("#removeCover").onclick=clearCover;

window.editBook=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  resetBookForm();$("#dialogTitle").textContent="Edit Book";$("#deleteBookBtn").classList.remove("hidden");$("#bookId").value=b.id;
  ["title","author","status","format","pages","currentPage","dateStarted","dateFinished","prediction","review","spoilers","favoriteCharacter","favoriteScene","favoriteQuote","predictionResult"].forEach(k=>{const el=$("#"+k);if(el)el.value=b[k]??"";});
  $("#finishDateStarted").value=b.dateStarted||"";renderGenreOptions(b.genre||"");selectedRating=Number(b.rating)||0;$("#rating").value=selectedRating;
  $$(".rating-chip").forEach(x=>x.classList.toggle("active",Number(x.textContent)===selectedRating));$("#favoriteBook").checked=!!b.favoriteBook;
  workingCover=b.cover||"";if(workingCover){$("#coverPreview").src=workingCover;$("#coverPreviewWrap").classList.remove("hidden");$("#coverFileName").textContent="Saved cover";updateCoverStorageInfo();}
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
    favoriteCharacter:$("#favoriteCharacter").value.trim(),favoriteScene:$("#favoriteScene").value.trim(),favoriteQuote:$("#favoriteQuote").value.trim(),
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
  let extra="",actions="",detailClass="";

  if(b.status==="want"){
    extra=`<div class="reading-time-card"><strong>${icon("tbr")} TBR</strong><p class="meta">Move this book to Reading when you start it.</p></div>`;
    actions=`<button class="primary" onclick="editBook('${b.id}')">${icon("reading")} Start / Edit</button>`;
  }else if(b.status==="reading"){
    extra=`<div class="reading-time-card"><strong>Reading progress</strong>${progressHTML(b)}<p class="meta">Started ${b.dateStarted||"—"} · ${mins} min logged</p></div>
      ${b.prediction?`<div class="detail-section"><h3>${icon("note")} My Prediction</h3><p>${escapeHtml(b.prediction)}</p></div>`:""}`;
    actions=`<button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Book</button>
      <button class="primary" onclick="openSession('${b.id}')">${icon("session")} Add Session</button>
      <button class="secondary" onclick="openSessionsManager('${b.id}')">${icon("list")} Sessions (${sessions.length})</button>`;
  }else if(b.status==="finished"){
    detailClass="finished-compact";
    extra=`<div class="reading-time-card"><strong>Reading time</strong>
      <p class="finished-compact-copy meta">${days===null?"—":days+" "+(days===1?"day":"days")} · ${mins} min logged</p>
      <p class="meta">${b.dateStarted||"—"} → ${b.dateFinished||"—"}</p>
    </div>`;
    actions=`<button class="primary read-more-btn" onclick="openFullBook('${b.id}')">${icon("reading")} Read More</button>
      <button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Journal</button>`;
  }else{
    extra=`<div class="reading-time-card"><strong>DNF Archive</strong><p class="meta">This book is set aside. You can move it back to TBR or Reading whenever you want.</p></div>`;
    actions=`<button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Book</button>`;
  }

  $("#detailContent").innerHTML=`<div class="${detailClass}">
    <div class="detail-top">${coverHTML(b)}<div><p class="eyebrow">${statusLabel(b.status)}</p><h2>${escapeHtml(b.title)}</h2><p class="muted">${escapeHtml(b.author||"Unknown author")}</p>
      <div class="pills"><span class="pill">${icon(genreIcon(b.genre))} ${escapeHtml(b.genre||"No genre")}</span><span class="pill">${icon(formatIcon())} ${escapeHtml(b.format||"No format")}</span>${b.status==="finished"?`<span class="pill">${stars(b.rating)}</span>`:""}</div>
      ${b.status==="finished"&&b.pages?`<p class="meta">${b.pages} pages</p>`:""}
    </div></div>
    ${extra}
    <div class="detail-actions">${actions}<button class="secondary" onclick="document.getElementById('detailDialog').close()">Close</button></div>
  </div>`;
  $("#detailDialog").showModal();setDialogOpen(true);
};

window.openFullBook=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  activeFullBookId=id;
  $("#detailDialog").close();
  renderFullBookDetail(b);
  routeTo("book-detail");
};

function renderFullBookDetail(b){
  const mins=sessionMinutes(b),days=dateDiffDays(b.dateStarted,b.dateFinished),sessions=Array.isArray(b.sessions)?b.sessions:[];
  const predictionText=b.predictionResult==="yes"?"Correct":b.predictionResult==="no"?"Not quite":b.predictionResult==="partial"?"Partly right":"";
  $("#fullBookDetail").innerHTML=`
    <div class="full-detail-hero">
      ${coverHTML(b)}
      <div>
        <p class="eyebrow">${statusLabel(b.status)}</p>
        <h2>${escapeHtml(b.title)}</h2>
        <p class="muted">${escapeHtml(b.author||"Unknown author")}</p>
        <div class="pills">
          <span class="pill">${icon(genreIcon(b.genre))} ${escapeHtml(b.genre||"No genre")}</span>
          <span class="pill">${icon(formatIcon())} ${escapeHtml(b.format||"No format")}</span>
          <span class="pill">${stars(b.rating)}</span>
        </div>
        ${b.pages?`<p class="meta">${b.pages} pages</p>`:""}
        <div class="reading-time-card"><strong>Reading time</strong><p class="meta">${days===null?"—":days+" "+(days===1?"day":"days")} · ${mins} min logged</p><p class="meta">${b.dateStarted||"—"} → ${b.dateFinished||"—"}</p></div>
      </div>
    </div>

    ${b.review?`<div class="detail-section"><h3>My Thoughts</h3><p>${escapeHtml(b.review).replace(/\n/g,"<br>")}</p></div>`:""}

    ${(b.favoriteCharacter||b.favoriteScene)?`<div class="detail-section"><h3>Reading Memories</h3><div class="full-memory-grid">
      ${b.favoriteCharacter?`<div class="full-memory-card"><strong>Favourite Character</strong><span>${escapeHtml(b.favoriteCharacter)}</span></div>`:""}
      ${b.favoriteScene?`<div class="full-memory-card"><strong>Favourite Scene</strong><span>${escapeHtml(b.favoriteScene)}</span></div>`:""}
    </div></div>`:""}

    ${b.favoriteQuote?`<div class="detail-section"><h3>Favourite Quote</h3><div class="full-quote">“${escapeHtml(b.favoriteQuote)}”</div></div>`:""}

    ${b.prediction?`<div class="detail-section"><h3>${icon("note")} My Prediction</h3><p>${escapeHtml(b.prediction)}</p>${predictionText?`<span class="prediction-result">${predictionText}</span>`:""}</div>`:""}

    ${b.spoilers?`<div class="detail-section"><h3>Story Memory</h3><button class="secondary compact" onclick="this.nextElementSibling.classList.toggle('hidden')">Reveal / Hide</button><p class="hidden">${escapeHtml(b.spoilers).replace(/\n/g,"<br>")}</p></div>`:""}

    ${sessions.length?`<div class="detail-section"><h3>Reading Sessions</h3><div class="session-list">${sessions.map((s,i)=>`<div class="session-item">${escapeHtml(moodLabel(s.mood))} · Page ${s.startPage||0} → ${s.endPage||s.startPage||0} · ${s.minutes||0} min · ${s.date||""}</div>`).join("")}</div></div>`:""}

    ${b.favoriteBook?`<div class="detail-section"><span class="pill">${icon("heart")} Hall of Fame</span></div>`:""}

    ${detectiveScoreForBook(b)!==null?`<div class="detective-card">
      <div class="detective-row">
        <div><p class="eyebrow">Prediction accuracy</p><strong>${detectiveLabel(detectiveScoreForBook(b))}</strong></div>
        <span class="detective-badge">${icon("target")} ${detectiveScoreForBook(b)}%</span>
      </div>
    </div>`:""}

    <div class="detail-actions">
      <button class="secondary" onclick="editBook('${b.id}')">${icon("edit")} Edit Journal</button>
      <button class="secondary" onclick="routeTo('finished')">${icon("back")} Back to Finished</button>
    </div>`;
}


$("#bookDetailBack").onclick=()=>routeTo("finished");

window.openSession=(id,index=-1)=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  const sessions=Array.isArray(b.sessions)?b.sessions:[];
  const existing=index>=0?sessions[index]:null;

  $("#sessionBookId").value=id;
  $("#sessionIndex").value=String(index);
  $("#sessionDialogTitle").textContent=index>=0?"Edit Reading Session":"Add Reading Session";
  $("#sessionStart").value=existing?.startPage ?? b.currentPage ?? 0;
  $("#sessionEnd").value=existing?.endPage ?? "";
  $("#sessionMinutes").value=existing?.minutes ?? "";
  $("#sessionMood").value=normalizeMoodValue(existing?.mood||"");

  $("#detailDialog").close();
  if($("#sessionsDialog").open)$("#sessionsDialog").close();
  $("#sessionDialog").showModal();
  setDialogOpen(true);
};

function normalizeMoodValue(value=""){
  const legacy={"😍":"loved","😱":"intense","🤯":"mind-blown","😭":"emotional","😌":"cozy","😐":"neutral"};
  return legacy[value]||value||"";
}

window.openSessionsManager=id=>{
  const b=books.find(x=>x.id===id);if(!b)return;
  sessionsManagerBookId=id;
  renderSessionsManager(b);
  $("#detailDialog").close();
  $("#sessionsDialog").showModal();
  setDialogOpen(true);
};

function renderSessionsManager(b){
  const sessions=Array.isArray(b.sessions)?b.sessions:[];
  $("#sessionsTitle").textContent=`Reading Sessions — ${b.title}`;
  $("#sessionsSummary").innerHTML=`<strong>${sessions.length} ${sessions.length===1?"session":"sessions"}</strong><p class="meta">${sessionMinutes(b)} total minutes logged · Current page ${b.currentPage||0}</p>`;
  $("#sessionsManagerList").innerHTML=sessions.length?sessions.map((s,i)=>`
    <article class="session-manager-item">
      <div>
        <strong>Session ${i+1} · ${escapeHtml(moodLabel(s.mood))}</strong>
        <div class="session-manager-meta">Page ${s.startPage||0} → ${s.endPage||s.startPage||0} · ${s.minutes||0} min · ${s.date||"No date"}</div>
      </div>
      <div class="session-manager-actions">
        <button type="button" class="secondary compact" onclick="editReadingSession('${b.id}',${i})">${icon("edit")} Edit</button>
        <button type="button" class="danger compact" onclick="deleteReadingSession('${b.id}',${i})">${icon("trash")} Delete</button>
      </div>
    </article>`).join(""):`<div class="session-manager-empty">No reading sessions yet.</div>`;
}

window.editReadingSession=(id,index)=>openSession(id,index);

window.deleteReadingSession=(id,index)=>{
  const b=books.find(x=>x.id===id);if(!b||!Array.isArray(b.sessions)||!b.sessions[index])return;
  if(!confirm("Delete this reading session?"))return;
  b.sessions.splice(index,1);
  // Recalculate current page from the most recent session with an end/start page.
  const positions=b.sessions.map(s=>Number(s.endPage)||Number(s.startPage)||0).filter(Boolean);
  if(positions.length)b.currentPage=positions[positions.length-1];
  saveBooks();
  renderSessionsManager(b);
};

$("#closeSessionsDialog").onclick=()=>$("#sessionsDialog").close();
$("#addSessionFromManager").onclick=()=>{if(sessionsManagerBookId)openSession(sessionsManagerBookId,-1);};

$("#closeSessionDialog").onclick=()=>$("#sessionDialog").close();
$("#cancelSessionBtn").onclick=()=>$("#sessionDialog").close();

$("#sessionForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("#sessionBookId").value,b=books.find(x=>x.id===id);if(!b)return;
  const index=Number($("#sessionIndex").value);
  const startPage=Number($("#sessionStart").value)||0;
  const endPage=Number($("#sessionEnd").value)||0;
  const minutes=Number($("#sessionMinutes").value)||0;
  const mood=$("#sessionMood").value;

  if(endPage && endPage<startPage)return alert("End page should be greater than or equal to start page.");
  if(!startPage&&!endPage&&!minutes)return alert("Add a page or reading minutes.");

  const session={startPage,endPage,minutes,mood,date:index>=0?(b.sessions?.[index]?.date||todayISO()):todayISO()};
  b.sessions=Array.isArray(b.sessions)?b.sessions:[];

  if(index>=0 && b.sessions[index]) b.sessions[index]=session;
  else b.sessions.push(session);

  // If only a start page is entered, treat it as the current known position.
  const position=endPage||startPage;
  if(position)b.currentPage=position;

  saveBooks();
  $("#sessionDialog").close();

  if(sessionsManagerBookId===id){
    renderSessionsManager(b);
    $("#sessionsDialog").showModal();
    setDialogOpen(true);
  }else{
    setTimeout(()=>openBook(id),80);
  }
});


$("#manageGenresBtn").onclick=()=>{renderGenreManager();$("#genreDialog").showModal();setDialogOpen(true);};
$("#closeGenreDialog").onclick=()=>$("#genreDialog").close();
$("#addGenreBtn").onclick=()=>{const i=$("#newGenreInput"),v=i.value.trim().replace(/\s+/g," ");if(!v)return;if(genres.some(g=>g.toLowerCase()===v.toLowerCase()))return alert("That genre already exists.");genres.push(v);i.value="";saveGenres();renderGenreManager();};

function showFinish(b){
  justFinishedBookId=b.id;
  $("#finishTitle").textContent=`You finished ${b.title}!`;
  $("#finishSubtitle").textContent=b.rating?`${stars(b.rating)} · Welcome to the finished shelf.`:"Another story has joined your library.";
  $("#finishCoverWrap").innerHTML=coverHTML(b);
  $("#finishFavoriteBtn").innerHTML=b.favoriteBook?`${icon("heart")} In Hall of Fame`:`${icon("heart")} Hall of Fame`;
  $("#finishDialog").showModal();setDialogOpen(true);
}
$("#finishCloseBtn").onclick=()=>$("#finishDialog").close();
$("#finishFavoriteBtn").onclick=()=>{
  const b=books.find(x=>x.id===justFinishedBookId);if(!b)return;
  b.favoriteBook=true;saveBooks();
  $("#finishFavoriteBtn").innerHTML=`${icon("heart")} In Hall of Fame`;
};

$("#tbrSearch").oninput=renderTbr;$("#tbrGenre").onchange=renderTbr;$("#finishedSearch").oninput=renderFinished;$("#finishedGenre").onchange=renderFinished;$("#finishedYear").onchange=renderFinished;$("#statsYear").onchange=renderStats;
$("#saveYearlyGoal").onclick=()=>{const year=Number($("#statsYear").value)||new Date().getFullYear();if(!saveYearlyGoal(year,$("#yearlyGoalInput").value))alert("Enter a yearly goal between 1 and 999 books.");};


function openDecorDesigner(zone){
  activeDecorZone=zone;
  const labels={home:"Customize My Library",tbr:"Customize TBR Shelf",finished:"Customize Finished Shelves"};
  const finishedYear=zone?.startsWith("finished-")?zone.slice("finished-".length):"";
  $("#decorDesignerTitle").textContent=finishedYear?`Customize ${finishedYear} Shelf`:(labels[zone]||"Customize Shelf");
  $("#decorTheme").value=decorThemeFor(zone);
  if(!$("#decorDialog").open)$("#decorDialog").show();
}
$$(".customize-shelf-btn").forEach(btn=>btn.onclick=()=>openDecorDesigner(btn.dataset.customizeZone));
$("#finishedYearShelves").addEventListener("click",e=>{
  const btn=e.target.closest(".year-customize-btn");
  if(btn)openDecorDesigner(btn.dataset.customizeZone);
});

function closeDecorDesigner(){
  activeDecorZone=null;
  $("#decorDialog").close();
}
$("#closeDecorDialog").onclick=closeDecorDesigner;
$("#doneDecorBtn").onclick=closeDecorDesigner;

$("#decorTheme").onchange=()=>{
  if(!activeDecorZone)return;
  decorSettings.themes[activeDecorZone]=$("#decorTheme").value;
  saveDecorSettings();
};

$("#resetDecorBtn").onclick=()=>{
  if(!activeDecorZone)return;
  decorSettings.themes[activeDecorZone]="classic";
  $("#decorTheme").value="classic";
  saveDecorSettings();
};

/* SUPABASE AUTH + AUTO SYNC */
function configured(){return !!(syncSettings.url&&syncSettings.key);}
function signedIn(){return !!(syncSession?.access_token&&syncSession?.user?.id);}
function authHeaders(access=false){const h={apikey:syncSettings.key,"Content-Type":"application/json"};if(access&&signedIn())h.Authorization=`Bearer ${syncSession.access_token}`;return h;}

function byteSize(value){return new TextEncoder().encode(typeof value==="string"?value:JSON.stringify(value)).length;}
function storageUsageSnapshot(){
  const coverBytes=books.reduce((n,b)=>n+(b.cover&&String(b.cover).startsWith("data:image/")?dataUrlBytes(b.cover):0),0);
  const coverCount=books.filter(b=>b.cover&&String(b.cover).startsWith("data:image/")).length;
  const persistentLocal={books,genres,decorSettings,goalSettings};
  const localBytes=byteSize(persistentLocal);
  const textBytes=Math.max(0,localBytes-coverBytes);
  const cloudBytes=byteSize(persistentSyncPayload());
  return {coverBytes,coverCount,localBytes,textBytes,cloudBytes,avgCover:coverCount?Math.round(coverBytes/coverCount):0};
}
async function renderStorageUsage(){
  const details=$("#storageUsageDetails");if(!details)return;
  const s=storageUsageSnapshot();
  $("#localPersistentSize").textContent=formatBytes(s.localBytes)||"0 B";
  $("#localCoverSize").textContent=formatBytes(s.coverBytes)||"0 B";
  $("#localCoverCount").textContent=`${s.coverCount} ${s.coverCount===1?"optimized cover":"optimized covers"}`;
  $("#localTextSize").textContent=formatBytes(s.textBytes)||"0 B";
  $("#averageCoverSize").textContent=s.coverCount?(formatBytes(s.avgCover)||"0 B"):"—";
  $("#cloudPayloadSize").textContent=formatBytes(s.cloudBytes)||"0 B";
  $("#storageSummarySize").textContent=formatBytes(s.cloudBytes)||"0 B";
  try{
    if(navigator.storage?.estimate){
      const est=await navigator.storage.estimate(),usage=Number(est.usage)||0,quota=Number(est.quota)||0,remaining=Math.max(0,quota-usage);
      $("#browserStorageRemaining").textContent=quota?(formatBytes(remaining)||"0 B"):"Unavailable";
      $("#browserStorageDetail").textContent=quota?`${formatBytes(usage)} used of ${formatBytes(quota)} browser storage on this device`:"Your browser did not report a quota.";
    }else{
      $("#browserStorageRemaining").textContent="Unavailable";
      $("#browserStorageDetail").textContent="This browser does not expose a storage estimate.";
    }
  }catch{
    $("#browserStorageRemaining").textContent="Unavailable";
    $("#browserStorageDetail").textContent="This browser did not provide a storage estimate.";
  }
}

function backupAgeDays(ts){return ts?Math.floor((Date.now()-Number(ts))/86400000):null;}
function renderBackupHealth(){
  const card=$("#backupHealth"),badge=$("#backupHealthBadge");if(!card||!badge)return;
  const ts=Number(localStorage.getItem(LAST_BACKUP_KEY)||0),days=backupAgeDays(ts);
  card.dataset.health=!ts?"warning":days<=30?"good":days<=60?"warning":"danger";
  badge.dataset.health=card.dataset.health;
  if(!ts){
    badge.textContent="Backup recommended";$("#backupHealthTitle").textContent="No backup exported yet";
    $("#backupHealthText").textContent="Export a JSON backup so your library can be restored if browser or device data is lost.";
  }else{
    const when=new Date(ts).toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    if(days<=30){badge.textContent="Healthy";$("#backupHealthTitle").textContent="Backup is up to date";}
    else if(days<=60){badge.textContent="Backup due";$("#backupHealthTitle").textContent="Consider exporting a fresh backup";}
    else{badge.textContent="Backup overdue";$("#backupHealthTitle").textContent="Your backup is getting old";}
    $("#backupHealthText").textContent=`Last restorable backup exported ${days===0?"today":days===1?"1 day ago":days+" days ago"} · ${when}.`;
  }
}
function journalField(label,value){
  if(value===undefined||value===null||value===""||value===false)return "";
  return `<div class="field"><b>${escapeHtml(label)}</b><div>${escapeHtml(String(value)).replace(/\n/g,"<br>")}</div></div>`;
}
function createReadingJournalHTML(){
  const finished=books.filter(b=>b.status==="finished"),reading=books.filter(b=>b.status==="reading"),
        tbr=books.filter(b=>b.status==="want"),dnf=books.filter(b=>b.status==="dnf"),
        totalMinutes=books.reduce((n,b)=>n+sessionMinutes(b),0);
  const bookSection=b=>{
    const sessions=Array.isArray(b.sessions)?b.sessions:[];
    return `<article class="book">
      <div class="book-head">${b.cover?`<img src="${b.cover}" alt="">`:""}<div><span class="status">${escapeHtml(statusLabel(b.status))}</span><h2>${escapeHtml(b.title||"Untitled")}</h2><p>${escapeHtml(b.author||"Unknown author")}</p></div></div>
      <div class="facts">
        ${journalField("Genre",b.genre)}${journalField("Format",b.format)}${journalField("Pages",b.pages||"")}
        ${journalField("Started",b.dateStarted)}${journalField("Finished",b.dateFinished)}
        ${b.rating?journalField("Rating",stars(b.rating)):""}${journalField("Current page",b.currentPage||"")}
        ${journalField("Reading time",sessionMinutes(b)?sessionMinutes(b)+" minutes":"")}
      </div>
      ${journalField("My thoughts",b.review)}
      ${journalField("Story memory / spoiler notes",b.spoilers)}
      ${journalField("Favourite character",b.favoriteCharacter)}
      ${journalField("Favourite scene",b.favoriteScene)}
      ${journalField("Favourite quote",b.favoriteQuote)}
      ${journalField("Prediction / theory",b.prediction)}
      ${journalField("Prediction result",b.predictionResult)}
      ${sessions.length?`<div class="field"><b>Reading Sessions</b><div class="sessions">${sessions.map(s=>`<div>${escapeHtml(sessionDateValue(s)||"Undated")} · pages ${escapeHtml(s.startPage??s.start??"—")}–${escapeHtml(s.endPage??s.end??"—")} · ${escapeHtml(s.minutes||0)} min${s.mood?` · ${escapeHtml(moodLabel(s.mood))}`:""}</div>`).join("")}</div></div>`:""}
    </article>`;
  };
  const group=(title,list)=>list.length?`<section><h1>${escapeHtml(title)} <small>${list.length}</small></h1>${list.map(bookSection).join("")}</section>`:"";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>My Reading Room Journal</title>
  <style>body{font-family:Georgia,serif;max-width:980px;margin:auto;padding:36px;color:#34261f;background:#fbf6ef}header{border-bottom:2px solid #8b674c;padding-bottom:20px;margin-bottom:28px}h1,h2{margin:.2em 0}.summary{display:flex;flex-wrap:wrap;gap:10px}.summary span,.status{background:#efe3d5;border-radius:999px;padding:6px 10px;font:600 13px system-ui}.book{background:white;border:1px solid #e6d7c8;border-radius:20px;padding:20px;margin:18px 0;page-break-inside:avoid}.book-head{display:flex;gap:18px;align-items:flex-start}.book-head img{width:90px;height:135px;object-fit:cover;border-radius:8px}.book-head p{margin:.3em 0;color:#74645a}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:18px 0}.field{margin:12px 0;line-height:1.5}.field b{display:block;font:700 12px system-ui;text-transform:uppercase;letter-spacing:.08em;color:#7a685c;margin-bottom:4px}.sessions{font-family:system-ui;font-size:14px}.sessions div{padding:5px 0;border-bottom:1px solid #eee}section>h1{margin-top:40px;border-bottom:1px solid #d9c7b7;padding-bottom:8px}small{font-size:.6em;color:#806e61}@media print{body{background:white;padding:0}.book{box-shadow:none}}</style></head>
  <body><header><p>YOUR PRIVATE READING JOURNAL</p><h1>My Reading Room</h1><p>Exported ${escapeHtml(new Date().toLocaleString())}</p><div class="summary"><span>${books.length} total books</span><span>${finished.length} finished</span><span>${reading.length} reading</span><span>${tbr.length} TBR</span><span>${totalMinutes.toLocaleString()} logged minutes</span></div></header>
  ${group("Finished Library",finished)}${group("Currently Reading",reading)}${group("TBR",tbr)}${group("DNF Archive",dnf)}
  </body></html>`;
}
function downloadTextFile(text,name,type){
  const blob=new Blob([text],{type}),a=document.createElement("a"),url=URL.createObjectURL(blob);
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderSyncStatus(){
  if($("#storageUsageDetails")?.open)renderStorageUsage();
  renderBackupHealth();
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

function resetLocalReadingData(){
  books=[];
  genres=[...DEFAULT_GENRES];
  decorSettings={themes:{home:"classic",tbr:"classic",finished:"classic"}};
  goalSettings={yearly:{},monthly:{}};
  localStorage.setItem(BOOK_KEY,JSON.stringify(books));
  localStorage.setItem(GENRE_KEY,JSON.stringify(genres));
  localStorage.setItem(DECOR_KEY,JSON.stringify(decorSettings));
  localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));
  localStorage.removeItem(LAST_BACKUP_KEY);
  markChanged();
  renderGenreOptions();renderAll();applyDecorations();renderSyncStatus();
}
async function overwriteCloudWithCurrentLibrary(){
  if(!configured()||!signedIn())return false;
  if(!(await refreshSession()))throw Error("Your Supabase session could not be refreshed.");
  const uid=syncSession.user.id,base=`${syncSettings.url.replace(/\/$/,"")}/rest/v1/reading_room_sync`,now=Date.now();
  const payload={user_id:uid,payload:persistentSyncPayload(),updated_at_ms:now};
  const r=await fetch(`${base}?on_conflict=user_id`,{method:"POST",headers:{...authHeaders(true),Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(payload)});
  if(!r.ok)throw Error("The local reset succeeded, but the empty library could not be written to Supabase.");
  localStorage.setItem(CHANGE_KEY,String(now));localStorage.setItem(SYNCED_KEY,String(now));
  return true;
}
async function resetReadingRoomData(){
  const wasSignedIn=configured()&&signedIn();
  resetLocalReadingData();
  if(wasSignedIn)await overwriteCloudWithCurrentLibrary();
  return wasSignedIn;
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
        books=Array.isArray(rows[0].payload.books)?unpackBooksFromStorage(rows[0].payload):books;
        genres=Array.isArray(rows[0].payload.genres)?rows[0].payload.genres:genres;
        if(rows[0].payload.decorSettings?.themes){
          decorSettings=rows[0].payload.decorSettings;
          localStorage.setItem(DECOR_KEY,JSON.stringify(decorSettings));
        }
        if(rows[0].payload.goalSettings?.yearly){
          goalSettings=rows[0].payload.goalSettings;
          localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));
        }
        localStorage.setItem(BOOK_KEY,JSON.stringify(books));localStorage.setItem(GENRE_KEY,JSON.stringify(genres));localStorage.setItem(CHANGE_KEY,String(remote));localStorage.setItem(SYNCED_KEY,String(remote));renderAll();applyDecorations();
        $("#lastSyncText")&&($("#lastSyncText").textContent=`Downloaded latest · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;
      }
    }
    if(rows.length&&!force&&local<=last){$("#lastSyncText")&&($("#lastSyncText").textContent=`Up to date · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;}
    const now=Date.now(),payload={user_id:uid,payload:persistentSyncPayload(),updated_at_ms:now};
    const pr=await fetch(`${base}?on_conflict=user_id`,{method:"POST",headers:{...authHeaders(true),Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(payload)});if(!pr.ok)throw Error("Cloud write failed");
    localStorage.setItem(CHANGE_KEY,String(now));localStorage.setItem(SYNCED_KEY,String(now));$("#lastSyncText")&&($("#lastSyncText").textContent=`Synced automatically · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`);return true;
  }catch(e){console.warn("Reading Room sync:",e);$("#lastSyncText")&&($("#lastSyncText").textContent="Sync failed — check connection or policies.");return false;}
}
$("#saveSyncSettings").onclick=()=>{const url=$("#supabaseUrl").value.trim().replace(/\/$/,""),key=$("#supabaseKey").value.trim();if(!url||!key)return alert("Enter Project URL and Publishable key.");syncSettings={url,key};localStorage.setItem(SYNC_KEY,JSON.stringify(syncSettings));renderSyncStatus();alert("Supabase connection saved.");};
$("#clearSyncSettings").onclick=()=>{if(!confirm("Clear Supabase connection from this device?"))return;syncSettings={url:"",key:""};syncSession=null;localStorage.removeItem(SYNC_KEY);localStorage.removeItem(SESSION_KEY);renderSyncStatus();};
$("#signInBtn").onclick=async()=>{const email=$("#syncEmail").value.trim(),password=$("#syncPassword").value;if(!email||!password)return alert("Enter email and password.");const b=$("#signInBtn"),t=b.textContent;b.disabled=true;b.textContent="Signing in…";try{await signIn(email,password);$("#syncPassword").value="";await cloudSync();alert("Signed in successfully. Automatic cloud sync is active.");}catch(e){alert(e.message);}finally{b.disabled=false;b.textContent=t;}};
$("#signOutBtn").onclick=async()=>{if(signedIn()){try{await fetch(`${syncSettings.url.replace(/\/$/,"")}/auth/v1/logout`,{method:"POST",headers:authHeaders(true)});}catch{}}syncSession=null;localStorage.removeItem(SESSION_KEY);renderSyncStatus();};
$("#syncNowBtn").onclick=()=>cloudSync(true);

$("#exportBackup").onclick=()=>{
  const packed=packBooksForStorage(books),data={version:6.6,storageVersion:1,exportedAt:new Date().toISOString(),books:packed.books,covers:packed.covers,genres,decorSettings,goalSettings};
  downloadTextFile(JSON.stringify(data,null,2),`reading-room-backup-${todayISO()}.json`,"application/json");
  localStorage.setItem(LAST_BACKUP_KEY,String(Date.now()));renderBackupHealth();
};
$("#exportJournal").onclick=()=>downloadTextFile(createReadingJournalHTML(),`reading-room-journal-${todayISO()}.html`,"text/html");
$("#importBackupBtn").onclick=()=>$("#importBackupInput").click();
$("#importBackupInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.books))throw Error();if(!confirm(`Restore ${d.books.length} books? This replaces current local data.`))return;books=unpackBooksFromStorage(d);if(Array.isArray(d.genres))genres=d.genres;if(d.decorSettings?.themes){decorSettings=d.decorSettings;localStorage.setItem(DECOR_KEY,JSON.stringify(decorSettings));}if(d.goalSettings?.yearly){goalSettings=d.goalSettings;localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));}localStorage.setItem(BOOK_KEY,JSON.stringify(books));localStorage.setItem(GENRE_KEY,JSON.stringify(genres));markChanged();renderAll();applyDecorations();cloudSync();alert("Backup restored.");}catch{alert("Invalid Reading Room backup.");}e.target.value="";};

$("#readingFunDetails")?.addEventListener("toggle",e=>{const hint=e.currentTarget.querySelector(".reading-fun-hint");if(hint)hint.textContent=e.currentTarget.open?"Close":"Open";if(e.currentTarget.open)renderReadingExtras();});
$("#editMonthlyChallenge").onclick=()=>{const key=currentMonthKey(),d=new Date();$("#monthlyChallengeLabel").textContent=d.toLocaleDateString([],{month:"long",year:"numeric"});$("#monthlyChallengeTarget").value=goalSettings.monthly[key]||"";$("#monthlyChallengeDialog").showModal();setDialogOpen(true);};
$("#closeMonthlyChallenge").onclick=()=>$("#monthlyChallengeDialog").close();
$("#monthlyChallengeForm").addEventListener("submit",e=>{e.preventDefault();const value=Math.max(1,Math.min(99,Math.round(Number($("#monthlyChallengeTarget").value)||0)));if(!value)return;goalSettings.monthly[currentMonthKey()]=value;localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));markChanged();$("#monthlyChallengeDialog").close();renderReadingExtras();cloudSync();});
$("#removeMonthlyChallenge").onclick=()=>{delete goalSettings.monthly[currentMonthKey()];localStorage.setItem(GOAL_KEY,JSON.stringify(goalSettings));markChanged();$("#monthlyChallengeDialog").close();renderReadingExtras();cloudSync();};
$("#pickNextBook").onclick=()=>{chooseRandomTbr();if(randomPickedBookId){$("#randomPickDialog").showModal();setDialogOpen(true);}};
$("#pickAgain").onclick=chooseRandomTbr;
$("#closeRandomPick").onclick=()=>$("#randomPickDialog").close();
$("#openRandomPickBook").onclick=()=>{if(!randomPickedBookId)return;$("#randomPickDialog").close();openBook(randomPickedBookId);};
$("#dangerZoneDetails")?.addEventListener("toggle",e=>{const hint=e.currentTarget.querySelector(".danger-zone-hint");if(hint)hint.textContent=e.currentTarget.open?"Close":"Open";});
$("#openResetReadingData").onclick=()=>{$("#resetReadingDataConfirm").value="";$("#confirmResetReadingData").disabled=true;$("#resetReadingDataDialog").showModal();setDialogOpen(true);};
$("#closeResetReadingData").onclick=()=>$("#resetReadingDataDialog").close();
$("#resetReadingDataConfirm").addEventListener("input",e=>{$("#confirmResetReadingData").disabled=e.target.value.trim()!=="RESET";});
$("#resetExportFirst").onclick=()=>$("#exportBackup").click();
$("#confirmResetReadingData").onclick=async()=>{
  if($("#resetReadingDataConfirm").value.trim()!=="RESET")return;
  const btn=$("#confirmResetReadingData"),old=btn.textContent;btn.disabled=true;btn.textContent="Resetting…";
  try{
    const cloud=await resetReadingRoomData();
    $("#resetReadingDataDialog").close();
    alert(cloud?"Reading Room data was cleared on this device and the synced cloud library was reset. Your account remains active.":"Reading Room data was cleared on this device. Your account/connection was not removed.");
    routeTo("home");
  }catch(e){
    $("#resetReadingDataDialog").close();
    alert(`${e.message}\n\nYour local Reading Room is empty. Do not run normal Sync until the cloud reset succeeds, or older cloud data may download again.`);
  }finally{btn.textContent=old;}
};
$("#storageUsageDetails")?.addEventListener("toggle",e=>{if(e.currentTarget.open)renderStorageUsage();});
$("#refreshStorageUsage")?.addEventListener("click",renderStorageUsage);
$("#openAdvancedSearch").onclick=()=>{populateAdvancedSearchFilters();renderAdvancedSearch();$("#advancedSearchDialog").showModal();setDialogOpen(true);setTimeout(()=>$("#advancedSearchQuery").focus(),50);};
$("#closeAdvancedSearch").onclick=()=>$("#advancedSearchDialog").close();
["advancedSearchQuery","advancedSearchStatus","advancedSearchGenre","advancedSearchYear","advancedSearchRating"].forEach(id=>$("#"+id).addEventListener(id==="advancedSearchQuery"?"input":"change",renderAdvancedSearch));
$("#clearAdvancedSearch").onclick=()=>{$("#advancedSearchQuery").value="";$("#advancedSearchStatus").value="all";$("#advancedSearchGenre").value="all";$("#advancedSearchYear").value="all";$("#advancedSearchRating").value="all";renderAdvancedSearch();};

renderGenreOptions();renderAll();applyDecorations();renderSyncStatus();cloudSync().then(()=>setTimeout(async()=>{const r=await optimizeExistingCovers();if(r.changed)cloudSync(true);},250));
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
