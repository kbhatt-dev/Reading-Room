const READING_ROOM_VERSION = "2.5";

const KEY = "readingRoomBooksV1";
const GENRE_KEY = "readingRoomGenresV1";
const SYNC_KEY = "readingRoomSyncSettingsV2";
const SESSION_KEY = "readingRoomSupabaseSessionV2";
const DEFAULT_GENRES = [
  "Thriller", "Mystery", "Horror", "Romance", "Fantasy",
  "Science Fiction", "Contemporary", "Historical Fiction",
  "Literary Fiction", "Non-Fiction", "Biography", "Self-Help", "Other"
];
let books = JSON.parse(localStorage.getItem(KEY) || "[]");
let genres = JSON.parse(localStorage.getItem(GENRE_KEY) || "null") || [...DEFAULT_GENRES];
let syncSettings = JSON.parse(localStorage.getItem(SYNC_KEY) || "null") || {url:"", key:""};
let syncSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
let selectedRating = 0;
let workingCover = "";

const $ = s => document.querySelector(s);
const els = {
  add: $("#addBookBtn"), dialog: $("#bookDialog"), form: $("#bookForm"),
  close: $("#closeDialog"), cancel: $("#cancelBtn"), shelf: $("#bookShelf"),
  current: $("#currentlyReading"), currentEmpty: $("#currentlyEmpty"),
  libraryEmpty: $("#libraryEmpty"), search: $("#searchInput"), filter: $("#filterStatus"),
  detailDialog: $("#detailDialog"), detail: $("#detailContent"), deleteBtn: $("#deleteBookBtn"),
  genreDialog: $("#genreDialog"), genreList: $("#genreList"),
  filterGenre: $("#filterGenre"), yearShelves: $("#yearShelves")
};

function save(){
  localStorage.setItem(KEY, JSON.stringify(books));
  localStorage.setItem("readingRoomLastChangedV2", String(Date.now()));
  render();
  cloudSync();
}
function saveGenres(){
  localStorage.setItem(GENRE_KEY, JSON.stringify(genres));
  localStorage.setItem("readingRoomLastChangedV2", String(Date.now()));
  renderGenreOptions($("#genre").value);
  renderGenreFilter();
  renderGenreManager();
  cloudSync();
}

function genreEmoji(name=""){
  const g=name.toLowerCase();
  if(g.includes("thriller")) return "🔪";
  if(g.includes("mystery")) return "🕵️";
  if(g.includes("horror")) return "👻";
  if(g.includes("romance")) return "💗";
  if(g.includes("fantasy")) return "🐉";
  if(g.includes("science fiction")) return "🚀";
  if(g.includes("historical")) return "🏛️";
  if(g.includes("contemporary")) return "🌿";
  if(g.includes("literary")) return "✒️";
  if(g.includes("biography")) return "👤";
  if(g.includes("self-help")) return "🌱";
  if(g.includes("non-fiction") || g.includes("nonfiction")) return "🧠";
  return "📚";
}

function renderGenreOptions(selected=""){
  const select = $("#genre");
  const choices = [...genres];
  if(selected && !choices.includes(selected)) choices.unshift(selected);
  select.innerHTML = `<option value="">✨ Choose genre…</option>` +
    choices.map(g => `<option value="${escapeHtml(g)}">${genreEmoji(g)} ${escapeHtml(g)}</option>`).join("");
  select.value = selected || "";
}
function renderGenreManager(){
  els.genreList.innerHTML = genres.map((g, i) => `
    <div class="genre-row">
      <input value="${escapeHtml(g)}" aria-label="Genre name" data-genre-index="${i}" />
      <button type="button" class="secondary small" onclick="renameGenre(${i})">Save</button>
      <button type="button" class="danger small" onclick="deleteGenre(${i})">Delete</button>
    </div>`).join("");
}


