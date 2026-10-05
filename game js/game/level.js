import { THEMES } from "./data.js";

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickPlatformType(stage, index, random) {
  if (index === 0 || [7, 14, 21, 26].includes(index)) return "normal";
  const difficulty = Math.min(1, stage / 82);
  const roll = random();
  if (stage >= 3 && roll < 0.08 + difficulty * 0.08) return "bouncy";
  if (stage >= 4 && roll < 0.17 + difficulty * 0.12) return "falling";
  if (stage >= 6 && roll < 0.31 + difficulty * 0.18) return "moving";
  if (stage >= 6 && roll < 0.42 + difficulty * 0.2) return "small";
  return "normal";
}

function flyType(stage, index, random) {
  if (stage >= 18 && index % 9 === 0) return "rare";
  if (stage >= 8 && index % 5 === 0) return "special";
  if (stage >= 4 && random() < 0.24) return "golden";
  return "normal";
}

export function generateLevel(stage) {
  const theme = THEMES[stage - 1];
  const random = mulberry32(7001 + stage * 7919);
  const platforms = [];
  let y = 0;
  let xNorm = 0.5;
  const difficulty = Math.min(1, (stage - 1) / 99);

  for (let index = 0; index <= 26; index += 1) {
    if (index > 0) y += 104 + random() * (18 + difficulty * 12);
    const shift = (random() - 0.5) * (0.48 + difficulty * 0.14);
    xNorm = Math.max(0.17, Math.min(0.83, xNorm + shift));
    const type = pickPlatformType(stage, index, random);
    let widthNorm = 0.35 - difficulty * 0.06 + random() * 0.06;
    if (type === "small") widthNorm = 0.19 - difficulty * 0.025;
    if (index === 0) widthNorm = 0.58;
    if ([7, 14, 21, 26].includes(index)) widthNorm = Math.max(widthNorm, 0.34);
    const half = widthNorm / 2 + (type === "moving" ? 0.11 : 0.02);
    xNorm = Math.max(half, Math.min(1 - half, xNorm));
    platforms.push({
      id: index,
      type,
      y,
      baseX: xNorm,
      widthNorm,
      phase: random() * Math.PI * 2,
      speed: 0.75 + random() * 0.45 + difficulty * 0.4,
      amplitude: type === "moving" ? 0.08 + random() * 0.055 : 0,
      checkpoint: index === 7 ? 1 : index === 14 ? 2 : index === 21 ? 3 : 0,
      finish: index === 26,
      fallState: "steady",
      fallTimer: 0,
      fallOffset: 0,
      fallVelocity: 0,
    });
  }

  const flies = [];
  for (let index = 2; index < platforms.length; index += 2) {
    const lower = platforms[index - 1];
    const upper = platforms[index];
    const risky = index % 4 === 0;
    const direction = index % 3 === 0 ? -1 : 1;
    flies.push({
      id: flies.length,
      type: flyType(stage, index, random),
      xNorm: risky
        ? Math.max(0.09, Math.min(0.91, upper.baseX + direction * (0.13 + random() * 0.07)))
        : (lower.baseX + upper.baseX) / 2,
      y: (lower.y + upper.y) / 2 + 18,
      phase: random() * Math.PI * 2,
      collected: false,
    });
  }

  const enemies = [];
  if (stage >= 3 && theme.enemy) {
    const count = Math.min(5, 1 + Math.floor((stage - 3) / 22));
    for (let index = 0; index < count; index += 1) {
      const platformIndex = Math.min(24, 5 + index * Math.floor(19 / Math.max(1, count - 1)));
      enemies.push({
        id: index,
        type: index > 0 && stage > 18 && index % 2 ? (index % 3 === 0 ? "bee" : theme.enemy) : theme.enemy,
        xNorm: index % 2 ? 1.13 : -0.13,
        direction: index % 2 ? -1 : 1,
        y: platforms[platformIndex].y + 56 + random() * 34,
        speed: 0.12 + difficulty * 0.08 + random() * 0.025,
        phase: random() * Math.PI * 2,
      });
    }
  }

  return {
    stage,
    theme,
    platforms,
    flies,
    enemies,
    top: platforms.at(-1).y,
    totalFlies: flies.length,
  };
}

export function platformX(platform, time, width) {
  const movement = platform.type === "moving"
    ? Math.sin(time * platform.speed + platform.phase) * platform.amplitude
    : 0;
  return (platform.baseX + movement) * width;
}

export function platformY(platform) {
  return platform.y + platform.fallOffset;
}

export function updateLevel(level, dt, enemySpeed = 1) {
  for (const platform of level.platforms) {
    if (platform.fallState === "shaking") {
      platform.fallTimer -= dt;
      if (platform.fallTimer <= 0) {
        platform.fallState = "falling";
        platform.fallVelocity = -55;
      }
    } else if (platform.fallState === "falling") {
      platform.fallVelocity -= 900 * dt;
      platform.fallOffset += platform.fallVelocity * dt;
    }
  }

  for (const enemy of level.enemies) {
    enemy.xNorm += enemy.direction * enemy.speed * enemySpeed * dt;
    if (enemy.direction > 0 && enemy.xNorm > 1.17) enemy.xNorm = -0.17;
    if (enemy.direction < 0 && enemy.xNorm < -0.17) enemy.xNorm = 1.17;
  }
}

export function resetTransientLevelState(level) {
  for (const platform of level.platforms) {
    platform.fallState = "steady";
    platform.fallTimer = 0;
    platform.fallOffset = 0;
    platform.fallVelocity = 0;
  }
}
