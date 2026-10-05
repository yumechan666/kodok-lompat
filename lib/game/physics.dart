import 'dart:math';

import 'level.dart';

const List<int> checkpointPlatforms = [0, 7, 14, 21];
const Map<String, int> flyValues = {
  'normal': 10,
  'golden': 50,
  'special': 75,
  'rare': 100,
};

class Frog {
  Frog({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.direction,
    required this.lastPlatform,
  });

  double x;
  double y;
  double vx;
  double vy;
  int direction;
  double landingTimer = 0;
  double tongueTimer = 0;
  int tongueDirection = 1;
  int lastPlatform;
}

class Particle {
  Particle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.life,
    required this.color,
  });

  double x;
  double y;
  double vx;
  double vy;
  double life;
  String color;
}

class Run {
  Run({
    required this.frog,
    required this.checkpoint,
    required this.score,
    required this.caught,
    required this.started,
    required this.cameraBottom,
    required this.particles,
  });

  final Frog frog;
  int checkpoint;
  int score;
  int caught;
  bool started;
  double cameraBottom;
  List<Particle> particles;
  String toast = "";
  double toastTimer = 0;
  bool finished = false;
  bool failed = false;
  String failReason = "FALL";
  double elapsed = 0;
}

Run createRun(Level level, int checkpoint, double width) {
  final safeCheckpoint = max(0, min(3, checkpoint));
  final platform = level.platforms[checkpointPlatforms[safeCheckpoint]];
  return Run(
    frog: Frog(
      x: platform.baseX * width,
      y: platform.y,
      vx: 0,
      vy: 0,
      direction: 1,
      lastPlatform: platform.id,
    ),
    checkpoint: safeCheckpoint,
    score: 0,
    caught: 0,
    started: false,
    cameraBottom: max(0, platform.y - 80),
    particles: [],
  );
}

class FlickResult {
  FlickResult({required this.caught, this.value, this.type});
  final bool caught;
  final int? value;
  final String? type;
}

FlickResult flickTongue(Run run, Level level, int direction, double width, double time) {
  if (run.failed || run.finished) return FlickResult(caught: false);
  final frog = run.frog;
  frog.tongueTimer = 0.16;
  frog.tongueDirection = direction;
  frog.direction = direction;
  Fly? target;
  var nearest = double.infinity;
  for (final fly in level.flies) {
    if (fly.collected) continue;
    final flyX = fly.xNorm * width + sin(time * 2.3 + fly.phase) * 7;
    final flyY = fly.y + sin(time * 3 + fly.phase) * 8;
    final dx = flyX - frog.x;
    final dy = flyY - (frog.y + 34);
    if ((dx.sign == 0 ? direction : dx.sign) != direction ||
        dx.abs() > min(118, width * 0.3) ||
        dy.abs() > 72) {
      continue;
    }
    final distance = sqrt(dx * dx + dy * dy);
    if (distance < nearest) {
      nearest = distance;
      target = fly;
    }
  }
  if (target == null) return FlickResult(caught: false);
  target.collected = true;
  final value = flyValues[target.type]!;
  run.score += value;
  run.caught++;
  run.toast = "CAUGHT! +$value";
  run.toastTimer = 0.7;
  for (var index = 0; index < 8; index++) {
    run.particles.add(Particle(
      x: target.xNorm * width,
      y: target.y,
      vx: (Random().nextDouble() - 0.5) * 90,
      vy: 40 + Random().nextDouble() * 80,
      life: 0.45 + Random().nextDouble() * 0.25,
      color: target.type == "golden" || target.type == "rare" ? "#ffe06d" : "#ec8f73",
    ));
  }
  return FlickResult(caught: true, value: value, type: target.type);
}

Enemy? _enemyCollision(Run run, Level level, double width, double time) {
  final frog = run.frog;
  for (final enemy in level.enemies) {
    final x = enemy.xNorm * width;
    final y = enemy.y +
        (enemy.type == "butterfly"
            ? sin(time * 5 + enemy.phase) * 38
            : sin(time * 2 + enemy.phase) * 10);
    final radius = enemy.type == "air_burst"
        ? 30
        : enemy.type == "owl"
            ? 28
            : 23;
    if (sqrt((x - frog.x) * (x - frog.x) + (y - (frog.y + 28)) * (y - (frog.y + 28))) <
        radius + 22) {
      return enemy;
    }
  }
  return null;
}

