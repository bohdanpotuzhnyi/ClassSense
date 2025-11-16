(() => {
  const root = document.getElementById("app");
  const initialDesign = root?.dataset?.design === "buttons" ? "buttons" : "slider";

  const state = {
    design: initialDesign,
    theme: "light",
    pin: "",
    status: "Enter a class PIN to connect.",
    env: { temperature: 22, co2: 650, noise: 35, lastUpdated: null },
    connected: false,
    error: null,
    sliderValue: 50,
  };

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) state.theme = "dark";

  const $ = (selector) => document.querySelector(selector);

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    $("#themeToggle").textContent = theme === "dark" ? "Light" : "Dark";
  }

  function setDesign(design) {
    state.design = design;
    const target = design === "buttons" ? "/buttons" : "/slider";
    if (window.location.pathname !== target && window.history?.pushState) {
      window.history.pushState({}, "", target);
    }
    if (root) root.dataset.design = design;
    render();
  }

  function badge(label, value) {
    return `
      <div class="env-badge elevated">
        <div class="env-icon">${label}</div>
        <div class="env-value">${value}</div>
      </div>
    `;
  }

  function envLabel(type, value) {
    if (type === "temperature") return `${Math.round(value)}°C`;
    if (type === "co2") return value > 600 ? "high" : "OK";
    if (type === "noise") return value > 45 ? "loud" : "OK";
    return "";
  }

  function emoji(val) {
    if (val < 25) return "😵";
    if (val < 50) return "😕";
    if (val < 75) return "🙂";
    return "😊";
  }

  function status(text, isError = false) {
    state.status = text;
    state.error = isError ? text : null;
    $("#status").textContent = text;
    $("#status").className = isError ? "status error" : "status";
  }

  async function verifyPin(pin) {
    try {
      const res = await fetch(`/api/classes/${pin}/state`);
      if (!res.ok) throw new Error("not_found");
      await res.json();
      state.pin = pin;
      state.connected = true;
      localStorage.setItem("class_pin", pin);
      status(`Connected to class ${pin}`);
      startPolling();
      render();
    } catch (e) {
      state.connected = false;
      status("PIN not found. Check the PIN and retry.", true);
    }
  }

  async function fetchState() {
    if (!state.pin) return;
    try {
      const res = await fetch(`/api/classes/${state.pin}/state`);
      if (!res.ok) throw new Error("not_found");
      const data = await res.json();
      const sensors = data.last_sensor?.sensors || {};
      state.env = {
        temperature: sensors.temperature_c ?? 22,
        co2: sensors.eco2_ppm ?? 650,
        noise: sensors.noise_db ?? 35,
        lastUpdated: data.last_sensor_at,
      };
      renderEnv();
    } catch (e) {
      state.connected = false;
      status("Connection lost or PIN invalid.", true);
      render();
    }
  }

  let pollTimer;
  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(fetchState, 5000);
    fetchState();
  }

  async function sendEmotion(payload) {
    if (!state.pin) {
      status("Set a PIN first.", true);
      return;
    }
    const endpoint = `/api/classes/${state.pin}/emotions`;
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status("Feedback sent.");
      showToast("Feedback sent");
    } catch (e) {
      status("Failed to send feedback.", true);
      showToast("Could not send feedback");
    }
  }

  function renderEnv() {
    const envEl = $("#env");
    if (!envEl) return;
    const { temperature, co2, noise, lastUpdated } = state.env;
    envEl.innerHTML = `
      <div class="env-row fancy">
        ${badge("°C", envLabel("temperature", temperature))}
        ${badge("CO₂", envLabel("co2", co2))}
        ${badge("🔊", envLabel("noise", noise))}
      </div>
      <div class="muted">Last sensor update: ${lastUpdated || "none"}</div>
    `;
  }

  function renderControls() {
    const controls = $("#controls");
    if (!state.connected) {
      controls.innerHTML = `
        <div class="placeholder-card">
          <div class="eyebrow">Waiting to connect</div>
          <div class="placeholder-title">Start by entering a class PIN</div>
          <p class="muted">You can switch between slider and buttons at any time.</p>
        </div>
      `;
      return;
    }
    if (state.design === "slider") {
      controls.innerHTML = `
        <div class="control-card focus-card">
          <div class="control-header">
            <div>
              <div class="eyebrow">Focus check-in</div>
              <h2 class="control-title">How is the pace right now?</h2>
            </div>
            <span class="pill muted">0 – 100</span>
          </div>
          <div class="focus-visual">
            <div class="emoji-bubble">${emoji(state.sliderValue)}</div>
            <div class="focus-score">${state.sliderValue}</div>
            <div class="muted">Slide to capture the room's focus level.</div>
          </div>
          <div class="slider-wrap">
            <input type="range" id="slider" min="0" max="100" step="1" value="${state.sliderValue}" />
            <div class="labels"><span>Low</span><span>${state.sliderValue}</span><span>High</span></div>
          </div>
          <button id="sendFocus" class="primary wide">Send focus</button>
        </div>
      `;
      $("#slider").oninput = (e) => {
        state.sliderValue = Number(e.target.value);
        renderControls();
      };
      $("#sendFocus").onclick = () => sendEmotion({ focus: state.sliderValue });
    } else {
      // Buttons design (pace)
      controls.innerHTML = `
        <div class="control-card pace-card">
          <div class="control-header">
            <div>
              <div class="eyebrow">Pace feedback</div>
              <h2 class="control-title">How is the pace right now?</h2>
            </div>
            <span class="pill muted">Tap to send</span>
          </div>
          <div class="pace-main">
            <div class="pace-grid">
              <button class="pace-tile pace-fast" data-key="too-fast">
                <span class="tile-label">Too fast</span>
                <span class="tile-sub">Slow down</span>
              </button>
              <button class="pace-tile pace-overloaded" data-key="overloaded">
                <span class="tile-label">Overloaded</span>
                <span class="tile-sub">Need a pause</span>
              </button>
              <button class="pace-tile pace-ok" data-key="ok">
                <span class="tile-label">Cruising</span>
                <span class="tile-sub">Keep it up</span>
              </button>
              <button class="pace-tile pace-tired" data-key="tired">
                <span class="tile-label">Tired</span>
                <span class="tile-sub">Energy dip</span>
              </button>
            </div>
          </div>
        </div>
      `;

      controls.querySelectorAll(".pace-tile").forEach((btn) => {
        btn.onclick = () => sendEmotion({ pace: btn.dataset.key });
      });
    }
  }

  function renderEnvFooter() {
    const footer = $("#envFooter");
    if (footer) footer.innerHTML = "";
  }

  function render() {
    const savedPin = localStorage.getItem("class_pin") || "";
    if (!state.pin && savedPin) {
      state.pin = savedPin;
      if (!state.connected) verifyPin(savedPin);
    }

    root.innerHTML = `
      <div class="page">
        <header class="topbar">
          <div class="brand">ClassSense</div>
          <div class="actions">
            <button id="designToggle" class="ghost">${state.design === "slider" ? "Switch to buttons" : "Switch to slider"}</button>
            <button id="themeToggle" class="ghost">${state.theme === "dark" ? "Light" : "Dark"}</button>
          </div>
        </header>

        <section class="card hero-card">
          <div class="hero-copy">
            <div class="eyebrow">Live classroom pulse</div>
            <h1 class="hero-title">Invite quick, anonymous feedback</h1>
            <p class="muted">Share the link and let students send focus and pace signals in seconds.</p>
          </div>
          <div class="pin-stack">
            <div class="pin-row">
              <input id="pinInput" type="text" maxlength="5" placeholder="Class PIN" value="${state.pin}" />
              <button id="connectBtn" class="primary">Connect</button>
            </div>
            <div id="status" class="status">${state.status}</div>
          </div>
        </section>

        <section class="card split-card">
          <div class="controls-col">
            <div id="controls"></div>
          </div>
          <div class="env-col">
            <div class="section-heading">
              <div>
                <div class="eyebrow">Room snapshot</div>
                <h3 class="control-title small">Environment signals</h3>
              </div>
              <div class="pill muted">${state.connected ? "Live" : "Waiting"}</div>
            </div>
            <div id="env" class="env-panel"></div>
          </div>
        </section>
      </div>
    `;

    $("#connectBtn").onclick = () => {
      const pin = ($("#pinInput").value || "").trim();
      verifyPin(pin);
    };
    $("#designToggle").onclick = () => setDesign(state.design === "slider" ? "buttons" : "slider");
    setTheme(state.theme);
    $("#themeToggle").onclick = () => setTheme(state.theme === "dark" ? "light" : "dark");

    renderControls();
  }

  // Init
  if (root) render();
})();
  function showToast(message) {
    let tray = document.getElementById("toastTray");
    if (!tray) {
      tray = document.createElement("div");
      tray.id = "toastTray";
      document.body.appendChild(tray);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    tray.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade");
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }
