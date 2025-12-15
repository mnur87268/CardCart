export function bootCardcartUI({ root, onReadyText }) {
  const KEY = "cardcart_items_v1";

  const defaultItems = [
    "Milk","Eggs","Bread","Rice","Pasta","Apples","Bananas","Tomatoes","Onions","Garlic",
    "Yogurt","Cheese","Chicken","Fish","Lentils","Tea","Coffee","Olive oil","Butter","Salt",
    "Pepper","Cereal","Carrots","Spinach","Potatoes","Soap","Shampoo","Toothpaste","Tissues","Water"
  ];

  const state = load() || {
    deck: defaultItems.map(t => ({ t, done:false })),
    cursor: 0
  };

  root.innerHTML = `
    <div class="wrap" id="wrap">
      <header class="top">
        <div class="brand">
          <div class="name">Card Cart</div>
          <div class="sub">one card at a time</div>
        </div>
        <div class="pill" id="envPill">WEB</div>
      </header>

      <main class="table">
        <div class="stack" id="stack" aria-label="Card stack"></div>

        <div class="hud">
          <div class="stat"><div class="k">LEFT</div><div class="v" id="leftV">0</div></div>
          <div class="stat"><div class="k">BOUGHT</div><div class="v" id="boughtV">0</div></div>
          <div class="stat"><div class="k">TOTAL</div><div class="v" id="totalV">0</div></div>
        </div>

        <div class="composer">
          <input id="input" class="input" placeholder="add item (enter)" autocomplete="off" />
          <button id="addBtn" class="btn" type="button">add</button>
          <button id="clearBtn" class="ghost" type="button">clear bought</button>
        </div>

        <div class="toast" id="toast">${onReadyText || "ready ✓"}</div>
      </main>
    </div>
  `;

  const el = {
    env: root.querySelector("#envPill"),
    wrap: root.querySelector("#wrap"),
    stack: root.querySelector("#stack"),
    leftV: root.querySelector("#leftV"),
    boughtV: root.querySelector("#boughtV"),
    totalV: root.querySelector("#totalV"),
    toast: root.querySelector("#toast"),
    input: root.querySelector("#input"),
    addBtn: root.querySelector("#addBtn"),
    clearBtn: root.querySelector("#clearBtn"),
  };

  function setEnv(isMini) {
    el.env.textContent = isMini ? "MINI" : "WEB";
    el.env.classList.toggle("mini", !!isMini);
  }

  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }

  function toast(msg){
    el.toast.textContent = msg;
    el.wrap.classList.remove("pop");
    void el.wrap.offsetWidth;
    el.wrap.classList.add("pop");
  }

  function remainingCount(){ return state.deck.filter(x => !x.done).length; }
  function totalCount(){ return state.deck.length; }
  function boughtCount(){ return state.deck.filter(x => x.done).length; }

  function currentIndex(){
    if (remainingCount() === 0) return -1;
    let i = state.cursor;
    for (let step=0; step<state.deck.length; step++){
      const idx = (i + step) % state.deck.length;
      if (!state.deck[idx].done) return idx;
    }
    return -1;
  }

  function renderHud(){
    el.leftV.textContent = String(remainingCount());
    el.boughtV.textContent = String(boughtCount());
    el.totalV.textContent = String(totalCount());
  }

  function renderStack(){
    el.stack.innerHTML = "";
    const idx = currentIndex();

    if (idx === -1){
      el.stack.innerHTML = `
        <div class="card doneAll">
          <div class="line"></div>
          <div class="item big">All bought ✅</div>
          <div class="hint">add more items below</div>
        </div>
      `;
      renderHud();
      return;
    }

    const topItem = state.deck[idx];
    const next1 = findNext(idx, 1);
    const next2 = findNext(idx, 2);

    const cards = [topItem, next1, next2].filter(Boolean);
    cards.forEach((it, layer) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.setProperty("--layer", String(layer));
      card.innerHTML = `
        <div class="line"></div>
        <div class="item">${escapeHtml(it.t)}</div>
        <div class="actions">
          <button class="act ok" type="button">bought</button>
          <button class="act skip" type="button">skip</button>
        </div>
        <div class="micro">tap bought or swipe ← / →</div>
      `;
      if (layer === 0) wireTop(card, idx);
      el.stack.appendChild(card);
    });

    renderHud();
  }

  function findNext(fromIdx, offset){
    if (remainingCount() === 0) return null;
    let count = 0;
    for (let step=1; step<=state.deck.length; step++){
      const idx = (fromIdx + step) % state.deck.length;
      if (!state.deck[idx].done) {
        count++;
        if (count === offset) return state.deck[idx];
      }
    }
    return null;
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function markBought(idx){
    state.deck[idx].done = true;
    state.cursor = (idx + 1) % state.deck.length;
    save();
    toast("bought ✓");
    renderStack();
  }

  function skip(idx, dir=1){
    state.cursor = (idx + dir + state.deck.length) % state.deck.length;
    save();
    toast("skipped");
    renderStack();
  }

  function wireTop(cardEl, idx){
    const ok = cardEl.querySelector(".ok");
    const sk = cardEl.querySelector(".skip");
    ok.addEventListener("click", () => slideAway(cardEl, () => markBought(idx), 1));
    sk.addEventListener("click", () => nudge(cardEl, () => skip(idx, 1), -1));

    let sx=null, sy=null, dragging=false;

    function down(e){
      const p = e.touches ? e.touches[0] : e;
      sx = p.clientX; sy = p.clientY;
      dragging = true;
    }
    function move(e){
      if (!dragging || sx==null) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - sx;
      const dy = p.clientY - sy;
      if (Math.abs(dy) > Math.abs(dx)) return;
      const t = Math.max(-140, Math.min(140, dx));
      cardEl.style.transform = `translateX(${t}px) rotate(${t/18}deg)`;
      cardEl.style.opacity = String(1 - Math.abs(t)/220);
    }
    function up(e){
      if (!dragging) return;
      dragging = false;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dx = p.clientX - sx;
      sx=null; sy=null;
      cardEl.style.transform = "";
      cardEl.style.opacity = "";

      if (dx > 90) {
        slideAway(cardEl, () => markBought(idx), 1);
      } else if (dx < -90) {
        nudge(cardEl, () => skip(idx, 1), -1);
      }
    }

    cardEl.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    cardEl.addEventListener("touchstart", down, { passive:true });
    cardEl.addEventListener("touchmove", move, { passive:true });
    cardEl.addEventListener("touchend", up, { passive:true });
  }

  function slideAway(cardEl, done, dir=1){
    cardEl.style.transform = `translateX(${dir*420}px) rotate(${dir*12}deg)`;
    cardEl.style.opacity = "0";
    setTimeout(done, 180);
  }

  function nudge(cardEl, done, dir=-1){
    cardEl.style.transform = `translateX(${dir*120}px) rotate(${dir*6}deg)`;
    cardEl.style.opacity = "0.85";
    setTimeout(() => {
      cardEl.style.transform = "";
      cardEl.style.opacity = "";
      done();
    }, 140);
  }

  function addItem(){
    const v = el.input.value.trim();
    if (!v) return toast("type an item");
    state.deck.push({ t: v, done:false });
    el.input.value = "";
    save();
    toast("added");
    renderStack();
  }

  function clearBought(){
    const before = state.deck.length;
    state.deck = state.deck.filter(x => !x.done);
    if (state.deck.length === 0) {
      state.deck = defaultItems.map(t => ({ t, done:false }));
    }
    state.cursor = 0;
    save();
    toast(`cleared ${before - state.deck.length}`);
    renderStack();
  }

  el.addBtn.addEventListener("click", addItem);
  el.input.addEventListener("keydown", (e) => { if (e.key === "Enter") addItem(); });
  el.clearBtn.addEventListener("click", clearBought);

  renderStack();
  toast(onReadyText || "ready ✓");

  return { setEnv };
}