class RunEvent {
  RunEvent(this.type, {this.platform, this.checkpoint, this.reason});
  final String type;
  final Platform? platform;
  final int? checkpoint;
  final String? reason;
}

List<RunEvent> updateRun(
  Run run,
  Level level,
  InputState input,
  Tuning tuning,
  double dt,
  double time,
  double width,
  double playHeight,
) {
  final events = <RunEvent>[];
  if (!run.started || run.failed || run.finished) return events;
  run.elapsed += dt;
  final frog = run.frog;
  final steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (steer != 0) {
    frog.vx += steer * tuning.steering * dt;
    frog.direction = steer;
  } else {
    frog.vx *= pow(0.025, dt);
  }
  const double maxSpeed = 255;
  frog.vx = max(-maxSpeed, min(maxSpeed, frog.vx));
  frog.x += frog.vx * dt;
  if (frog.x < 23) {
    frog.x = 23;
    frog.vx = frog.vx.abs() * 0.25;
  } else if (frog.x > width - 23) {
    frog.x = width - 23;
    frog.vx = -frog.vx.abs() * 0.25;
  }

  final previousY = frog.y;
  frog.vy -= tuning.gravity * dt;
  frog.y += frog.vy * dt;
  frog.landingTimer = max(0, frog.landingTimer - dt);
  frog.tongueTimer = max(0, frog.tongueTimer - dt);
  run.toastTimer = max(0, run.toastTimer - dt);

  if (frog.vy <= 0) {
    for (final platform in level.platforms) {
      if (platform.fallState == "falling") continue;
      final y = platformY(platform);
      final x = platformX(platform, time, width);
      final halfWidth = platform.widthNorm * width * 0.5;
      if (previousY >= y - 2 &&
          frog.y <= y + 4 &&
          (frog.x - x).abs() <= halfWidth - 8) {
        frog.y = y;
        frog.vy = platform.type == "bouncy"
            ? tuning.bounceVelocity * 1.23
            : tuning.bounceVelocity;
        frog.landingTimer = 0.15;
        frog.lastPlatform = platform.id;
        events.add(RunEvent("land", platform: platform));
        if (platform.type == "falling" && platform.fallState == "steady") {
          platform.fallState = "shaking";
          platform.fallTimer = 0.42;
          events.add(RunEvent("creak"));
        }
        if (platform.checkpoint > run.checkpoint) {
          run.checkpoint = platform.checkpoint;
          run.toast = "CHECKPOINT ${String.fromCharCode(64 + platform.checkpoint)}";
          run.toastTimer = 1.1;
          events.add(RunEvent("checkpoint", checkpoint: platform.checkpoint));
        }
        if (platform.finish) {
          run.finished = true;
          events.add(RunEvent("finish"));
        }
        break;
      }
    }
  }

  final targetBottom = frog.y - playHeight * 0.46;
  run.cameraBottom = max(run.cameraBottom, targetBottom);
  run.cameraBottom = max(run.cameraBottom, 0);
  if (frog.y < run.cameraBottom - 115) {
    run.failed = true;
    run.failReason = "FALL";
    events.add(RunEvent("fail", reason: "FALL"));
  } else if (_enemyCollision(run, level, width, time) != null) {
    frog.vy = -240;
    frog.vx *= -0.6;
    run.failed = true;
    run.failReason = "BUMPED";
    events.add(RunEvent("fail", reason: "BUMPED"));
  }

  for (final particle in run.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy -= 180 * dt;
  }
  run.particles = run.particles.where((particle) => particle.life > 0).toList();
  return events;
}

class InputState {
  bool left = false;
  bool right = false;
}

class Tuning {
  Tuning({
    required this.gravity,
    required this.bounceVelocity,
    required this.steering,
    required this.enemySpeed,
    required this.effectsIntensity,
  });
  double gravity;
  double bounceVelocity;
  double steering;
  double enemySpeed;
  double effectsIntensity;
}
