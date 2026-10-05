import { createAudioController } from "./audio.js";
import { loadCreatureSheet, loadGameAssets, loadSkinSheet } from "./assets.js";
import { SKINS, THEMES } from "./data.js";
import { createInput } from "./input.js";
import { generateLevel, resetTransientLevelState, updateLevel } from "./level.js";
import { createRun, flickTongue, updateRun } from "./physics.js";
import { createRenderer } from "./renderer.js";
import { freshSave, loadSave, persistSave } from "./save.js";
import { createUI } from "./ui.js";

function leaderboardScore(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER));
}

export function createGame({ mount, sdk, ready, tweaks, assets }) {
  let destroyed = false;
  let frameId = 0;
  let lastTime = performance.now();
  let gameAssets = null;
  let save = freshSave();
  let audio = null;
  let input = null;
  let renderer = null;
  let level = null;
  let run = null;
  let screen = "loading";
  let selectedSkin = 0;
  let resetReturnScreen = "menu";
  const unsubscribers = [];
  const tuning = {
    gravity: Number(tweaks.get("gravity")),
    bounceVelocity: Number(tweaks.get("bounceVelocity")),
    steering: Number(tweaks.get("steering")),
    enemySpeed: Number(tweaks.get("enemySpeed")),
    effectsIntensity: Number(tweaks.get("effectsIntensity")),
  };

  const ui = createUI(mount, handleAction);
  renderer = createRenderer(ui.canvas);
  input = createInput({
    leftButton: ui.leftButton,
    rightButton: ui.rightButton,
    onPress: handleDirectionPress,
    onPause: togglePause,
  });

  for (const key of Object.keys(tuning)) {
    unsubscribers.push(tweaks.subscribe(key, (value) => {
      tuning[key] = Number(value);
    }));
  }

  function haptic(pattern) {
    if (!save.settings.haptics || !ready || !sdk.device.haptics.isSupported()) return;
    void sdk.device.haptics.vibrate(pattern).catch(() => {});
  }

  function saveNow() {
    persistSave(sdk, save);
  }

  async function boot() {
    screen = "loading";
    ui.showLoading();
    try {
      const [loadedAssets, loadedSave, audioController] = await Promise.all([
        loadGameAssets(assets),
        loadSave(sdk),
        createAudioController(sdk),
      ]);
      const [equippedSheet, creatureSheet] = await Promise.all([
        loadSkinSheet(assets, loadedSave.equippedSkin),
        loadCreatureSheet(assets, loadedSave.currentStage - 1),
      ]);
      if (destroyed) {
        audioController.destroy();
        return;
      }
      gameAssets = loadedAssets;
      gameAssets.skinSheets.set(equippedSheet.key, equippedSheet);
      gameAssets.creatureSheets.set(creatureSheet.key, creatureSheet);
      save = loadedSave;
      selectedSkin = save.equippedSkin;
      audio?.destroy();
      audio = audioController;
      audio.setSettings(save.settings);
      audio.setPaused(true);
      renderer.setAssets(gameAssets);
      screen = "menu";
      ui.showMenu(save);
    } catch {
      if (!destroyed) ui.showLoading("The paint is still wet.", true);
    }
  }

  function unlockAudio() {
    if (!audio) return;
    void audio.unlock();
  }

  async function ensureSkinLoaded(skinIndex) {
    if (!gameAssets) return;
    const key = SKINS[skinIndex]?.sheetAsset;
    if (!key || gameAssets.skinSheets.has(key)) return;
    try {
      const sheet = await loadSkinSheet(assets, skinIndex);
      if (!destroyed) gameAssets.skinSheets.set(sheet.key, sheet);
    } catch {
      // The classic frog remains a playable fallback if an optional shop sheet fails.
    }
  }

  async function ensureCreatureLoaded(themeIndex) {
    if (!gameAssets) return;
    const key = THEMES[themeIndex]?.creatureSheetAsset;
    if (!key || gameAssets.creatureSheets.has(key)) return;
    try {
      const sheet = await loadCreatureSheet(assets, themeIndex);
      if (!destroyed) gameAssets.creatureSheets.set(sheet.key, sheet);
    } catch {
      // Static themed creatures remain available if an animation sheet fails.
    }
  }

  function startStage(stage, checkpoint = 0) {
    const safeStage = Math.max(1, Math.min(100, Number(stage) || 1));
    const safeCheckpoint = Math.max(0, Math.min(3, Number(checkpoint) || 0));
    level = generateLevel(safeStage);
    void ensureCreatureLoaded(safeStage - 1);
    resetTransientLevelState(level);
    run = createRun(level, safeCheckpoint, renderer.getSize().width);
    run.levelFlyCount = level.totalFlies;
    save.currentStage = safeStage;
    save.checkpoint = safeCheckpoint;
    save.bestStage = Math.max(save.bestStage, safeStage);
    saveNow();
    screen = "playing";
    input.clear();
    audio?.setTheme(safeStage - 1);
    audio?.setPaused(false);
    ui.showPlaying(level.theme, run, save);
  }

  function handleDirectionPress(direction) {
    unlockAudio();
    if (screen !== "playing" || !run || !level) return;
    if (!run.started) {
      run.started = true;
      run.frog.vy = tuning.bounceVelocity;
      audio?.play("bounce");
      haptic(18);
    }
    const result = flickTongue(run, level, direction, renderer.getSize().width, performance.now() / 1000);
    if (result?.caught) {
      audio?.play("catch");
      haptic(14);
    }
  }

  function handleAction(action, value) {
    if (action === "load-skin-sheet") {
      void ensureSkinLoaded(Math.max(0, Math.min(99, Number(value) || 0)));
      return;
    }
    unlockAudio();
    audio?.play("ui");
    if (action === "retry-load") {
      void boot();
    } else if (action === "continue") {
      startStage(save.currentStage, save.checkpoint);
    } else if (action === "pause") {
      togglePause();
    } else if (action === "resume") {
      resumeGame();
    } else if (action === "continue-checkpoint" || action === "restart-checkpoint") {
      startStage(save.currentStage, save.checkpoint);
    } else if (action === "restart-theme") {
      startStage(save.currentStage, 0);
    } else if (action === "main-menu") {
      showMainMenu();
    } else if (action === "next-stage") {
      startStage(Math.min(100, (level?.stage || save.currentStage) + 1), 0);
    } else if (action === "world") {
      screen = "world";
      audio?.setPaused(true);
      ui.showWorld(save);
    } else if (action === "select-stage") {
      startStage(Number(value), 0);
    } else if (action === "shop") {
      selectedSkin = save.equippedSkin;
      screen = "shop";
      audio?.setPaused(true);
      ui.showShop(save, selectedSkin);
    } else if (action === "select-skin") {
      selectedSkin = Math.max(0, Math.min(99, Number(value) || 0));
      ui.showShop(save, selectedSkin);
      void ensureSkinLoaded(selectedSkin);
    } else if (action === "buy-skin") {
      buySelectedSkin();
    } else if (action === "equip-skin") {
      equipSelectedSkin();
    } else if (action === "settings") {
      screen = "settings";
      audio?.setPaused(true);
      ui.showSettings(save);
    } else if (action === "toggle-setting") {
      toggleSetting(value);
    } else if (action === "restart-beginning-confirm") {
      resetReturnScreen = screen;
      screen = "reset-confirm";
      ui.showResetConfirm();
    } else if (action === "cancel-reset") {
      if (resetReturnScreen === "failure" && level && run) {
        screen = "failure";
        ui.showFailure(level.theme, run);
      } else {
        showMainMenu();
      }
    } else if (action === "restart-beginning") {
      save = freshSave();
      selectedSkin = 0;
      saveNow();
      startStage(1, 0);
    }
  }

  function showMainMenu() {
    screen = "menu";
    input.clear();
    audio?.setPaused(true);
    ui.showMenu(save);
  }

  function togglePause() {
    if (screen === "playing") {
      screen = "paused";
      input.clear();
      audio?.setPaused(true);
      ui.showPause(level.theme);
    } else if (screen === "paused") {
      resumeGame();
    }
  }

  function resumeGame() {
    if (!level || !run) return;
    screen = "playing";
    audio?.setPaused(false);
    ui.showPlaying(level.theme, run, save);
  }

  function buySelectedSkin() {
    const skin = SKINS[selectedSkin];
    if (!skin || save.ownedSkins.includes(selectedSkin) || save.bestStage < skin.unlockStage || save.coins < skin.price) return;
    save.coins -= skin.price;
    save.ownedSkins.push(selectedSkin);
    save.equippedSkin = selectedSkin;
    void ensureSkinLoaded(selectedSkin);
    saveNow();
    haptic([20, 30, 20]);
    ui.showShop(save, selectedSkin);
  }

  function equipSelectedSkin() {
    if (!save.ownedSkins.includes(selectedSkin)) return;
    save.equippedSkin = selectedSkin;
    void ensureSkinLoaded(selectedSkin);
    saveNow();
    haptic(18);
    ui.showShop(save, selectedSkin);
  }

  function toggleSetting(key) {
    if (!(key in save.settings)) return;
    save.settings[key] = !save.settings[key];
    audio?.setSettings(save.settings);
    saveNow();
    ui.showSettings(save);
  }

  function handleCheckpoint(checkpoint) {
    save.checkpoint = checkpoint;
    save.coins += 5;
    saveNow();
    audio?.play("checkpoint");
    haptic([18, 25, 28]);
  }

  function handleFailure() {
    screen = "failure";
    input.clear();
    audio?.play("fall");
    audio?.setPaused(true);
    haptic(55);
    ui.showFailure(level.theme, run);
  }

  function handleFinish() {
    const firstClear = save.unlockedWorld <= level.stage;
    const perfect = run.caught === level.totalFlies;
    const reward = (firstClear ? 20 : 10) + run.caught * 2 + (perfect ? 20 : 0);
    save.coins += reward;
    save.totalFly += run.score;
    save.bestStage = Math.max(save.bestStage, level.stage);
    save.unlockedWorld = Math.max(save.unlockedWorld, Math.min(100, level.stage + 1));
    if (perfect && !save.perfectStages.includes(level.stage)) save.perfectStages.push(level.stage);
    if (level.stage < 100) save.currentStage = level.stage + 1;
    save.checkpoint = 0;
    saveNow();
    const score = leaderboardScore(run.score);
    if (score !== null) void sdk.leaderboard.submit(score).catch(() => {});
    screen = "complete";
    input.clear();
    audio?.play("finish");
    haptic([25, 40, 25, 40, 45]);
    ui.showComplete(level.theme, run, reward, perfect, level.stage === 100);
  }

  function addLandingParticles(platform) {
    const count = Math.max(2, Math.round(5 * tuning.effectsIntensity));
    for (let index = 0; index < count; index += 1) {
      run.particles.push({
        x: run.frog.x + (Math.random() - 0.5) * 25,
        y: platform.y + 3,
        vx: (Math.random() - 0.5) * 70,
        vy: 30 + Math.random() * 45,
        life: 0.28 + Math.random() * 0.2,
        color: level.theme.palette.accent,
      });
    }
  }

  function update(dt, time) {
    if (screen !== "playing" || !level || !run) return;
    const { width, height } = renderer.getSize();
    updateLevel(level, dt, tuning.enemySpeed);
    const events = updateRun(run, level, input.state, tuning, dt, time, width, Math.max(240, height - 88));
    run.progress = Math.max(0, Math.min(1, run.frog.y / level.top));
    for (const event of events) {
      if (event.type === "land") {
        audio?.play("bounce");
        haptic(event.platform.type === "bouncy" ? 28 : 12);
        addLandingParticles(event.platform);
      } else if (event.type === "creak") {
        audio?.play("creak");
      } else if (event.type === "checkpoint") {
        handleCheckpoint(event.checkpoint);
      } else if (event.type === "fail") {
        handleFailure();
      } else if (event.type === "finish") {
        handleFinish();
      }
    }
    if (screen === "playing") ui.updateHud(level.theme, run, save);
  }

  function render(time) {
    const theme = level?.theme || THEMES[Math.max(0, save.currentStage - 1)];
    renderer.render({
      theme,
      level,
      run,
      skinIndex: save.equippedSkin,
      playBottom: renderer.getSize().height - 82,
    }, time);
    if (screen === "shop" && ui.previewCanvas) {
      renderer.renderPreview(ui.previewCanvas, selectedSkin, time);
      for (const thumb of ui.skinThumbCanvases) {
        if (thumb.dataset.rendered === "true") continue;
        if (renderer.renderSkinThumbnail(thumb, Number(thumb.dataset.skinIndex))) thumb.dataset.rendered = "true";
      }
    }
  }

  function loop(now) {
    if (destroyed) return;
    const dt = Math.min(0.034, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    const time = now / 1000;
    update(dt, time);
    render(time);
    frameId = requestAnimationFrame(loop);
  }

  function handleVisibility() {
    if (document.hidden && screen === "playing") togglePause();
  }

  return {
    start() {
      document.addEventListener("visibilitychange", handleVisibility);
      void boot();
      frameId = requestAnimationFrame(loop);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", handleVisibility);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      input?.destroy();
      renderer?.destroy();
      audio?.destroy();
      ui.destroy();
    },
  };
}
