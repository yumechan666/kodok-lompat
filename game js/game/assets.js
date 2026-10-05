const FRAME_PATHS = {
  FROG_SHEET: "/generated-assets/frog_sheet-transparent.frames.json",
  PLATFORM_ATLAS: "/generated-assets/platform_atlas-transparent.frames.json",
  ENTITY_ATLAS: "/generated-assets/entity_atlas-transparent.frames.json",
  THEME_MOTIFS_01: "/generated-assets/theme_motifs_01-transparent.frames.json",
  THEME_MOTIFS_02: "/generated-assets/theme_motifs_02-transparent.frames.json",
  THEME_MOTIFS_03: "/generated-assets/theme_motifs_03-transparent.frames.json",
  THEME_MOTIFS_04: "/generated-assets/theme_motifs_04-transparent.frames.json",
  THEME_MOTIFS_05: "/generated-assets/theme_motifs_05-transparent.frames.json",
  THEME_PROPS_01: "/generated-assets/theme_props_01-transparent.frames.json",
  THEME_PROPS_02: "/generated-assets/theme_props_02-transparent.frames.json",
  THEME_PROPS_03: "/generated-assets/theme_props_03-transparent.frames.json",
  THEME_PROPS_04: "/generated-assets/theme_props_04-transparent.frames.json",
  THEME_PROPS_05: "/generated-assets/theme_props_05-transparent.frames.json",
  THEME_CREATURES_01: "/generated-assets/theme_creatures_01-transparent.frames.json",
  THEME_CREATURES_02: "/generated-assets/theme_creatures_02-transparent.frames.json",
  THEME_CREATURES_03: "/generated-assets/theme_creatures_03-transparent.frames.json",
  THEME_CREATURES_04: "/generated-assets/theme_creatures_04-transparent.frames.json",
  THEME_CREATURES_05: "/generated-assets/theme_creatures_05-transparent.frames.json",
  THEME_CREATURES_06: "/generated-assets/theme_creatures_06-transparent.frames.json",
  THEME_CREATURES_07: "/generated-assets/theme_creatures_07-transparent.frames.json",
  THEME_CREATURES_08: "/generated-assets/theme_creatures_08-transparent.frames.json",
  THEME_CREATURES_09: "/generated-assets/theme_creatures_09-transparent.frames.json",
  THEME_CREATURES_10: "/generated-assets/theme_creatures_10-transparent.frames.json",
};

const IMAGE_KEYS = ["RIVER_BACKDROP", ...Object.keys(FRAME_PATHS)];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

export async function loadGameAssets(assets) {
  const images = {};
  const frames = {};
  const imageTasks = IMAGE_KEYS.map(async (key) => {
    const url = assets?.get(key);
    if (!url) throw new Error(`Missing asset ${key}`);
    images[key] = await loadImage(url);
  });
  const frameTasks = Object.entries(FRAME_PATHS).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load frame data for ${key}`);
    const data = await response.json();
    frames[key] = Object.fromEntries(data.frames.map((frame) => [frame.name, frame]));
  });
  await Promise.all([...imageTasks, ...frameTasks]);
  return { images, frames, skinSheets: new Map(), creatureSheets: new Map() };
}

const skinPromises = new Map();

export function loadSkinSheet(assets, skinIndex) {
  const number = Math.floor(Math.max(0, Math.min(99, skinIndex)) / 4) + 1;
  const suffix = String(number).padStart(2, "0");
  const key = `SKIN_SHEET_${suffix}`;
  if (!skinPromises.has(key)) {
    skinPromises.set(key, (async () => {
      const url = assets?.get(key);
      if (!url) throw new Error(`Missing asset ${key}`);
      const [image, response] = await Promise.all([
        loadImage(url),
        fetch(`/generated-assets/skin_sheet_${suffix}-transparent.frames.json`),
      ]);
      if (!response.ok) throw new Error(`Could not load frame data for ${key}`);
      const data = await response.json();
      return {
        key,
        image,
        animations: Object.fromEntries((data.animations || []).map((animation) => [animation.name, animation.frames])),
      };
    })());
  }
  return skinPromises.get(key);
}

const creaturePromises = new Map();

export function loadCreatureSheet(assets, themeIndex) {
  const number = Math.floor(Math.max(0, Math.min(99, themeIndex)) / 4) + 1;
  const suffix = String(number).padStart(2, "0");
  const key = `CREATURE_SHEET_${suffix}`;
  if (!creaturePromises.has(key)) {
    creaturePromises.set(key, (async () => {
      const url = assets?.get(key);
      if (!url) throw new Error(`Missing asset ${key}`);
      const [image, response] = await Promise.all([
        loadImage(url),
        fetch(`/generated-assets/creature_sheet_${suffix}-transparent.frames.json`),
      ]);
      if (!response.ok) throw new Error(`Could not load frame data for ${key}`);
      const data = await response.json();
      return {
        key,
        image,
        animations: Object.fromEntries((data.animations || []).map((animation) => [animation.name, animation.frames])),
      };
    })());
  }
  return creaturePromises.get(key);
}
