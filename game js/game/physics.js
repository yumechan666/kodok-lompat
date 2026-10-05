import { platformX, platformY } from "./level.js";

const CHECKPOINT_PLATFORMS = [0, 7, 14, 21];
const FLY_VALUES = { normal: 10, golden: 50, special: 75, rare: 100 };

export function createRun(level, checkpoint, width) {
  const safeCheckpoint = Math.max(0, Math.min(3, checkpoint));
  const platform = level.platforms[CHECKPOINT_PLATFORMS[safeCheckpoint]];
  return {
    frog: {
      x: platform.baseX * width,
      y: platform.y,
      vx: 0,
      vy: 0,
      direction: 1,
      landingTimer: 0,
      tongueTimer: 0,
      tongueDirection: 1,
      lastPlatform: platform.id,
    },
    checkpoint: safeCheckpoint,
    score: 0,
    caught: 0,
    started: false,
    cameraBottom: Math.max(0, platform.y - 80),
    particles: [],
    toast: "",
    toastTimer: 0,
    finished: false,
    failed: false,
    failReason: "FALL",
    elapsed: 0,
  };
}

export function flickTongue(run, level, direction, width, time) {
  if (!run || run.failed || run.finished) return null;
  const frog = run.frog;
  frog.tongueTimer = 0.16;
  frog.tongueDirection = direction;
  frog.direction = direction;
  let target = null;
  let nearest = Infinity;
  for (const fly of level.flies) {
    if (fly.collected) continue;
    const flyX = fly.xNorm * width + Math.sin(time * 2.3 + fly.phase) * 7;
    const flyY = fly.y + Math.sin(time * 3 + fly.phase) * 8;
    const dx = flyX - frog.x;
    const dy = flyY - (frog.y + 34);
    if (Math.sign(dx || direction) !== direction || Math.abs(dx) > Math.min(118, width * 0.3) || Math.abs(dy) > 72) continue;
    const distance = Math.hypot(dx, dy);
    if (distance < nearest) {
      nearest = distance;
      target = fly;
    }
  }
  if (!target) return { caught: false };
  target.collected = true;
  const value = FLY_VALUES[target.type];
  run.score += value;
  run.caught += 1;
  run.toast = `CAUGHT! +${value}`;
  run.toastTimer = 0.7;
  for (let index = 0; index < 8; index += 1) {
    run.particles.push({
      x: target.xNorm * width,
      y: target.y,
      vx: (Math.random() - 0.5) * 90,
      vy: 40 + Math.random() * 80,
      life: 0.45 + Math.random() * 0.25,
      color: target.type === "golden" || target.type === "rare" ? "#ffe06d" : "#ec8f73",
    });
  }
  return { caught: true, value, type: target.type };
}

function enemyCollision(run, level, width, time) {
  const frog = run.frog;
  for (const enemy of level.enemies) {
    const x = enemy.xNorm * width;
    const y = enemy.y + (enemy.type === "butterfly" ? Math.sin(time * 5 + enemy.phase) * 38 : Math.sin(time * 2 + enemy.phase) * 10);
    const radius = enemy.type === "air_burst" ? 30 : enemy.type === "owl" ? 28 : 23;
    if (Math.hypot(x - frog.x, y - (frog.y + 28)) < radius + 22) return enemy;
  }
  return null;
}

export function updateRun(run, level, input, tuning, dt, time, width, playHeight) {
  const events = [];
  if (!run.started || run.failed || run.finished) return events;
  run.elapsed += dt;
  const frog = run.frog;
  const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (steer) {
    frog.vx += steer * tuning.steering * dt;
    frog.direction = steer;
  } else {
    frog.vx *= Math.pow(0.025, dt);
  }
  const maxSpeed = 255;
  frog.vx = Math.max(-maxSpeed, Math.min(maxSpeed, frog.vx));
  frog.x += frog.vx * dt;
  if (frog.x < 23) {
    frog.x = 23;
    frog.vx = Math.abs(frog.vx) * 0.25;
  } else if (frog.x > width - 23) {
    frog.x = width - 23;
    frog.vx = -Math.abs(frog.vx) * 0.25;
  }

  const previousY = frog.y;
  frog.vy -= tuning.gravity * dt;
  frog.y += frog.vy * dt;
  frog.landingTimer = Math.max(0, frog.landingTimer - dt);
  frog.tongueTimer = Math.max(0, frog.tongueTimer - dt);
  run.toastTimer = Math.max(0, run.toastTimer - dt);

  if (frog.vy <= 0) {
    for (const platform of level.platforms) {
      if (platform.fallState === "falling") continue;
      const y = platformY(platform);
      const x = platformX(platform, time, width);
      const halfWidth = platform.widthNorm * width * 0.5;
      if (previousY >= y - 2 && frog.y <= y + 4 && Math.abs(frog.x - x) <= halfWidth - 8) {
        frog.y = y;
        frog.vy = platform.type === "bouncy" ? tuning.bounceVelocity * 1.23 : tuning.bounceVelocity;
        frog.landingTimer = 0.15;
        frog.lastPlatform = platform.id;
        events.push({ type: "land", platform });
        if (platform.type === "falling" && platform.fallState === "steady") {
          platform.fallState = "shaking";
          platform.fallTimer = 0.42;
          events.push({ type: "creak" });
        }
        if (platform.checkpoint > run.checkpoint) {
          run.checkpoint = platform.checkpoint;
          run.toast = `CHECKPOINT ${String.fromCharCode(64 + platform.checkpoint)}`;
          run.toastTimer = 1.1;
          events.push({ type: "checkpoint", checkpoint: platform.checkpoint });
        }
        if (platform.finish) {
          run.finished = true;
          events.push({ type: "finish" });
        }
        break;
      }
    }
  }

  const targetBottom = frog.y - playHeight * 0.46;
  run.cameraBottom = Math.max(run.cameraBottom, targetBottom, 0);
  if (frog.y < run.cameraBottom - 115) {
    run.failed = true;
    run.failReason = "FALL";
    events.push({ type: "fail", reason: "FALL" });
  } else if (enemyCollision(run, level, width, time)) {
    frog.vy = -240;
    frog.vx *= -0.6;
    run.failed = true;
    run.failReason = "BUMPED";
    events.push({ type: "fail", reason: "BUMPED" });
  }

  for (const particle of run.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy -= 180 * dt;
  }
  run.particles = run.particles.filter((particle) => particle.life > 0);
  return events;
}
