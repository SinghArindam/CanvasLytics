// frontend/app.js
/* global Chart */
const API = "http://localhost:8000"; // backend root

class AskYourDataApp {
  constructor() {
    this.datasetId = null;
    this.meta = {};
    this.charts = new Map();
    this.canvasZoom = 1;
    this.canvasOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.handDrawn = false;
    this.selected = null;
    this.init();
  }

  /* ───────────────────── INIT / EVENT-WIRE-UP ───────────────────── */
  init() {
    this.wireDom();
    this.setupCanvas();
    this.populateSuggestions();
  }

  wireDom() {
    ["loadDataBtn", "loadDataSidebarBtn", "welcomeLoadBtn"]
      .forEach(id => document.getElementById(id)
        .addEventListener("click", () => this.loadData()));

    document.getElementById("zoomIn").addEventListener("click", () => this.zoom(1.2));
    document.getElementById("zoomOut").addEventListener("click", () => this.zoom(0.8));
    document.getElementById("handDrawnToggle")
      .addEventListener("click", () => this.toggleSketch());

    /* chat */
    document.getElementById("sendBtn")
      .addEventListener("click", () => this.sendChat());
    document.getElementById("chatInput")
      .addEventListener("keypress", (e) => e.key === "Enter" && this.sendChat());
  }

  /* ───────────────────── DATA LOAD ───────────────────── */
  async loadData() {
    this.showLoader();
    const meta = await fetch(`${API}/load_csv`, { method: "POST", headers: {"Content-Type":"application/json"}, body: "{}" })
                        .then(r => r.json());
    this.datasetId = meta.dataset_id;
    this.meta      = meta;
    this.hideLoader();
    this.updateSidebar();
    await this.renderDefaultCharts();       // four charts on canvas
  }

  /* ───────────────────── DEFAULT CHARTS ───────────────────── */
  async renderDefaultCharts() {
    const queue = [
      {id:"chart-surv-ov",  title:"Survival Rate Overview",      ep:`/chart/survival_overview/${this.datasetId}`, pos:{x:100,y:100,w:350,h:300}},
      {id:"chart-surv-cls", title:"Survival by Passenger Class", ep:`/chart/survival_by_class/${this.datasetId}`, pos:{x:500,y:100,w:400,h:300}},
      {id:"chart-age",      title:"Age Distribution",            ep:`/chart/age_hist/${this.datasetId}`,          pos:{x:100,y:450,w:400,h:300}},
      {id:"chart-surv-gen", title:"Survival by Gender",          ep:`/chart/survival_by_gender/${this.datasetId}`,pos:{x:550,y:450,w:350,h:300}}
    ];

    for (const c of queue) {
      const img = await fetch(`${API}${c.ep}`).then(r => r.json()).then(d => d.png);
      this.spawnImageChart(c.id, c.title, img, c.pos);
    }
  }

  spawnImageChart(id, title, b64, {x,y,w,h}) {
    const obj = document.createElement("div");
    obj.className = `chart-object${this.handDrawn ? " hand-drawn" : ""}`;
    obj.id = id;
    Object.assign(obj.style, {left:`${x}px`, top:`${y}px`, width:`${w}px`, height:`${h}px`});

    obj.innerHTML = `
      <div class="chart-header">
        <h4 class="chart-title">${title}</h4>
        <button class="btn-icon" onclick="document.getElementById('${id}').remove()">✕</button>
      </div>
      <div class="chart-body">
        <img src="data:image/png;base64,${b64}" class="chart-canvas" />
      </div>
    `;
    document.getElementById("canvasContent").appendChild(obj);
  }

  /* ───────────────────── CHAT ───────────────────── */
  async sendChat() {
    const box   = document.getElementById("chatInput");
    const text  = box.value.trim();
    if (!text) return;
    box.value = "";

    this.addChatBubble(text, false);               // user
    const payload = { question: text, dataset_id: this.datasetId };
    const res = await fetch(`${API}/describe/${this.datasetId}`) // simple demo
                       .then(r => r.json());

    const answer = res.length ? JSON.stringify(res[0], null, 2) :
                   "Try asking for *describe*, *missing* or build a model.";
    this.addChatBubble(answer, true);               // AI
  }

