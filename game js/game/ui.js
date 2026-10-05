import { SKINS, THEMES, difficultyFor } from "./data.js";

function button(action, label, className = "menu-btn", value = "") {
  const valueAttribute = value === "" ? "" : ` data-value="${value}"`;
  return `<button class="${className}" data-action="${action}"${valueAttribute}><span class="control-label">${label}</span></button>`;
}

export function createUI(mount, onAction) {
  const shell = document.createElement("section");
  shell.className = "game-shell";
  shell.innerHTML = `
    <canvas class="game-canvas" aria-label="Frog Hop playfield"></canvas>
    <div class="hud" hidden>
      <div class="hud-badge hud-score"><span class="hud-icon">✦</span><strong data-hud="score">0</strong></div>
      <div class="hud-center">
        <strong data-hud="stage">STAGE 1</strong>
        <span data-hud="theme">RIVER</span>
        <span class="progress-track"><i data-hud="progress"></i></span>
      </div>
      <div class="hud-badge hud-coins"><span class="coin-dot"></span><strong data-hud="coins">0</strong></div>
      <button class="icon-btn pause-btn" data-action="pause" aria-label="Pause">Ⅱ</button>
    </div>
    <div class="toast" data-toast hidden></div>
    <div class="controls-row game-controls" hidden>
      <button class="control-btn leaf-control leaf-left" data-control="left" aria-label="Steer and tongue left"><span class="control-label">←</span></button>
      <button class="control-btn leaf-control leaf-right" data-control="right" aria-label="Steer and tongue right"><span class="control-label">→</span></button>
    </div>
    <div class="overlay" data-overlay>
      <div class="loading-panel">
        <span class="loading-frog">●</span>
        <strong data-loading-text>Painting the river…</strong>
      </div>
    </div>
  `;
  mount.replaceChildren(shell);

  const canvas = shell.querySelector(".game-canvas");
  const overlay = shell.querySelector("[data-overlay]");
  const hud = shell.querySelector(".hud");
  const controls = shell.querySelector(".game-controls");
  const toast = shell.querySelector("[data-toast]");
  const leftButton = shell.querySelector("[data-control='left']");
  const rightButton = shell.querySelector("[data-control='right']");
  let previewCanvas = null;
  let thumbObserver = null;
  let currentScreen = "loading";

  const click = (event) => {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    onAction(target.dataset.action, target.dataset.value ?? "");
  };
  shell.addEventListener("click", click);

  function setChrome({ showHud = false, showControls = false }) {
    hud.hidden = !showHud;
    controls.hidden = !showControls;
  }

  function setOverlay(html, screen) {
    thumbObserver?.disconnect();
    thumbObserver = null;
    currentScreen = screen;
    overlay.hidden = false;
    overlay.innerHTML = html;
    previewCanvas = overlay.querySelector(".shop-preview");
  }

  function hideOverlay() {
    thumbObserver?.disconnect();
    thumbObserver = null;
    currentScreen = "playing";
    overlay.hidden = true;
    overlay.replaceChildren();
    previewCanvas = null;
  }

  return {
    canvas,
    leftButton,
    rightButton,
    get previewCanvas() {
      return previewCanvas;
    },
    get skinThumbCanvases() {
      return [...overlay.querySelectorAll(".skin-thumb")];
    },
    get screen() {
      return currentScreen;
    },
    showLoading(message = "Painting the river…", retry = false) {
      setChrome({});
      setOverlay(`
        <div class="loading-panel">
          <span class="loading-frog">●</span>
          <strong>${message}</strong>
          ${retry ? button("retry-load", "RETRY") : ""}
        </div>
      `, "loading");
    },
    showMenu(save) {
      setChrome({});
      const theme = THEMES[save.currentStage - 1];
      setOverlay(`
        <div class="main-menu">
          <div class="game-logo"><span>FROG</span><strong>HOP</strong></div>
          <p class="tagline">SMALL JUMPS · BIG ADVENTURES</p>
          <div class="menu-actions">
            ${button("continue", save.currentStage === 1 && save.checkpoint === 0 ? "NEW GAME" : "CONTINUE")}
            <p class="continue-copy">${theme.name} · Stage ${save.currentStage}${save.checkpoint ? ` · Checkpoint ${String.fromCharCode(64 + save.checkpoint)}` : ""}</p>
            <div class="menu-split">
              ${button("world", "WORLD", "menu-btn secondary")}
              ${button("shop", "FROG SHOP", "menu-btn secondary")}
            </div>
            ${button("settings", "SETTINGS", "menu-btn quiet")}
          </div>
          <div class="menu-stats"><span>BEST ${save.bestStage}/100</span><span>✦ ${save.totalFly}</span><span>● ${save.coins}</span></div>
        </div>
      `, "menu");
    },
    showPlaying(theme, run, save) {
      hideOverlay();
      setChrome({ showHud: true, showControls: true });
      this.updateHud(theme, run, save);
    },
    updateHud(theme, run, save) {
      shell.querySelector("[data-hud='score']").textContent = String(run.score);
      shell.querySelector("[data-hud='coins']").textContent = String(save.coins);
      shell.querySelector("[data-hud='stage']").textContent = `STAGE ${theme.stage}`;
      shell.querySelector("[data-hud='theme']").textContent = theme.name.toUpperCase();
      shell.querySelector("[data-hud='progress']").style.width = `${Math.round((run.progress || 0) * 100)}%`;
      if (run.toastTimer > 0) {
        toast.hidden = false;
        toast.textContent = run.toast;
      } else {
        toast.hidden = true;
      }
    },
    showPause(theme) {
      setChrome({ showHud: true });
      setOverlay(`
        <div class="modal-panel compact-panel">
          <span class="eyebrow">${theme.name} · Stage ${theme.stage}</span>
          <h2>PAUSED</h2>
          <div class="stack-actions">
            ${button("resume", "RESUME")}
            ${button("restart-checkpoint", "RESTART CHECKPOINT", "menu-btn secondary")}
            ${button("restart-theme", "RESTART THEME", "menu-btn secondary")}
            ${button("main-menu", "MAIN MENU", "menu-btn quiet")}
          </div>
        </div>
      `, "pause");
    },
    showFailure(theme, run) {
      setChrome({ showHud: true });
      setOverlay(`
        <div class="modal-panel compact-panel fail-panel">
          <span class="eyebrow">${theme.name} · Stage ${theme.stage}</span>
          <h2>OOPS!</h2>
          <p>${run.failReason === "BUMPED" ? "A hazard knocked you off course." : "The river is waiting below."}</p>
          <div class="result-line"><span>Checkpoint</span><strong>${run.checkpoint ? String.fromCharCode(64 + run.checkpoint) : "START"}</strong></div>
          <div class="stack-actions">
            ${button("continue-checkpoint", "CONTINUE FROM CHECKPOINT")}
            ${button("restart-theme", "RESTART THEME", "menu-btn secondary")}
            ${button("restart-beginning-confirm", "RESTART FROM BEGINNING", "menu-btn danger")}
          </div>
        </div>
      `, "failure");
    },
    showComplete(theme, run, reward, perfect, isFinal) {
      setChrome({ showHud: true });
      setOverlay(`
        <div class="modal-panel compact-panel complete-panel">
          <span class="eyebrow">WORLD CLEARED</span>
          <h2>${theme.name}</h2>
          <p>${perfect ? "PERFECT CATCH!" : `${run.caught}/${run.levelFlyCount} flies caught`}</p>
          <div class="reward-row"><strong>+${reward}</strong><span>COINS</span></div>
          <div class="stack-actions">
            ${button(isFinal ? "world" : "next-stage", isFinal ? "REPLAY WORLDS" : "NEXT WORLD")}
            ${button("main-menu", "MAIN MENU", "menu-btn quiet")}
          </div>
        </div>
      `, "complete");
    },
    showWorld(save) {
      setChrome({});
      const stages = THEMES.map((theme) => {
        const unlocked = theme.stage <= save.unlockedWorld;
        const perfect = save.perfectStages.includes(theme.stage);
        return `<button class="world-node ${unlocked ? "is-open" : "is-locked"} ${perfect ? "is-perfect" : ""}" data-action="select-stage" data-value="${theme.stage}" ${unlocked ? "" : "disabled"}>
          <strong>${theme.stage}</strong><span>${theme.name}</span><i>${perfect ? "★" : unlocked ? difficultyFor(theme.stage) : "LOCKED"}</i>
        </button>`;
      }).join("");
      setOverlay(`
        <div class="collection-panel">
          <div class="panel-header"><button class="icon-btn" data-action="main-menu" aria-label="Back">←</button><div><span class="eyebrow">THE JOURNEY</span><h2>100 WORLDS</h2></div><strong>${save.unlockedWorld}/100</strong></div>
          <div class="world-grid">${stages}</div>
        </div>
      `, "world");
    },
    showShop(save, selectedSkin) {
      setChrome({});
      const selected = SKINS[selectedSkin];
      const skins = SKINS.map((skin) => {
        const owned = save.ownedSkins.includes(skin.index);
        const unlocked = save.bestStage >= skin.unlockStage;
        return `<button class="skin-chip ${selectedSkin === skin.index ? "is-selected" : ""} ${owned ? "is-owned" : ""}" data-action="select-skin" data-value="${skin.index}">
          <canvas class="skin-thumb" data-skin-index="${skin.index}" aria-label="${skin.name} skin artwork"></canvas>
          <strong>${skin.name}</strong>
          <i>${owned ? "OWNED · 5 FRAMES" : unlocked ? `● ${skin.price} · 5 FRAMES` : `STAGE ${skin.unlockStage} · 5 FRAMES`}</i>
        </button>`;
      }).join("");
      const owned = save.ownedSkins.includes(selected.index);
      const unlocked = save.bestStage >= selected.unlockStage;
      let action = button("buy-skin", `BUY · ${selected.price} COINS`);
      if (owned) action = button("equip-skin", save.equippedSkin === selected.index ? "EQUIPPED" : "EQUIP", "menu-btn", selected.index);
      if (!unlocked) action = `<button class="menu-btn" disabled><span class="control-label">REACH STAGE ${selected.unlockStage}</span></button>`;
      setOverlay(`
        <div class="collection-panel shop-panel">
          <div class="panel-header"><button class="icon-btn" data-action="main-menu" aria-label="Back">←</button><div><span class="eyebrow">FROG SHOP</span><h2>${selected.name}</h2></div><strong>● ${save.coins}</strong></div>
          <div class="preview-wrap">
            <canvas class="shop-preview" aria-label="Five-frame animated skin preview"></canvas>
            <div class="frame-strip"><span>SQUAT</span><span>JUMP</span><span>AIR</span><span>LAND</span><span>BOUNCE</span></div>
          </div>
          <div class="shop-action">${action}</div>
          <div class="skin-grid">${skins}</div>
        </div>
      `, "shop");
      const grid = overlay.querySelector(".skin-grid");
      thumbObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const skinIndex = entry.target.dataset.skinIndex;
          onAction("load-skin-sheet", skinIndex);
          thumbObserver.unobserve(entry.target);
        }
      }, { root: grid, rootMargin: "180px 0px" });
      overlay.querySelectorAll(".skin-thumb").forEach((item) => thumbObserver.observe(item));
    },
    showSettings(save) {
      setChrome({});
      const toggle = (key, label) => `<button class="setting-row" data-action="toggle-setting" data-value="${key}"><span>${label}</span><i class="toggle ${save.settings[key] ? "is-on" : ""}"><b></b></i></button>`;
      setOverlay(`
        <div class="modal-panel settings-panel">
          <div class="panel-header"><button class="icon-btn" data-action="main-menu" aria-label="Back">←</button><div><span class="eyebrow">FROG HOP</span><h2>SETTINGS</h2></div><span></span></div>
          ${toggle("music", "Music")}
          ${toggle("sound", "Sound")}
          ${toggle("haptics", "Haptics")}
          ${toggle("reducedMotion", "Reduced Motion")}
          <p class="tiny-help">Hold ← or → to steer. Each new press flicks the tongue.</p>
        </div>
      `, "settings");
    },
    showResetConfirm() {
      setChrome({});
      setOverlay(`
        <div class="modal-panel compact-panel">
          <span class="eyebrow">FULL JOURNEY RESET</span>
          <h2>Back to River?</h2>
          <p>This erases worlds, coins, catches, and skins.</p>
          <div class="stack-actions">
            ${button("restart-beginning", "YES, START OVER", "menu-btn danger")}
            ${button("cancel-reset", "KEEP MY PROGRESS", "menu-btn secondary")}
          </div>
        </div>
      `, "reset-confirm");
    },
    destroy() {
      thumbObserver?.disconnect();
      shell.removeEventListener("click", click);
      shell.remove();
    },
  };
}
