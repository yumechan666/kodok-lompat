import 'dart:math';

import 'data.dart';

int _imul(int a, int b) {
  final ah = (a >> 16) & 0xffff;
  final al = a & 0xffff;
  final bh = (b >> 16) & 0xffff;
  final bl = b & 0xffff;
  return ((((ah * bl + al * bh) << 16) + al * bl) & 0xFFFFFFFF);
}

class _RandomGen {
  _RandomGen(this._state);
  int _state;
  double next() {
    _state = (_state + 0x6d2b79f5) & 0xFFFFFFFF;
    var value = _state;
    value = _imul(value ^ (value >>> 15), value | 1);
    final im = _imul(value ^ (value >>> 7), value | 61);
    value = (value ^ ((value + im) & 0xFFFFFFFF)) & 0xFFFFFFFF;
    return ((value ^ (value >>> 14)) & 0xFFFFFFFF) / 4294967296;
  }
}

String _pickPlatformType(int stage, int index, double roll) {
  if (index == 0 || [7, 14, 21, 26].contains(index)) return "normal";
  final difficulty = min(1, stage / 82);
  if (stage >= 3 && roll < 0.08 + difficulty * 0.08) return "bouncy";
  if (stage >= 4 && roll < 0.17 + difficulty * 0.12) return "falling";
  if (stage >= 6 && roll < 0.31 + difficulty * 0.18) return "moving";
  if (stage >= 6 && roll < 0.42 + difficulty * 0.2) return "small";
  return "normal";
}

String _flyType(int stage, int index, double roll) {
  if (stage >= 18 && index % 9 == 0) return "rare";
  if (stage >= 8 && index % 5 == 0) return "special";
  if (stage >= 4 && roll < 0.24) return "golden";
  return "normal";
}

class Platform {
  Platform({
    required this.id,
    required this.type,
    required this.y,
    required this.baseX,
    required this.widthNorm,
    required this.phase,
    required this.speed,
    required this.amplitude,
    required this.checkpoint,
    required this.finish,
  });

  final int id;
  final String type;
  final double y;
  final double baseX;
  final double widthNorm;
  final double phase;
  final double speed;
  final double amplitude;
  final int checkpoint;
  final bool finish;
  String fallState = "steady";
  double fallTimer = 0;
  double fallOffset = 0;
  double fallVelocity = 0;
}

class Fly {
  Fly({
    required this.id,
    required this.type,
    required this.xNorm,
    required this.y,
    required this.phase,
  });

  final int id;
  final String type;
  final double xNorm;
  final double y;
  final double phase;
  bool collected = false;
}

class Enemy {
  Enemy({
    required this.id,
    required this.type,
    required this.xNorm,
    required this.direction,
    required this.y,
    required this.speed,
    required this.phase,
  });

  final int id;
  final String type;
  double xNorm;
  final int direction;
  final double y;
  final double speed;
  final double phase;
}

class Level {
  Level({
    required this.stage,
    required this.theme,
    required this.platforms,
    required this.flies,
    required this.enemies,
    required this.top,
    required this.totalFlies,
  });

  final int stage;
  final GameTheme theme;
  final List<Platform> platforms;
  final List<Fly> flies;
  final List<Enemy> enemies;
  final double top;
  final int totalFlies;
  int activeCheckpoint = 0;
}

Level generateLevel(int stage) {
  final theme = themes[stage - 1];
  final rng = _RandomGen(7001 + stage * 7919);
  final platforms = <Platform>[];
  var y = 0.0;
  var xNorm = 0.5;
  final difficulty = min(1, (stage - 1) / 99);

  for (var index = 0; index <= 26; index++) {
    if (index > 0) y += 104 + rng.next() * (18 + difficulty * 12);
    final shift = (rng.next() - 0.5) * (0.48 + difficulty * 0.14);
    xNorm = max(0.17, min(0.83, xNorm + shift));
    final type = _pickPlatformType(stage, index, rng.next());
    var widthNorm = 0.35 - difficulty * 0.06 + rng.next() * 0.06;
    if (type == "small") widthNorm = 0.19 - difficulty * 0.025;
    if (index == 0) widthNorm = 0.58;
    if ([7, 14, 21, 26].contains(index)) widthNorm = max(widthNorm, 0.34);
    final half = widthNorm / 2 + (type == "moving" ? 0.11 : 0.02);
    xNorm = max(half, min(1 - half, xNorm));
    platforms.add(Platform(
      id: index,
      type: type,
      y: y,
      baseX: xNorm,
      widthNorm: widthNorm,
      phase: rng.next() * pi * 2,
      speed: 0.75 + rng.next() * 0.45 + difficulty * 0.4,
      amplitude: type == "moving" ? 0.08 + rng.next() * 0.055 : 0,
      checkpoint: index == 7 ? 1 : index == 14 ? 2 : index == 21 ? 3 : 0,
      finish: index == 26,
    ));
  }

  final flies = <Fly>[];
  for (var index = 2; index < platforms.length; index += 2) {
    final lower = platforms[index - 1];
    final upper = platforms[index];
    final risky = index % 4 == 0;
    final direction = index % 3 == 0 ? -1 : 1;
    flies.add(Fly(
      id: flies.length,
      type: _flyType(stage, index, rng.next()),
      xNorm: risky
          ? max(0.09, min(0.91, upper.baseX + direction * (0.13 + rng.next() * 0.07)))
          : (lower.baseX + upper.baseX) / 2,
      y: (lower.y + upper.y) / 2 + 18,
      phase: rng.next() * pi * 2,
    ));
  }

  final enemies = <Enemy>[];
  if (stage >= 3 && theme.enemy != null) {
    final count = min(5, 1 + (stage - 3) ~/ 22);
    for (var index = 0; index < count; index++) {
      final platformIndex = min(24, 5 + index * (19 ~/ max(1, count - 1)));
      enemies.add(Enemy(
        id: index,
        type: index > 0 && stage > 18 && index % 2 == 1
            ? (index % 3 == 0 ? "bee" : theme.enemy!)
            : theme.enemy!,
        xNorm: index % 2 == 1 ? 1.13 : -0.13,
        direction: index % 2 == 1 ? -1 : 1,
        y: platforms[platformIndex].y + 56 + rng.next() * 34,
        speed: 0.12 + difficulty * 0.08 + rng.next() * 0.025,
        phase: rng.next() * pi * 2,
      ));
    }
  }

  return Level(
    stage: stage,
    theme: theme,
    platforms: platforms,
    flies: flies,
    enemies: enemies,
    top: platforms.last.y,
    totalFlies: flies.length,
  );
}

double platformX(Platform platform, double time, double width) {
  final movement = platform.type == "moving"
      ? sin(time * platform.speed + platform.phase) * platform.amplitude
      : 0;
  return (platform.baseX + movement) * width;
}

double platformY(Platform platform) => platform.y + platform.fallOffset;

void updateLevel(Level level, double dt, {double enemySpeed = 1}) {
  for (final platform in level.platforms) {
    if (platform.fallState == "shaking") {
      platform.fallTimer -= dt;
      if (platform.fallTimer <= 0) {
        platform.fallState = "falling";
        platform.fallVelocity = -55;
      }
    } else if (platform.fallState == "falling") {
      platform.fallVelocity -= 900 * dt;
      platform.fallOffset += platform.fallVelocity * dt;
    }
  }

  for (final enemy in level.enemies) {
    enemy.xNorm += enemy.direction * enemy.speed * enemySpeed * dt;
    if (enemy.direction > 0 && enemy.xNorm > 1.17) enemy.xNorm = -0.17;
    if (enemy.direction < 0 && enemy.xNorm < -0.17) enemy.xNorm = 1.17;
  }
}

void resetTransientLevelState(Level level) {
  for (final platform in level.platforms) {
    platform.fallState = "steady";
    platform.fallTimer = 0;
    platform.fallOffset = 0;
    platform.fallVelocity = 0;
  }
}