  addChatBubble(msg, isAI) {
    const wrap = document.createElement("div");
    wrap.className = `${isAI ? "welcome-chat-message" : "chat-message"}`;
    wrap.innerHTML = `
      <div class="${isAI ? "ai-avatar"   : "user-avatar"}">${isAI ? "🤖" : "🧑"}</div>
      <div class="message-content"><pre>${msg}</pre></div>
    `;
    document.getElementById("chatMessages").appendChild(wrap);
    wrap.scrollIntoView({behavior:"smooth"});
  }

  /* ───────────────────── UTIL UI HELPERS ───────────────────── */
  showLoader()  { document.getElementById("loadingOverlay").classList.remove("hidden"); }
  hideLoader()  { document.getElementById("loadingOverlay").classList.add("hidden");   }

  updateSidebar() {
    document.getElementById("dataStatus").classList.add("hidden");
    document.getElementById("datasetInfo").classList.remove("hidden");
    document.getElementById("totalRows").textContent     = this.meta.total_rows;
    document.getElementById("totalCols").textContent     = this.meta.columns;
    document.getElementById("missingValues").textContent = this.meta.missing;
    document.getElementById("loadedTime").textContent    = new Date().toLocaleTimeString();
    /* columns list */
    const ul = document.getElementById("columnsList");
    ul.innerHTML = "";
    Object.entries(this.meta.dtypes).forEach(([col, typ]) => {
      const li = document.createElement("div");
      li.className = "column-item";
      li.innerHTML = `${col} <span class="column-type">${typ}</span>`;
      ul.appendChild(li);
    });
  }

  /* NOTE: canvas and zoom/pan behaviour can remain untouched from original app.js */
  setupCanvas() {
    const canvasWrapper = document.getElementById('canvasWrapper');
    const canvasContent = document.getElementById('canvasContent');

    canvasWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(zoomFactor);
    });

    canvasWrapper.addEventListener('mousedown', (e) => {
        if (e.target === canvasWrapper || e.target === canvasContent) {
            this.isDragging = true;
            this.dragStart.x = e.clientX - this.canvasOffset.x;
            this.dragStart.y = e.clientY - this.canvasOffset.y;
            canvasWrapper.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (this.isDragging) {
            this.canvasOffset.x = e.clientX - this.dragStart.x;
            this.canvasOffset.y = e.clientY - this.dragStart.y;
            this.updateCanvasTransform();
        }
    });

    document.addEventListener('mouseup', () => {
        this.isDragging = false;
        canvasWrapper.style.cursor = 'grab';
    });
  }

  zoom(factor) {
    this.canvasZoom *= factor;
    this.canvasZoom = Math.max(0.1, Math.min(3, this.canvasZoom));
    this.updateCanvasTransform();
    document.querySelector('.zoom-level').textContent = `${Math.round(this.canvasZoom * 100)}%`;
  }
  
  updateCanvasTransform() {
    const canvasContent = document.getElementById('canvasContent');
    canvasContent.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.canvasZoom})`;
  }

  toggleSketch() {
    this.handDrawn = !this.handDrawn;
    document.getElementById('handDrawnToggle').classList.toggle('active', this.handDrawn);
    document.querySelectorAll('.chart-object').forEach(el => {
        el.classList.toggle('hand-drawn', this.handDrawn);
    });
  }

  // This function can remain to populate the static suggestions in the HTML
  populateSuggestions() {
    const suggestionsList = document.getElementById('suggestionsList');
    if (!suggestionsList) return;
    suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('chatInput').value = item.textContent;
            this.sendChat();
        });
    });
  }
}

window.addEventListener("DOMContentLoaded", () => new AskYourDataApp());