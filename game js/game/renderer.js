import { SKINS } from "./data.js";
import { platformX, platformY } from "./level.js";

const PLATFORM_FRAMES = {
  normal: "normal_leaf",
  small: "small_stone",
  moving: "moving_moss",
  falling: "falling_bark",
  bouncy: "bouncy_mushroom",
};

const FLY_FRAMES = {
  normal: "fly_normal",
  golden: "fly_golden",
  special: "fly_special",
  rare: "fly_rare",
};

function drawFrameInCell(ctx, image, frame, cellX, cellY, cellW, cellH, alpha = 1) {
  if (!image || !frame) return;
  const crop = frame.content || frame.source;
  const scale = Math.min(cellW / crop.w, cellH / crop.h);
  const width = crop.w * scale;
  const height = crop.h * scale;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, cellX + (cellW - width) / 2, cellY + (cellH - height) / 2, width, height);
  ctx.restore();
}

function drawAnimatedAnchored(ctx, image, frames, frameIndex, anchorX, anchorY, boxSize, direction = 1) {
  if (!image || !frames?.length) return;
  const frame = frames[frameIndex % frames.length];
  const crop = frame.content || frame.source;
  const maxWidth = Math.max(...frames.map((item) => (item.content || item.source).w));
  const maxHeight = Math.max(...frames.map((item) => (item.content || item.source).h));
  const scale = Math.min(boxSize / maxWidth, boxSize / maxHeight);
  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.scale(direction, 1);
  ctx.drawImage(
    image,
    crop.x, crop.y, crop.w, crop.h,
    -(frame.anchor.x - crop.x) * scale,
    -(frame.anchor.y - crop.y) * scale,
    crop.w * scale,
    crop.h * scale,
  );
  ctx.restore();
}

function frogFrameName(frog, started) {
  if (!started) return "squat";
  if (frog.landingTimer > 0.08) return "landing";
  if (frog.vy > 390) return "jump";
  if (frog.vy > 40) return "bounce";
  return "air";
}