function bookYear(b){
  const raw = b.dateFinished || b.dateStarted;
  if(raw){
    const y = new Date(raw + "T00:00:00").getFullYear();
    if(!Number.isNaN(y)) return y;
  }
  return new Date().getFullYear();
}
function renderGenreFilter(){
  const current = els.filterGenre?.value || "all";
  if(!els.filterGenre) return;
  els.filterGenre.innerHTML = `<option value="all">🏷️ All genres</option>` +
    genres.map(g=>`<option value="${escapeHtml(g)}">${genreEmoji(g)} ${escapeHtml(g)}</option>`).join("");
  els.filterGenre.value = genres.includes(current) ? current : "all";
}
function filteredBooks(){
  const q = els.search.value.trim().toLowerCase();
  const f = els.filter.value;
  const g = els.filterGenre?.value || "all";
  return books.filter(b => {
    const matchQ = !q || `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q);
    const matchF = f === "all" || b.status === f;
    const matchG = g === "all" || b.genre === g;
    return matchQ && matchF && matchG;
  });
}
function renderYearShelves(visible){
  if(!els.yearShelves) return;
  const groups = {};
  visible.forEach(b => {
    const y = bookYear(b);
    (groups[y] ||= []).push(b);
  });
  const years = Object.keys(groups).sort((a,b)=>Number(b)-Number(a));
  els.yearShelves.innerHTML = years.map(year => `
    <section class="year-block">
      <h3>${year} Shelf</h3>
      <div class="shelf-wrap">
        <div class="decor">🪴 <span>✨</span> 🕯️</div>
        <div class="book-shelf">
          ${groups[year].map(b => `
            <button class="shelf-book" onclick="openDetail('${b.id}')" title="${escapeHtml(b.title)}">
              ${coverHTML(b)}
              <span class="label">${escapeHtml(b.title)}</span>
            </button>`).join("")}
        </div>
        <div class="shelf-board"></div>
      </div>
    </section>`).join("");
}
function renderStats(){
  if(!$("#statsYear")) return;
  const years = [...new Set(books.map(bookYear))].sort((a,b)=>b-a);
  const currentYear = new Date().getFullYear();
  if(!years.includes(currentYear)) years.unshift(currentYear);
  const old = Number($("#statsYear").value) || currentYear;
  $("#statsYear").innerHTML = years.map(y=>`<option value="${y}">${y}</option>`).join("");
  $("#statsYear").value = years.includes(old) ? old : years[0];
  const year = Number($("#statsYear").value);

  const finished = books.filter(b=>b.status==="finished" && bookYear(b)===year);
  const pages = finished.reduce((n,b)=>n+(Number(b.pages)||0),0);
  const rated = finished.filter(b=>Number(b.rating)>0);
  const avg = rated.length ? (rated.reduce((n,b)=>n+Number(b.rating),0)/rated.length).toFixed(1) : "—";

  const countBy = key => finished.reduce((acc,b)=>{
    const v = b[key] || "Unknown"; acc[v]=(acc[v]||0)+1; return acc;
  },{});
  const top = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";

  $("#statBooks").textContent = finished.length;
  $("#statPages").textContent = pages.toLocaleString();
  $("#statRating").textContent = avg;
  $("#statGenre").textContent = top(countBy("genre"));

  const monthCounts = Array(12).fill(0);
  finished.forEach(b=>{
    if(b.dateFinished){
      const d = new Date(b.dateFinished+"T00:00:00");
      if(!Number.isNaN(d)) monthCounts[d.getMonth()]++;
    }
  });
  const maxMonth = Math.max(1,...monthCounts);
  const monthNames = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  $("#monthlyBars").innerHTML = monthCounts.map((n,i)=>`
    <div class="bar-col">
      <div class="bar-fill" style="height:${Math.max(2,(n/maxMonth)*100)}%"><span>${n||""}</span></div>
      <div class="bar-label">${monthNames[i]}</div>
    </div>`).join("");

  function rows(target, obj){
    const entries = Object.entries(obj).sort((a,b)=>b[1]-a[1]);
    const max = Math.max(1,...entries.map(x=>x[1]));
    $(target).innerHTML = entries.length ? entries.map(([name,n])=>`
      <div class="stat-row">
        <span>${escapeHtml(String(name))}</span>
        <div class="stat-track"><span style="width:${(n/max)*100}%"></span></div>
        <small>${n}</small>
      </div>`).join("") : `<p class="muted">No data yet.</p>`;
  }
  rows("#genreStats", countBy("genre"));
  rows("#formatStats", countBy("format"));

  const ratingCounts = {};
  rated.forEach(b=>{ const r=String(b.rating); ratingCounts[r]=(ratingCounts[r]||0)+1; });
  rows("#ratingStats", ratingCounts);
}
function setView(name){
  ["home","stats","sync"].forEach(v=>{
    const panel = $("#"+v+"View");
    panel.classList.toggle("hidden", v!==name);
    document.querySelector(`[data-view="${v}"]`)?.classList.toggle("active", v===name);
  });
  if(name==="stats") renderStats();
  if(name==="sync") renderSyncStatus();
}
function isSyncConfigured(){
  return !!(syncSettings.url && syncSettings.key);
}
function isSignedIn(){
  return !!(syncSession && syncSession.access_token && syncSession.user && syncSession.user.id);
}
function authHeaders(useAccessToken=false){
  const h = {
    "apikey": syncSettings.key,
    "Content-Type": "application/json"
  };
  if(useAccessToken && isSignedIn()) h["Authorization"] = `Bearer ${syncSession.access_token}`;
  return h;
}
function setLastSync(message){
  const el=$("#lastSyncText");
  if(el) el.textContent=message;
}
function renderSyncStatus(){
  const box=$("#syncStatus"); if(!box) return;
  $("#supabaseUrl").value=syncSettings.url||"";
  $("#supabaseKey").value=syncSettings.key||"";

  const configured=isSyncConfigured();
  const signedIn=isSignedIn();

  if(signedIn){
    box.innerHTML=`<span class="sync-dot connected"></span><div><strong>Cloud sync active</strong><p>Signed in securely with Supabase Authentication.</p></div>`;
  }else if(configured){
    box.innerHTML=`<span class="sync-dot"></span><div><strong>Connection saved</strong><p>Sign in below to start cross-device synchronization.</p></div>`;
  }else{
    box.innerHTML=`<span class="sync-dot local"></span><div><strong>Local mode</strong><p>Your books are saved on this device.</p></div>`;
  }

  $("#signedOutPanel")?.classList.toggle("hidden", signedIn);
  $("#signedInPanel")?.classList.toggle("hidden", !signedIn);
  if(signedIn){
    $("#signedInEmail").textContent=syncSession.user.email || "Reading Room account";
  }
}
async function refreshSessionIfNeeded(){
  if(!syncSession?.refresh_token || !isSyncConfigured()) return false;
  const expiresAt = Number(syncSession.expires_at || 0) * 1000;
  if(expiresAt && Date.now() < expiresAt - 60000) return true;

  try{
    const url=`${syncSettings.url.replace(/\/$/,"")}/auth/v1/token?grant_type=refresh_token`;
    const res=await fetch(url,{
      method:"POST",
      headers:authHeaders(false),
      body:JSON.stringify({refresh_token:syncSession.refresh_token})
    });
    if(!res.ok) throw new Error("Session refresh failed");
    const data=await res.json();
    syncSession=data;
    localStorage.setItem(SESSION_KEY,JSON.stringify(syncSession));
    renderSyncStatus();
    return true;
  }catch(err){
    console.warn("Reading Room auth refresh:",err);
    syncSession=null;
    localStorage.removeItem(SESSION_KEY);
    renderSyncStatus();
    return false;
  }
}
async function signInToSupabase(email,password){
  if(!isSyncConfigured()) throw new Error("Save your Supabase Project URL and Publishable key first.");
  const url=`${syncSettings.url.replace(/\/$/,"")}/auth/v1/token?grant_type=password`;
  const res=await fetch(url,{
    method:"POST",
    headers:authHeaders(false),
    body:JSON.stringify({email,password})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error_description || data.msg || data.error || "Sign in failed.");
  syncSession=data;
  localStorage.setItem(SESSION_KEY,JSON.stringify(syncSession));
  renderSyncStatus();
  return data;
}
async function signOutFromSupabase(){
  if(isSignedIn()){
    try{
      await fetch(`${syncSettings.url.replace(/\/$/,"")}/auth/v1/logout`,{
        method:"POST",
        headers:authHeaders(true)
      });
    }catch{}
  }
  syncSession=null;
  localStorage.removeItem(SESSION_KEY);
  renderSyncStatus();
}
async function cloudSync(force=false){
  if(!isSyncConfigured() || !isSignedIn()) return false;
  if(!(await refreshSessionIfNeeded())) return false;

  try{
    const uid=syncSession.user.id;
    const base=`${syncSettings.url.replace(/\/$/,"")}/rest/v1/reading_room_sync`;
    const endpoint=`${base}?user_id=eq.${encodeURIComponent(uid)}&select=user_id,payload,updated_at_ms`;
    const headers=authHeaders(true);

    setLastSync("Checking cloud…");
    const getRes=await fetch(endpoint,{headers});
    if(!getRes.ok){
      const detail=await getRes.text();
      throw new Error(`Cloud read failed (${getRes.status}): ${detail.slice(0,120)}`);
    }
    const rows=await getRes.json();
    const localStamp=Number(localStorage.getItem("readingRoomLastChangedV2")||0);
    const lastSyncedStamp=Number(localStorage.getItem("readingRoomLastSyncedV2")||0);

    if(rows.length && rows[0].payload){
      const remote=rows[0].payload;
      const remoteStamp=Number(rows[0].updated_at_ms||0);

      if(!force && remoteStamp > localStamp){
        books=Array.isArray(remote.books)?remote.books:books;
        genres=Array.isArray(remote.genres)?remote.genres:genres;
        localStorage.setItem(KEY,JSON.stringify(books));
        localStorage.setItem(GENRE_KEY,JSON.stringify(genres));
        localStorage.setItem("readingRoomLastChangedV2",String(remoteStamp));
        localStorage.setItem("readingRoomLastSyncedV2",String(remoteStamp));
        renderGenreOptions("");
        renderGenreFilter();
        render();
        setLastSync(`Downloaded latest library · ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`);
        return true;
      }
    }

    if(rows.length && !force && localStamp <= lastSyncedStamp){
      setLastSync(`Up to date · ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`);
      return true;
    }

    const now=Date.now();
    const payload={user_id:uid,payload:{books,genres},updated_at_ms:now};
    const upsert=`${base}?on_conflict=user_id`;
    const putRes=await fetch(upsert,{
      method:"POST",
      headers:{...headers,"Prefer":"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify(payload)
    });
    if(!putRes.ok){
      const detail=await putRes.text();
      throw new Error(`Cloud write failed (${putRes.status}): ${detail.slice(0,120)}`);
    }
    localStorage.setItem("readingRoomLastChangedV2",String(now));
    localStorage.setItem("readingRoomLastSyncedV2",String(now));
    setLastSync(`Synced automatically · ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`);
    return true;
  }catch(err){
    console.warn("Reading Room sync:",err);
    setLastSync("Sync failed — check connection settings or Supabase policies.");
    return false;
  }
}

function escapeHtml(v=""){
  return v.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function statusLabel(v){ return ({want:"Want to Read",reading:"Reading",finished:"Finished",dnf:"DNF"})[v] || v; }
function pct(b){
  if(!b.pages || !b.currentPage) return 0;
  return Math.min(100, Math.round((b.currentPage/b.pages)*100));
}
function stars(r){
  if(!r) return "Not rated";
  return `${"★".repeat(Math.floor(r))}${r%1 ? "½" : ""}  ${r}/5`;
}
function coverHTML(b, cls="cover"){
  if(b.cover) return `<img class="${cls}" src="${b.cover}" alt="${escapeHtml(b.title)} cover">`;
  return `<div class="${cls} placeholder">${escapeHtml(b.title || "Book")}</div>`;
}
function render(){
  const visible = filteredBooks();

  const current = books.filter(b => b.status === "reading");
  els.current.innerHTML = current.map(b => `
    <article class="current-card">
      ${coverHTML(b)}
      <div>
        <h3>${escapeHtml(b.title)}</h3>
        <div class="meta">${escapeHtml(b.author || "Unknown author")}</div>
        <div class="progress"><span style="width:${pct(b)}%"></span></div>
        <div class="meta">${b.currentPage || 0}${b.pages ? ` / ${b.pages} pages` : " pages"} · ${pct(b)}%</div>
        <button class="secondary small" onclick="openDetail('${b.id}')">Open Journal</button>
      </div>
    </article>`).join("");
  els.currentEmpty.classList.toggle("hidden", current.length > 0);

  renderYearShelves(visible);
  els.libraryEmpty.classList.toggle("hidden", visible.length > 0);

  const finished = books.filter(b => b.status === "finished");
  $("#completedCount").textContent = finished.length;
  $("#yearSummary").textContent = finished.length
    ? `You have finished ${finished.length} ${finished.length===1?"book":"books"} in your library.`
    : "Start adding books to build your shelf.";

  renderGenreFilter();
}

function buildRatingPicker(){
  const picker = $("#ratingPicker");
  picker.innerHTML = "";
  for(let r=.5; r<=5; r+=.5){
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "rating-chip";
    btn.textContent = r;
    btn.addEventListener("click", () => {
      selectedRating = r; $("#rating").value = r;
      [...picker.children].forEach(x => x.classList.toggle("active", Number(x.textContent) === r));
    });
    picker.appendChild(btn);
  }
}
buildRatingPicker();

function resetForm(){
  els.form.reset();
  $("#bookId").value="";
  selectedRating=0;
  workingCover="";
  renderGenreOptions("");

  const coverInput=$("#coverInput");
  const coverPreview=$("#coverPreview");
  const coverPreviewWrap=$("#coverPreviewWrap");

  if(coverInput) coverInput.value="";
  if(coverPreview){
    coverPreview.removeAttribute("src");
    coverPreview.src="";
  }
  if(coverPreviewWrap){
    coverPreviewWrap.classList.add("hidden");
    coverPreviewWrap.style.display="";
  }
  $("#coverFileName").textContent="No file selected";
  [...$("#ratingPicker").children].forEach(x=>x.classList.remove("active"));
  els.deleteBtn.classList.add("hidden");
  $("#dialogTitle").textContent="Add a Book";
}
function openAdd(){
  resetForm();
  requestAnimationFrame(()=>{
    $("#coverPreviewWrap")?.classList.add("hidden");
    if($("#coverPreview")) $("#coverPreview").src="";
  });
  els.dialog.showModal();
  updateFabVisibility();
}

function fillForm(b){
  resetForm(); $("#dialogTitle").textContent="Edit Book"; els.deleteBtn.classList.remove("hidden");
  renderGenreOptions(b.genre || "");
  const fields = ["title","author","status","format","pages","currentPage","dateStarted","dateFinished","review","spoilers","favoriteCharacter","favoriteScene","favoriteQuote","prediction","predictionResult"];
  fields.forEach(k => { const e=$("#"+k); if(e) e.value=b[k] ?? ""; });
  $("#bookId").value=b.id; selectedRating=Number(b.rating||0); $("#rating").value=selectedRating;
  [...$("#ratingPicker").children].forEach(x=>x.classList.toggle("active", Number(x.textContent)===selectedRating));
  workingCover=b.cover||"";
  if(workingCover){ $("#coverPreview").src=workingCover; $("#coverPreviewWrap").classList.remove("hidden"); }
  els.dialog.showModal();
}
window.editBook = id => { const b=books.find(x=>x.id===id); if(b){ els.detailDialog.close(); fillForm(b); } };

$("#chooseCoverBtn").addEventListener("click",()=>$("#coverInput").click());
$("#coverInput").addEventListener("change", e => {
  const file=e.target.files[0]; if(!file) return;
  $("#coverFileName").textContent=file.name;
  const reader=new FileReader();
  reader.onload=ev=>{ workingCover=ev.target.result; $("#coverPreview").src=workingCover; $("#coverPreviewWrap").classList.remove("hidden"); };
  reader.readAsDataURL(file);
});
$("#removeCover").addEventListener("click",()=>{
  workingCover=""; $("#coverInput").value=""; $("#coverFileName").textContent="No file selected";
  $("#coverPreviewWrap").classList.add("hidden");
});

els.form.addEventListener("submit", e => {
  e.preventDefault();
  const id=$("#bookId").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const b={
    id, title:$("#title").value.trim(), author:$("#author").value.trim(),
    status:$("#status").value, genre:$("#genre").value.trim(), format:$("#format").value,
    pages:Number($("#pages").value)||0, currentPage:Number($("#currentPage").value)||0,
    dateStarted:$("#dateStarted").value, dateFinished:$("#dateFinished").value,
    rating:selectedRating, cover:workingCover, review:$("#review").value.trim(),
    spoilers:$("#spoilers").value.trim(), favoriteCharacter:$("#favoriteCharacter").value.trim(),
    favoriteScene:$("#favoriteScene").value.trim(), favoriteQuote:$("#favoriteQuote").value.trim(),
    prediction:$("#prediction").value.trim(), predictionResult:$("#predictionResult").value
  };
  const i=books.findIndex(x=>x.id===id); if(i>=0) books[i]=b; else books.unshift(b);
  save(); els.dialog.close();
});

els.deleteBtn.addEventListener("click", ()=>{
  const id=$("#bookId").value;
  if(id && confirm("Delete this book from your journal?")){ books=books.filter(b=>b.id!==id); save(); els.dialog.close(); }
});

window.openDetail = id => {
  const b=books.find(x=>x.id===id); if(!b) return;
  const prediction = b.prediction ? `<div class="detail-section"><h3>🔎 My Prediction</h3><p>${escapeHtml(b.prediction)}</p>${b.predictionResult ? `<span class="pill">Result: ${b.predictionResult==="yes"?"Correct 🎯":b.predictionResult==="no"?"Wrong 😭":"Partly right"}</span>`:""}</div>` : "";
  const spoilerId = `spoiler-${b.id.replace(/[^a-z0-9]/gi,"")}`;
  els.detail.innerHTML = `
    <div class="detail-top">
      ${coverHTML(b)}
      <div>
        <p class="eyebrow">${statusLabel(b.status)}</p>
        <h2>${escapeHtml(b.title)}</h2>
        <p class="muted">${escapeHtml(b.author || "Unknown author")}</p>
        <span class="pill">${genreEmoji(b.genre)} ${escapeHtml(b.genre || "No genre")}</span>
        <span class="pill">${b.format==="Kindle"?"📱 ":b.format==="Audiobook"?"🎧 ":b.format==="Hardcover"?"📕 ":b.format==="Paperback"?"📖 ":"✨ "}${escapeHtml(b.format || "Format not set")}</span>
        <span class="pill">${stars(Number(b.rating||0))}</span>
        ${b.pages ? `<p class="meta">${b.pages} pages${b.currentPage?` · currently page ${b.currentPage}`:""}</p>`:""}
      </div>
    </div>
    ${b.review ? `<div class="detail-section"><h3>My Thoughts</h3><p>${escapeHtml(b.review).replace(/\n/g,"<br>")}</p></div>`:""}
    ${b.spoilers ? `<div class="detail-section"><h3>Story Memory</h3><button class="secondary small" onclick="document.getElementById('${spoilerId}').classList.toggle('hidden')">🔒 Reveal / Hide Spoilers</button><p id="${spoilerId}" class="hidden">${escapeHtml(b.spoilers).replace(/\n/g,"<br>")}</p></div>`:""}
    ${b.favoriteCharacter ? `<div class="detail-section"><h3>Favourite Character</h3><p>${escapeHtml(b.favoriteCharacter)}</p></div>`:""}
    ${b.favoriteScene ? `<div class="detail-section"><h3>Favourite Scene</h3><p>${escapeHtml(b.favoriteScene)}</p></div>`:""}
    ${b.favoriteQuote ? `<div class="detail-section"><h3>Favourite Quote</h3><div class="quote">“${escapeHtml(b.favoriteQuote)}”</div></div>`:""}
    ${prediction}
    <div class="detail-actions">
      <button class="secondary" onclick="document.getElementById('detailDialog').close()">Close</button>
      <button class="primary" onclick="editBook('${b.id}')">Edit Book</button>
    </div>`;
  els.detailDialog.showModal(); updateFabVisibility();
};


function normalizeGenreName(value){ return value.trim().replace(/\s+/g," "); }

window.renameGenre = index => {
  const input = document.querySelector(`[data-genre-index="${index}"]`);
  const next = normalizeGenreName(input?.value || "");
  const old = genres[index];
  if(!next) return alert("Genre name cannot be empty.");
  if(genres.some((g,i)=>i!==index && g.toLowerCase()===next.toLowerCase())) return alert("That genre already exists.");
  genres[index] = next;
  books = books.map(b => b.genre === old ? {...b, genre: next} : b);
  localStorage.setItem(KEY, JSON.stringify(books));
  saveGenres();
  render();
};

window.deleteGenre = index => {
  const name = genres[index];
  if(!confirm(`Remove "${name}" from your genre choices? Existing books will keep this genre.`)) return;
  genres.splice(index,1);
  saveGenres();
};

$("#manageGenresBtn").addEventListener("click",()=>{
  renderGenreManager();
  els.genreDialog.showModal();
});
$("#closeGenreDialog").addEventListener("click",()=>els.genreDialog.close());
$("#addGenreBtn").addEventListener("click",()=>{
  const input=$("#newGenreInput");
  const value=normalizeGenreName(input.value);
  if(!value) return;
  if(genres.some(g=>g.toLowerCase()===value.toLowerCase())) return alert("That genre already exists.");
  genres.push(value);
  input.value="";
  saveGenres();
});
$("#newGenreInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"){ e.preventDefault(); $("#addGenreBtn").click(); }
});

els.add.addEventListener("click", openAdd);
$("#floatingAddBookBtn")?.addEventListener("click", openAdd);

function updateFabVisibility(){
  const anyDialog=[...document.querySelectorAll("dialog")].some(d=>d.open);
  const fab=$("#floatingAddBookBtn");
  if(fab) fab.classList.toggle("fab-hidden",anyDialog);
}
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("close",updateFabVisibility));
els.close.addEventListener("click",()=>els.dialog.close());
els.cancel.addEventListener("click",()=>els.dialog.close());
els.search.addEventListener("input",render);
els.filter.addEventListener("change",render);
els.filterGenre.addEventListener("change",render);
$("#statsYear").addEventListener("change",renderStats);
document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));

$("#saveSyncSettings").addEventListener("click",()=>{
  const url=$("#supabaseUrl").value.trim().replace(/\/$/,"");
  const key=$("#supabaseKey").value.trim();
  if(!url || !key){
    alert("Enter both the Supabase Project URL and Publishable key.");
    return;
  }
  if(!/^https:\/\/.+\.supabase\.co$/i.test(url)){
    if(!confirm("This URL does not look like a standard Supabase project URL. Save it anyway?")) return;
  }
  syncSettings={url,key};
  localStorage.setItem(SYNC_KEY,JSON.stringify(syncSettings));
  renderSyncStatus();
  alert("Supabase connection saved. Now sign in below.");
});

$("#clearSyncSettings").addEventListener("click",()=>{
  if(!confirm("Clear the Supabase connection from this device?")) return;
  syncSettings={url:"",key:""};
  syncSession=null;
  localStorage.removeItem(SYNC_KEY);
  localStorage.removeItem(SESSION_KEY);
  renderSyncStatus();
});

$("#signInBtn").addEventListener("click",async()=>{
  const email=$("#syncEmail").value.trim();
  const password=$("#syncPassword").value;
  if(!email || !password){ alert("Enter your email and password."); return; }
  const btn=$("#signInBtn");
  const old=btn.textContent;
  btn.disabled=true; btn.textContent="Signing in…";
  try{
    await signInToSupabase(email,password);
    $("#syncPassword").value="";
    setLastSync("Signed in. Synchronizing…");
    await cloudSync();
    alert("Signed in successfully. Reading Room cloud sync is active.");
  }catch(err){
    alert(err.message);
  }finally{
    btn.disabled=false; btn.textContent=old;
  }
});

$("#signOutBtn").addEventListener("click",async()=>{
  await signOutFromSupabase();
});

$("#syncNowBtn").addEventListener("click",async()=>{
  const btn=$("#syncNowBtn");
  const old=btn.textContent;
  btn.disabled=true; btn.textContent="Syncing…";
  await cloudSync();
  btn.disabled=false; btn.textContent=old;
});

$("#exportBackup").addEventListener("click",()=>{
  const blob = new Blob([JSON.stringify({version:2, exportedAt:new Date().toISOString(), books, genres}, null, 2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=`reading-room-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(a.href);
});
$("#importBackupBtn").addEventListener("click",()=>$("#importBackupInput").click());
$("#importBackupInput").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data.books)) throw new Error("Invalid backup");
    if(!confirm(`Restore ${data.books.length} books from this backup? This replaces current local data.`)) return;
    books=data.books; if(Array.isArray(data.genres)) genres=data.genres;
    localStorage.setItem(KEY,JSON.stringify(books)); localStorage.setItem(GENRE_KEY,JSON.stringify(genres));
    localStorage.setItem("readingRoomLastChangedV2",String(Date.now()));
    renderGenreOptions(""); renderGenreFilter(); render(); cloudSync();
    alert("Backup restored.");
  }catch(err){ alert("That file is not a valid Reading Room backup."); }
  e.target.value="";
});

