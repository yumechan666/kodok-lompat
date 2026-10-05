const DEFAULT_SAVE = {
  version: 1,
  currentStage: 1,
  checkpoint: 0,
  totalFly: 0,
  coins: 0,
  ownedSkins: [0],
  equippedSkin: 0,
  unlockedWorld: 1,
  bestStage: 1,
  perfectStages: [],
  settings: {
    music: true,
    sound: true,
    haptics: true,
    reducedMotion: false,
  },
};

function finiteInt(value, fallback, min, max) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function freshSave() {
  return structuredClone(DEFAULT_SAVE);
}

export function sanitizeSave(raw) {
  if (!raw || typeof raw !== "object") return freshSave();
  const owned = Array.isArray(raw.ownedSkins)
    ? [...new Set(raw.ownedSkins.map((value) => finiteInt(value, 0, 0, 99)))].slice(0, 100)
    : [0];
  if (!owned.includes(0)) owned.unshift(0);
  const perfect = Array.isArray(raw.perfectStages)
    ? [...new Set(raw.perfectStages.map((value) => finiteInt(value, 1, 1, 100)))].slice(0, 100)
    : [];
  const equippedSkin = finiteInt(raw.equippedSkin, 0, 0, 99);
  return {
    version: 1,
    currentStage: finiteInt(raw.currentStage, 1, 1, 100),
    checkpoint: finiteInt(raw.checkpoint, 0, 0, 3),
    totalFly: finiteInt(raw.totalFly, 0, 0, Number.MAX_SAFE_INTEGER),
    coins: finiteInt(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER),
    ownedSkins: owned,
    equippedSkin: owned.includes(equippedSkin) ? equippedSkin : 0,
    unlockedWorld: finiteInt(raw.unlockedWorld, 1, 1, 100),
    bestStage: finiteInt(raw.bestStage, 1, 1, 100),
    perfectStages: perfect,
    settings: {
      music: raw.settings?.music !== false,
      sound: raw.settings?.sound !== false,
      haptics: raw.settings?.haptics !== false,
      reducedMotion: raw.settings?.reducedMotion === true,
    },
  };
}

export async function loadSave(sdk) {
  try {
    return sanitizeSave(await sdk.gameState.load());
  } catch {
    return freshSave();
  }
}

export function persistSave(sdk, save) {
  void sdk.gameState.save(save).catch(() => {});
}
