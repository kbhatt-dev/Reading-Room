
const KEY = "readingRoomBooksV1";
const GENRE_KEY = "readingRoomGenresV1";
const DEFAULT_GENRES = [
  "Thriller", "Mystery", "Horror", "Romance", "Fantasy",
  "Science Fiction", "Contemporary", "Historical Fiction",
  "Literary Fiction", "Non-Fiction", "Biography", "Self-Help", "Other"
];
let books = JSON.parse(localStorage.getItem(KEY) || "[]");
let genres = JSON.parse(localStorage.getItem(GENRE_KEY) || "null") || [...DEFAULT_GENRES];
let selectedRating = 0;
let workingCover = "";

const $ = s => document.querySelector(s);
const els = {
  add: $("#addBookBtn"), dialog: $("#bookDialog"), form: $("#bookForm"),
  close: $("#closeDialog"), cancel: $("#cancelBtn"), shelf: $("#bookShelf"),
  current: $("#currentlyReading"), currentEmpty: $("#currentlyEmpty"),
  libraryEmpty: $("#libraryEmpty"), search: $("#searchInput"), filter: $("#filterStatus"),
  detailDialog: $("#detailDialog"), detail: $("#detailContent"), deleteBtn: $("#deleteBookBtn"),
  genreDialog: $("#genreDialog"), genreList: $("#genreList")
};

function save(){ localStorage.setItem(KEY, JSON.stringify(books)); render(); }
function saveGenres(){
  localStorage.setItem(GENRE_KEY, JSON.stringify(genres));
  renderGenreOptions($("#genre").value);
  renderGenreManager();
}
function renderGenreOptions(selected=""){
  const select = $("#genre");
  const choices = [...genres];
  if(selected && !choices.includes(selected)) choices.unshift(selected);
  select.innerHTML = `<option value="">Choose genre…</option>` +
    choices.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
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
  const q = els.search.value.trim().toLowerCase();
  const f = els.filter.value;
  const visible = books.filter(b => {
    const matchQ = !q || `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q);
    const matchF = f === "all" || b.status === f;
    return matchQ && matchF;
  });

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

  els.shelf.innerHTML = visible.map(b => `
    <button class="shelf-book" onclick="openDetail('${b.id}')" title="${escapeHtml(b.title)}">
      ${coverHTML(b)}
      <span class="label">${escapeHtml(b.title)}</span>
    </button>`).join("");
  els.libraryEmpty.classList.toggle("hidden", visible.length > 0);

  const year = new Date().getFullYear();
  const finished = books.filter(b => b.status === "finished");
  $("#completedCount").textContent = finished.length;
  $("#yearSummary").textContent = finished.length
    ? `You have finished ${finished.length} ${finished.length===1?"book":"books"} in your library.`
    : "Start adding books to build your shelf.";
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
  els.form.reset(); $("#bookId").value=""; selectedRating=0; workingCover="";
  renderGenreOptions("");
  $("#coverFileName").textContent="No file selected";
  $("#coverPreviewWrap").classList.add("hidden");
  [...$("#ratingPicker").children].forEach(x=>x.classList.remove("active"));
  els.deleteBtn.classList.add("hidden");
  $("#dialogTitle").textContent="Add a Book";
}
function openAdd(){ resetForm(); els.dialog.showModal(); }

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
        <span class="pill">${escapeHtml(b.genre || "No genre")}</span>
        <span class="pill">${escapeHtml(b.format || "Format not set")}</span>
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
  els.detailDialog.showModal();
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
els.close.addEventListener("click",()=>els.dialog.close());
els.cancel.addEventListener("click",()=>els.dialog.close());
els.search.addEventListener("input",render);
els.filter.addEventListener("change",render);

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{})); }
renderGenreOptions("");
render();
