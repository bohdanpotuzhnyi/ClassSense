(() => {
  const root = document.getElementById("app");
  const initialDesign = root?.dataset?.design === "buttons" ? "buttons" : "slider";

  const translations = {
    en: {
      theme_light: "Light",
      theme_dark: "Dark",
      toggle_buttons: "Switch to buttons",
      toggle_slider: "Switch to slider",
      hero_eyebrow: "Live classroom pulse",
      hero_title: "Invite quick, anonymous feedback",
      hero_body: "Share the link and let students send focus and pace signals in seconds.",
      forms_buttons_link: "Buttons form",
      forms_slider_link: "Slider form",
      pin_placeholder: "Class PIN",
      connect: "Connect",
      status_enter_pin: "Enter a class PIN to connect.",
      status_connected: "Connected to class {pin}",
      status_pin_not_found: "PIN not found. Check the PIN and retry.",
      status_connection_lost: "Connection lost or PIN invalid.",
      status_pin_required: "Set a PIN first.",
      status_feedback_sent: "Feedback sent.",
      status_feedback_failed: "Failed to send feedback.",
      toast_feedback_sent: "Feedback sent",
      toast_feedback_failed: "Could not send feedback",
      forms_link_pending: "Form link coming soon.",
      waiting_eyebrow: "Waiting to connect",
      waiting_title: "Start by entering a class PIN",
      waiting_body: "You can switch between slider and buttons at any time.",
      focus_eyebrow: "Focus check-in",
      pace_question: "How is the pace right now?",
      range_label: "0 – 100",
      range_prompt: "Slide to capture the room's focus level.",
      low_label: "Low",
      high_label: "High",
      send_focus: "Send focus",
      pace_eyebrow: "Pace feedback",
      tap_to_send: "Tap to send",
      pace_fast: "Too fast",
      pace_fast_sub: "Slow down",
      pace_overloaded: "Overloaded",
      pace_overloaded_sub: "Need a pause",
      pace_ok: "Cruising",
      pace_ok_sub: "Keep it up",
      pace_tired: "Tired",
      pace_tired_sub: "Energy dip",
      room_snapshot: "Room snapshot",
      env_signals: "Environment signals",
      live: "Live",
      waiting: "Waiting",
      last_sensor: "Last sensor update: {time}",
      none: "none",
      env_high: "high",
      env_ok: "OK",
      env_loud: "loud",
    },
    de: {
      theme_light: "Hell",
      theme_dark: "Dunkel",
      toggle_buttons: "Zu Buttons wechseln",
      toggle_slider: "Zu Schieberegler wechseln",
      hero_eyebrow: "Live-Klassenstatus",
      hero_title: "Schnelles, anonymes Feedback einholen",
      hero_body: "Link teilen und die Klasse kann Fokus und Tempo in Sekunden melden.",
      pin_placeholder: "Klassen-PIN",
      connect: "Verbinden",
      status_enter_pin: "Gib eine Klassen-PIN ein, um zu verbinden.",
      status_connected: "Mit Klasse {pin} verbunden",
      status_pin_not_found: "PIN nicht gefunden. Prüfe die PIN und versuche es erneut.",
      status_connection_lost: "Verbindung verloren oder PIN ungültig.",
      status_pin_required: "Bitte zuerst eine PIN eingeben.",
      status_feedback_sent: "Feedback gesendet.",
      status_feedback_failed: "Feedback konnte nicht gesendet werden.",
      toast_feedback_sent: "Feedback gesendet",
      toast_feedback_failed: "Feedback konnte nicht gesendet werden",
      forms_link_pending: "Formular-Link folgt.",
      waiting_eyebrow: "Warten auf Verbindung",
      waiting_title: "Starte mit der Klassen-PIN",
      waiting_body: "Du kannst jederzeit zwischen Slider und Buttons wechseln.",
      focus_eyebrow: "Fokus-Check-in",
      pace_question: "Wie ist das Tempo gerade?",
      range_label: "0 – 100",
      range_prompt: "Schieb und zeig, wie sich das Tempo anfühlt.",
      low_label: "Niedrig",
      high_label: "Hoch",
      send_focus: "Fokus senden",
      pace_eyebrow: "Tempo-Feedback",
      tap_to_send: "Tippen zum Senden",
      pace_fast: "Zu schnell",
      pace_fast_sub: "Bitte langsamer",
      pace_overloaded: "Überlastet",
      pace_overloaded_sub: "Brauche eine Pause",
      pace_ok: "Gut im Flow",
      pace_ok_sub: "So weitermachen",
      pace_tired: "Müde",
      pace_tired_sub: "Energietief",
      room_snapshot: "Raum-Übersicht",
      env_signals: "Umgebungs-Signale",
      live: "Live",
      waiting: "Warten",
      last_sensor: "Letztes Sensor-Update: {time}",
      none: "keins",
      env_high: "hoch",
      env_ok: "OK",
      env_loud: "laut",
    },
    "de-ch": {
      theme_light: "Hell",
      theme_dark: "Dunkel",
      toggle_buttons: "Uf Chnöpf wechselä",
      toggle_slider: "Uf Schieber wechselä",
      hero_eyebrow: "Live-Klassestimmig",
      hero_title: "Schnells, anonyms Feedback iihole",
      hero_body: "Link teile und d'Schüler chönd im Nu Fokus und Tempo melde.",
      forms_buttons_link: "Chnöpf-Form",
      forms_slider_link: "Slider-Form",
      pin_placeholder: "Klasse-PIN",
      connect: "Verbinde",
      status_enter_pin: "Gib e Klass-PIN ii zum verbinde.",
      status_connected: "Mit de Klass {pin} verbunde",
      status_pin_not_found: "PIN nöd gfunde. Prüef d PIN und versuchs nomol.",
      status_connection_lost: "Verbindig verlore oder PIN ungültig.",
      status_pin_required: "Zers e PIN iigäh.",
      status_feedback_sent: "Feedback gsändet.",
      status_feedback_failed: "Feedback chas nöd gsendet werde.",
      toast_feedback_sent: "Feedback gsändet",
      toast_feedback_failed: "Feedback chas nöd gsendet werde",
      forms_link_pending: "Form-Link chunnt no.",
      waiting_eyebrow: "Am warte uf Verbindig",
      waiting_title: "Fang a mit de Klass-PIN",
      waiting_body: "Du chasch jederzyt zwüsche Slider und Chnöpf wächsle.",
      focus_eyebrow: "Fokus-Check-in",
      pace_question: "Wie isch s Tempo grad?",
      range_label: "0 – 100",
      range_prompt: "Schieb und zeig, wie gfühlt s Tempo isch.",
      low_label: "Niderig",
      high_label: "Hoch",
      send_focus: "Fokus schicke",
      pace_eyebrow: "Tempo-Feedback",
      tap_to_send: "Tippe zum schicke",
      pace_fast: "Z schnäll",
      pace_fast_sub: "Bitte langsamer",
      pace_overloaded: "Überlade",
      pace_overloaded_sub: "Bruch e Pause",
      pace_ok: "Guet im Fluss",
      pace_ok_sub: "So wiitermache",
      pace_tired: "Müed",
      pace_tired_sub: "Energiedip",
      room_snapshot: "Raum-Übersicht",
      env_signals: "Umgebigs-Signau",
      live: "Live",
      waiting: "Am warte",
      last_sensor: "Letschti Sensordate: {time}",
      none: "keini",
      env_high: "hoog",
      env_ok: "OK",
      env_loud: "laut",
    },
  };

  const fallbackLang = "en";
  const supportedLangs = Object.keys(translations);
  const normalizeLang = (lang) => (lang || "").toLowerCase();
  const nextLang = (lang) => {
    const order = ["en", "de", "de-ch"];
    const idx = order.indexOf(lang);
    return order[(idx + 1) % order.length] || "en";
  };
  const detectLanguage = () => {
    const stored = localStorage?.getItem?.("lang");
    if (stored && supportedLangs.includes(normalizeLang(stored))) return normalizeLang(stored);
    if (typeof navigator === "undefined") return fallbackLang;
    const preferred = [...(navigator.languages || []), navigator.language].filter(Boolean).map(normalizeLang);
    for (const lang of preferred) {
      if (supportedLangs.includes(lang)) return lang;
      if (lang.startsWith("de") || lang.startsWith("gsw")) return "de-ch";
    }
    return fallbackLang;
  };

  const nowMs = () => {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  };

  const entryTimes = {
    slider: nowMs(),
    buttons: nowMs(),
  };

  const formLinks = {
    buttons: "https://forms.office.com/e/Ww2xeZGa6s",
    slider: "https://forms.office.com/e/CAq6qExFeb",
  };

  const state = {
    design: initialDesign,
    theme: "light",
    pin: "",
    status: "",
    env: { temperature: 22, co2: 650, noise: 35, lastUpdated: null },
    connected: false,
    error: null,
    sliderValue: 50,
    lang: detectLanguage(),
  };

  const t = (key, vars = {}) => {
    const dict = translations[state.lang] || translations[fallbackLang];
    const fallbackDict = translations[fallbackLang];
    const template = dict[key] ?? fallbackDict[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
  };
  document.documentElement?.setAttribute("lang", state.lang);
  state.status = t("status_enter_pin");

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) state.theme = "dark";

  const $ = (selector) => document.querySelector(selector);

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    $("#themeToggle").textContent = theme === "dark" ? t("theme_light") : t("theme_dark");
  }

  function resetEntryTimer(design) {
    entryTimes[design] = nowMs();
  }

  function withResponseTime(payload) {
    const designKey = state.design === "slider" ? "slider_time_ms" : "buttons_time_ms";
    const elapsed = Math.max(Math.round(nowMs() - (entryTimes[state.design] || nowMs())), 0);
    return { ...payload, [designKey]: elapsed };
  }

  function setLanguage(lang) {
    if (!supportedLangs.includes(lang)) lang = fallbackLang;
    state.lang = lang;
    localStorage?.setItem?.("lang", lang);
    document.documentElement?.setAttribute("lang", state.lang);
    // Refresh status copy to match the new language
    if (state.connected && state.pin) {
      status(t("status_connected", { pin: state.pin }), !!state.error);
    } else if (!state.connected && !state.error) {
      status(t("status_enter_pin"));
    }
    render();
  }

  function setDesign(design) {
    state.design = design;
    resetEntryTimer(design);
    const target = design === "buttons" ? "/buttons" : "/slider";
    if (window.location.pathname !== target && window.history?.pushState) {
      window.history.pushState({}, "", target);
    }
    if (root) root.dataset.design = design;
    render();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resetEntryTimer(state.design);
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("focus", () => resetEntryTimer(state.design));
  }

  function openFormsLink() {
    const url = state.design === "slider" ? formLinks.slider : formLinks.buttons;
    if (!url || url.startsWith("#")) {
      showToast(t("forms_link_pending"));
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  function badge(label, value) {
    return `
      <div class="env-badge">
        <div class="env-icon">${label}</div>
        <div class="env-value">${value}</div>
      </div>
    `;
  }

  function envLabel(type, value) {
    if (type === "temperature") return `${Math.round(value)}°C`;
    if (type === "co2") return value > 600 ? t("env_high") : t("env_ok");
    if (type === "noise") return value > 45 ? t("env_loud") : t("env_ok");
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
      status(t("status_connected", { pin }));
      startPolling();
      render();
    } catch (e) {
      state.connected = false;
      status(t("status_pin_not_found"), true);
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
      status(t("status_connection_lost"), true);
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
      status(t("status_pin_required"), true);
      return;
    }
    const endpoint = `/api/classes/${state.pin}/emotions`;
    const timedPayload = withResponseTime(payload);
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timedPayload),
      });
      status(t("status_feedback_sent"));
      showToast(t("toast_feedback_sent"));
      resetEntryTimer(state.design);
    } catch (e) {
      status(t("status_feedback_failed"), true);
      showToast(t("toast_feedback_failed"));
    }
  }

  function renderEnv() {
    const envEl = $("#env");
    if (!envEl) return;
    const { temperature, co2, noise, lastUpdated } = state.env;
    const lastValue = lastUpdated || t("none");
    envEl.innerHTML = `
      <div class="env-row fancy">
        ${badge("°C", envLabel("temperature", temperature))}
        ${badge("CO₂", envLabel("co2", co2))}
        ${badge("🔊", envLabel("noise", noise))}
      </div>
      <div class="muted">${t("last_sensor", { time: lastValue })}</div>
    `;
  }

  function renderControls() {
    const controls = $("#controls");
    if (!state.connected) {
      controls.innerHTML = `
        <div class="placeholder-card">
          <div class="eyebrow">${t("waiting_eyebrow")}</div>
          <div class="placeholder-title">${t("waiting_title")}</div>
          <p class="muted">${t("waiting_body")}</p>
        </div>
      `;
      return;
    }
    if (state.design === "slider") {
      controls.innerHTML = `
        <div class="control-card focus-card">
          <div class="control-header">
            <div>
              <div class="eyebrow">${t("focus_eyebrow")}</div>
              <h2 class="control-title">${t("pace_question")}</h2>
            </div>
            <span class="pill muted">${t("range_label")}</span>
          </div>
          <div class="focus-visual">
            <div id="sliderEmoji" class="emoji-bubble">${emoji(state.sliderValue)}</div>
            <div id="sliderScore" class="focus-score">${state.sliderValue}</div>
            <div class="muted">${t("range_prompt")}</div>
          </div>
          <div class="slider-wrap">
            <input type="range" id="sliderInput" min="0" max="100" step="1" value="${state.sliderValue}" />
            <div class="labels"><span>${t("low_label")}</span><span id="sliderMidLabel">${state.sliderValue}</span><span>${t("high_label")}</span></div>
          </div>
          <button id="sendFocus" class="primary wide">${t("send_focus")}</button>
        </div>
      `;

      const sliderEl = $("#sliderInput");
      const emojiEl = $("#sliderEmoji");
      const scoreEl = $("#sliderScore");
      const midLabelEl = $("#sliderMidLabel");

      const updateSliderUI = (val) => {
        if (scoreEl) scoreEl.textContent = val;
        if (emojiEl) emojiEl.textContent = emoji(val);
        if (midLabelEl) midLabelEl.textContent = val;
      };

      if (sliderEl) {
        sliderEl.oninput = (e) => {
          state.sliderValue = Number(e.target.value);
          updateSliderUI(state.sliderValue);
        };
      }

      updateSliderUI(state.sliderValue);
      $("#sendFocus").onclick = () => sendEmotion({ focus: state.sliderValue });
    } else {
      // Buttons design (pace)
      controls.innerHTML = `
        <div class="control-card pace-card">
          <div class="control-header">
            <div>
              <div class="eyebrow">${t("pace_eyebrow")}</div>
              <h2 class="control-title">${t("pace_question")}</h2>
            </div>
            <span class="pill muted">${t("tap_to_send")}</span>
          </div>
          <div class="pace-main">
            <div class="pace-grid">
              <button class="pace-tile pace-fast" data-key="too-fast">
                <span class="tile-label">${t("pace_fast")}</span>
                <span class="tile-sub">${t("pace_fast_sub")}</span>
              </button>
              <button class="pace-tile pace-overloaded" data-key="overloaded">
                <span class="tile-label">${t("pace_overloaded")}</span>
                <span class="tile-sub">${t("pace_overloaded_sub")}</span>
              </button>
              <button class="pace-tile pace-ok" data-key="ok">
                <span class="tile-label">${t("pace_ok")}</span>
                <span class="tile-sub">${t("pace_ok_sub")}</span>
              </button>
              <button class="pace-tile pace-tired" data-key="tired">
                <span class="tile-label">${t("pace_tired")}</span>
                <span class="tile-sub">${t("pace_tired_sub")}</span>
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

    const langLabel = { en: "EN", de: "DE", "de-ch": "CH" }[state.lang] || "EN";

    root.innerHTML = `
      <div class="page">
        <header class="topbar">
          <div class="brand">ClassSense</div>
          <div class="actions">
            <button id="langToggle" class="ghost">${langLabel}</button>
            <button id="formsLink" class="ghost">${state.design === "slider" ? t("forms_slider_link") : t("forms_buttons_link")}</button>
            <button id="designToggle" class="ghost">${state.design === "slider" ? t("toggle_buttons") : t("toggle_slider")}</button>
            <button id="themeToggle" class="ghost">${state.theme === "dark" ? t("theme_light") : t("theme_dark")}</button>
          </div>
        </header>

        <section class="card hero-card">
          <div class="hero-copy">
            <div class="eyebrow">${t("hero_eyebrow")}</div>
            <h1 class="hero-title">${t("hero_title")}</h1>
            <p class="muted">${t("hero_body")}</p>
          </div>
          <div class="pin-stack">
            <div class="pin-row">
              <input id="pinInput" type="text" maxlength="5" placeholder="${t("pin_placeholder")}" value="${state.pin}" />
              <button id="connectBtn" class="primary">${t("connect")}</button>
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
                <div class="eyebrow">${t("room_snapshot")}</div>
                <h3 class="control-title small">${t("env_signals")}</h3>
              </div>
              <div class="pill muted">${state.connected ? t("live") : t("waiting")}</div>
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
    $("#langToggle").onclick = () => setLanguage(nextLang(state.lang));
    $("#formsLink").onclick = () => openFormsLink();
    $("#designToggle").onclick = () => setDesign(state.design === "slider" ? "buttons" : "slider");
    setTheme(state.theme);
    $("#themeToggle").onclick = () => setTheme(state.theme === "dark" ? "light" : "dark");

    renderControls();
  }

  // Init
  resetEntryTimer(state.design);
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