if("serviceWorker" in navigator){
  window.addEventListener("load", async()=>{
    try{
      const reg = await navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"});

      // Always ask the browser/GitHub Pages whether a newer service worker exists.
      await reg.update();

      reg.addEventListener("updatefound", ()=>{
        const worker = reg.installing;
        if(!worker) return;
        worker.addEventListener("statechange", ()=>{
          if(worker.state==="installed" && navigator.serviceWorker.controller){
            // New SW is ready. It calls skipWaiting(), so controllerchange follows.
          }
        });
      });

      // Reload exactly once when a new service worker takes control.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", ()=>{
        if(refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // Re-check when the user returns to the app after it has been in the background.
      document.addEventListener("visibilitychange", ()=>{
        if(document.visibilityState==="visible") reg.update().catch(()=>{});
      });
    }catch(err){
      console.warn("Reading Room service worker:", err);
    }
  });
}
renderGenreOptions("");
renderGenreFilter();
render();
renderSyncStatus();
cloudSync();
console.info(`Reading Room v${READING_ROOM_VERSION}`);

/* Automatic cloud synchronization */
window.addEventListener("focus",()=>{ if(isSignedIn()) cloudSync(); });
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible" && isSignedIn()) cloudSync();
});
window.addEventListener("online",()=>{ if(isSignedIn()) cloudSync(); });
setInterval(()=>{ if(document.visibilityState==="visible" && isSignedIn()) cloudSync(); }, 60000);