function weatherKind(name) {
  if (/Rain|Storm|Tsunami/.test(name)) return "rain";
  if (/Snow|Frozen|Ice|Glacial/.test(name)) return "snow";
  if (/Star|Moon|Cosmic|Space|Saturn|Black Hole/.test(name)) return "stars";
  if (/Underwater|Coral|Atlantis|Trench/.test(name)) return "bubbles";
  if (/Volcano|Meteor|Magma|Nuclear/.test(name)) return "embers";
  return "dust";
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let width = 1;
  let height = 1;
  let assets = null;
  let resizeObserver = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width;
    height = rect.height;
  }

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  function worldToScreen(worldY, cameraBottom, playBottom) {
    return playBottom - (worldY - cameraBottom);
  }

  function drawBackdrop(theme, cameraBottom, time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.palette.sky);
    gradient.addColorStop(0.55, theme.palette.glow);
    gradient.addColorStop(1, theme.palette.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const backdrop = assets?.images.RIVER_BACKDROP;
    if (backdrop) {
      const tileHeight = height * 1.08;
      const offset = ((cameraBottom * 0.08) % tileHeight + tileHeight) % tileHeight;
      ctx.save();
      ctx.globalAlpha = theme.index === 0 ? 0.85 : 0.25;
      ctx.globalCompositeOperation = theme.palette.dark ? "screen" : "soft-light";
      ctx.drawImage(backdrop, 0, -offset, width, tileHeight);
      ctx.drawImage(backdrop, 0, tileHeight - offset, width, tileHeight);
      ctx.restore();
    }
    drawWeather(theme, time);
  }

  function drawWeather(theme, time) {
    const kind = weatherKind(theme.name);
    const count = kind === "dust" ? 18 : 26;
    ctx.save();
    for (let index = 0; index < count; index += 1) {
      const seedX = (index * 83.17 + theme.index * 29) % Math.max(1, width);
      const seedY = (index * 137.51 + theme.index * 53) % Math.max(1, height);
      if (kind === "rain") {
        const x = (seedX + time * 90) % width;
        const y = (seedY + time * 240) % height;
        ctx.strokeStyle = "rgba(220,245,255,.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 14);
        ctx.stroke();
      } else if (kind === "snow") {
        ctx.fillStyle = "rgba(255,255,255,.62)";
        ctx.beginPath();
        ctx.arc((seedX + Math.sin(time + index) * 12) % width, (seedY + time * 22) % height, 1.5 + index % 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "stars") {
        ctx.fillStyle = `rgba(255,244,190,${0.35 + Math.sin(time * 2 + index) * 0.18})`;
        ctx.fillRect(seedX, seedY, 2, 2);
      } else if (kind === "bubbles") {
        ctx.strokeStyle = "rgba(220,255,250,.35)";
        ctx.beginPath();
        ctx.arc(seedX, (seedY - time * 18 + height) % height, 2 + index % 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (kind === "embers") {
        ctx.fillStyle = "rgba(255,159,64,.46)";
        ctx.beginPath();
        ctx.arc(seedX, (seedY - time * 28 + height) % height, 1.2 + index % 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = theme.palette.dark ? "rgba(255,255,255,.12)" : "rgba(255,250,205,.16)";
        ctx.beginPath();
        ctx.arc((seedX + time * (5 + index % 4)) % width, seedY, 1 + index % 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMotifs(theme, cameraBottom, playBottom) {
    const image = assets?.images[theme.motifAsset];
    const frame = assets?.frames[theme.motifAsset]?.[theme.motifFrame];
    const propImage = assets?.images[theme.propAsset];
    const propFrame = assets?.frames[theme.propAsset]?.[theme.propFrame];
    if (!image || !frame) return;
    const spacing = Math.max(285, height * 0.38);
    const first = Math.floor(cameraBottom / spacing) * spacing;
    for (let index = -1; index < 5; index += 1) {
      const worldY = first + index * spacing + 130;
      const screenY = worldToScreen(worldY, cameraBottom, playBottom);
      const size = Math.min(width * 0.38, 165);
      const right = (Math.floor(worldY / spacing) + theme.index) % 2 === 0;
      drawFrameInCell(ctx, image, frame, right ? width - size * 0.82 : -size * 0.18, screenY - size * 0.62, size, size, 0.58);
      if (propImage && propFrame) {
        const propSize = size * 0.82;
        drawFrameInCell(ctx, propImage, propFrame, right ? -propSize * 0.18 : width - propSize * 0.82, screenY + size * 0.05, propSize, propSize, 0.72);
      }
    }
  }

  function drawPlatform(platform, level, time, cameraBottom, playBottom) {
    const x = platformX(platform, time, width);
    const screenY = worldToScreen(platformY(platform), cameraBottom, playBottom);
    if (screenY < -90 || screenY > playBottom + 70) return;
    const image = assets.images.PLATFORM_ATLAS;
    const frameName = platform.type === "normal" && platform.id % 3 === 0 ? "normal_log" : PLATFORM_FRAMES[platform.type];
    const frame = assets.frames.PLATFORM_ATLAS[frameName];
    const platformWidth = platform.widthNorm * width;
    const shake = platform.fallState === "shaking" ? Math.sin(time * 60) * 3 : 0;
    drawFrameInCell(ctx, image, frame, x - platformWidth / 2 + shake, screenY - 9, platformWidth, 62);
    if (platform.type === "moving") {
      ctx.fillStyle = "rgba(255,255,230,.65)";
      ctx.beginPath();
      ctx.moveTo(x - 11, screenY + 42);
      ctx.lineTo(x - 3, screenY + 37);
      ctx.lineTo(x - 3, screenY + 47);
      ctx.moveTo(x + 11, screenY + 42);
      ctx.lineTo(x + 3, screenY + 37);
      ctx.lineTo(x + 3, screenY + 47);
      ctx.fill();
    }
    if (platform.checkpoint) {
      const flag = assets.frames.PLATFORM_ATLAS.checkpoint_flag;
      const active = platform.checkpoint <= level.activeCheckpoint;
      drawFrameInCell(ctx, image, flag, x - 27, screenY - 61, 54, 66, active ? 1 : 0.42);
    }
    if (platform.finish) {
      drawFrameInCell(ctx, image, assets.frames.PLATFORM_ATLAS.finish_arch, x - 58, screenY - 92, 116, 100);
    }
  }

  function drawFly(fly, theme, time, cameraBottom, playBottom) {
    if (fly.collected) return;
    const x = fly.xNorm * width + Math.sin(time * 2.3 + fly.phase) * 7;
    const y = worldToScreen(fly.y + Math.sin(time * 3 + fly.phase) * 8, cameraBottom, playBottom);
    if (y < -45 || y > playBottom + 45) return;
    const size = fly.type === "rare" ? 36 : fly.type === "golden" ? 32 : 28;
    const animatedSheet = assets.creatureSheets?.get(theme.creatureSheetAsset);
    const animatedFrames = animatedSheet?.animations?.[theme.flyFrame];
    const frameIndex = Math.floor(time * 12 + fly.phase * 2) % 3;
    const themedImage = assets.images[theme.creatureAsset];
    const themedFrame = assets.frames[theme.creatureAsset]?.[theme.flyFrame];
    if (animatedFrames) {
      drawAnimatedAnchored(ctx, animatedSheet.image, animatedFrames, frameIndex, x, y + size * 0.45, size);
    } else {
      drawFrameInCell(
        ctx,
        themedImage || assets.images.ENTITY_ATLAS,
        themedFrame || assets.frames.ENTITY_ATLAS[FLY_FRAMES[fly.type]],
        x - size / 2,
        y - size / 2,
        size,
        size,
      );
    }
    if (fly.type !== "normal") {
      const halo = ctx.createRadialGradient(x, y, 2, x, y, size);
      halo.addColorStop(0, fly.type === "rare" ? "rgba(120,235,255,.28)" : "rgba(255,220,90,.28)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemy(enemy, theme, time, cameraBottom, playBottom) {
    const x = enemy.xNorm * width;
    const bob = enemy.type === "butterfly" ? Math.sin(time * 5 + enemy.phase) * 38 : Math.sin(time * 2 + enemy.phase) * 10;
    const y = worldToScreen(enemy.y + bob, cameraBottom, playBottom);
    if (y < -70 || y > playBottom + 70) return;
    const size = enemy.type === "owl" ? 62 : enemy.type === "air_burst" ? 68 : 52;
    const animatedSheet = assets.creatureSheets?.get(theme.creatureSheetAsset);
    const animatedFrames = animatedSheet?.animations?.[theme.birdFrame];
    const frameIndex = Math.floor(time * 8 + enemy.phase) % 3;
    const themedImage = assets.images[theme.creatureAsset];
    const themedFrame = assets.frames[theme.creatureAsset]?.[theme.birdFrame];
    const image = themedImage || assets.images.ENTITY_ATLAS;
    const frame = themedFrame || assets.frames.ENTITY_ATLAS[enemy.type];
    if (animatedFrames) {
      drawAnimatedAnchored(ctx, animatedSheet.image, animatedFrames, frameIndex, x, y + size * 0.46, size, enemy.direction);
    } else {
      ctx.save();
      if (enemy.direction < 0) {
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        drawFrameInCell(ctx, image, frame, -size / 2, y - size / 2, size, size);
      } else {
        drawFrameInCell(ctx, image, frame, x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
    }
  }

  function drawTongue(run, cameraBottom, playBottom) {
    const frog = run.frog;
    if (frog.tongueTimer <= 0) return;
    const x = frog.x + frog.tongueDirection * 17;
    const y = worldToScreen(frog.y + 35, cameraBottom, playBottom);
    const length = 36 + (frog.tongueTimer / 0.16) * 66;
    ctx.save();
    ctx.strokeStyle = "#e8798a";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + frog.tongueDirection * length, y - 2);
    ctx.stroke();
    ctx.fillStyle = "#f4a1aa";
    ctx.beginPath();
    ctx.arc(x + frog.tongueDirection * length, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFrog(ctxTarget, frog, screenY, skinIndex, started, scaleFactor = 1) {
    const skin = SKINS[skinIndex] || SKINS[0];
    const sheet = assets.skinSheets?.get(skin.sheetAsset);
    const animation = sheet?.animations?.[skin.animation];
    const frameIndex = !started ? 0 : frog.landingTimer > 0.08 ? 3 : frog.vy > 390 ? 1 : frog.vy > 40 ? 4 : 2;
    const frame = animation?.[frameIndex] || assets.frames.FROG_SHEET[frogFrameName(frog, started)];
    const image = animation ? sheet.image : assets.images.FROG_SHEET;
    const crop = frame.content || frame.source;
    const scale = (72 * scaleFactor) / Math.max(crop.w, crop.h);
    const anchorX = (frame.anchor.x - crop.x) * scale;
    const anchorY = (frame.anchor.y - crop.y) * scale;
    const direction = frog.direction || 1;
    ctxTarget.save();
    ctxTarget.translate(frog.x, screenY);
    ctxTarget.scale(direction, 1);
    ctxTarget.drawImage(image, crop.x, crop.y, crop.w, crop.h, -anchorX, -anchorY, crop.w * scale, crop.h * scale);
    ctxTarget.restore();
  }

  function drawParticles(run, cameraBottom, playBottom) {
    for (const particle of run.particles) {
      const y = worldToScreen(particle.y, cameraBottom, playBottom);
      ctx.globalAlpha = Math.max(0, particle.life * 1.7);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render(model, time) {
    if (!assets) {
      ctx.fillStyle = "#183f3d";
      ctx.fillRect(0, 0, width, height);
      return;
    }
    const theme = model.theme;
    const cameraBottom = model.run?.cameraBottom || Math.sin(time * 0.1) * 30;
    const playBottom = model.playBottom ?? height - 86;
    drawBackdrop(theme, cameraBottom, time);
    drawMotifs(theme, cameraBottom, playBottom);

    if (model.level && model.run) {
      model.level.activeCheckpoint = model.run.checkpoint;
      for (const platform of model.level.platforms) drawPlatform(platform, model.level, time, cameraBottom, playBottom);
      for (const fly of model.level.flies) drawFly(fly, theme, time, cameraBottom, playBottom);
      for (const enemy of model.level.enemies) drawEnemy(enemy, theme, time, cameraBottom, playBottom);
      drawTongue(model.run, cameraBottom, playBottom);
      drawFrog(ctx, model.run.frog, worldToScreen(model.run.frog.y, cameraBottom, playBottom), model.skinIndex, model.run.started);
      drawParticles(model.run, cameraBottom, playBottom);
    } else {
      const idle = { x: width * 0.5, y: 0, vy: 0, direction: 1, landingTimer: 0 };
      drawFrog(ctx, idle, height * 0.7 + Math.sin(time * 2) * 4, model.skinIndex || 0, false, 1.5);
    }
  }

  function renderPreview(previewCanvas, skinIndex, time) {
    if (!assets || !previewCanvas) return;
    const previewContext = previewCanvas.getContext("2d");
    const rect = previewCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (previewCanvas.width !== Math.round(rect.width * dpr) || previewCanvas.height !== Math.round(rect.height * dpr)) {
      previewCanvas.width = Math.round(rect.width * dpr);
      previewCanvas.height = Math.round(rect.height * dpr);
    }
    previewContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    previewContext.clearRect(0, 0, rect.width, rect.height);
    const glow = previewContext.createRadialGradient(rect.width / 2, rect.height / 2, 4, rect.width / 2, rect.height / 2, rect.width * 0.46);
    glow.addColorStop(0, "rgba(255,255,220,.55)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    previewContext.fillStyle = glow;
    previewContext.fillRect(0, 0, rect.width, rect.height);
    const phases = ["squat", "jump", "air", "landing", "bounce"];
    const frameName = phases[Math.floor(time * 3) % phases.length];
    const fakeFrog = {
      x: rect.width / 2,
      direction: Math.floor(time / 3) % 2 ? -1 : 1,
      vy: frameName === "jump" ? 500 : frameName === "bounce" ? 180 : frameName === "air" ? -20 : 0,
      landingTimer: frameName === "landing" ? 0.12 : 0,
    };
    drawFrog(previewContext, fakeFrog, rect.height * 0.82, skinIndex, frameName !== "squat", 1.8);
  }

  function renderSkinThumbnail(thumbnailCanvas, skinIndex) {
    if (!assets || !thumbnailCanvas) return false;
    const skin = SKINS[skinIndex];
    const sheet = assets.skinSheets?.get(skin?.sheetAsset);
    const frame = sheet?.animations?.[skin?.animation]?.[0];
    if (!sheet || !frame) return false;
    const rect = thumbnailCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    thumbnailCanvas.width = Math.round(rect.width * dpr);
    thumbnailCanvas.height = Math.round(rect.height * dpr);
    const thumbnailContext = thumbnailCanvas.getContext("2d");
    thumbnailContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    thumbnailContext.clearRect(0, 0, rect.width, rect.height);
    const glow = thumbnailContext.createRadialGradient(rect.width / 2, rect.height * 0.58, 2, rect.width / 2, rect.height * 0.58, rect.width * 0.5);
    glow.addColorStop(0, "rgba(255,255,225,.75)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    thumbnailContext.fillStyle = glow;
    thumbnailContext.fillRect(0, 0, rect.width, rect.height);
    drawFrameInCell(thumbnailContext, sheet.image, frame, 2, 2, rect.width - 4, rect.height - 4);
    return true;
  }

  return {
    setAssets(nextAssets) {
      assets = nextAssets;
    },
    render,
    renderPreview,
    renderSkinThumbnail,
    getSize: () => ({ width, height }),
    destroy() {
      resizeObserver?.disconnect();
    },
  };
}
