import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'dart:ui' as ui;

import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart' hide Image;
import 'package:flutter/services.dart';

import 'data.dart';
import 'level.dart';
import 'physics.dart';
import 'assets.dart';
import 'save.dart';
import 'sprites.dart';

const double kPlayBottomInset = 82;
const double kBaseFrogSize = 74;

const Map<String, String> _platformFrames = {
  'normal': 'normal_leaf',
  'small': 'small_stone',
  'moving': 'moving_moss',
  'falling': 'falling_bark',
  'bouncy': 'bouncy_mushroom',
};

const Map<String, String> _flyFrames = {
  'normal': 'fly_normal',
  'golden': 'fly_golden',
  'special': 'fly_special',
  'rare': 'fly_rare',
};

String _frogFrameName(Frog frog, bool started) {
  if (!started) return 'squat';
  if (frog.landingTimer > 0.08) return 'landing';
  if (frog.vy > 390) return 'jump';
  if (frog.vy > 40) return 'bounce';
  return 'air';
}

Paint _alphaPaint(double alpha) => Paint()
  ..colorFilter = ColorFilter.matrix(<double>[
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, alpha, 0,
  ]);

class WorldComponent extends Component {
  WorldComponent(this.game);

  final KodokGame game;

  @override
  void render(Canvas canvas) {
    final size = game.size;
    if (size.x == 0 || size.y == 0) return;
    final save = game.save;
    final theme = game.level?.theme ??
        (save.currentStage > 0 ? themes[save.currentStage - 1] : themes[0]);
    final time = game.time;
    final cameraBottom = game.run?.cameraBottom ??
        (game.screen == 'menu' ? 0 : 0);
    final playBottom = size.y - kPlayBottomInset;

    _drawBackdrop(canvas, theme, cameraBottom, time, size);
    _drawMotifs(canvas, theme, cameraBottom, playBottom, size);

    if (game.level != null && game.run != null) {
      final run = game.run!;
      final level = game.level!;
      level.activeCheckpoint = run.checkpoint;
      for (final platform in level.platforms) {
        _drawPlatform(canvas, platform, theme, time, cameraBottom, playBottom, size);
      }
      for (final fly in level.flies) {
        _drawFly(canvas, fly, theme, time, cameraBottom, playBottom, size);
      }
      for (final enemy in level.enemies) {
        _drawEnemy(canvas, enemy, theme, time, cameraBottom, playBottom, size);
      }
      _drawTongue(canvas, run, cameraBottom, playBottom);
      _drawFrog(canvas, run.frog, run.started, cameraBottom, playBottom);
      _drawParticles(canvas, run, cameraBottom, playBottom);
    } else {
      _drawFrogIdle(canvas, theme, time, size);
    }
  }

  double _worldToScreen(double worldY, double cameraBottom, double playBottom) =>
      playBottom - (worldY - cameraBottom);

  void _drawImage(Canvas canvas, Image? image, Rect dst, {double alpha = 1}) {
    if (image == null) return;
    final src = Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble());
    canvas.drawImageRect(image, src, dst, _alphaPaint(alpha));
  }

  void _drawFrameCell(Canvas canvas, Frame frame, Image? image, Rect cell,
      {double alpha = 1}) {
    if (image == null) return;
    final crop = frame.crop;
    final scale = min(cell.width / crop.width, cell.height / crop.height);
    final w = crop.width * scale;
    final h = crop.height * scale;
    final dst = Rect.fromLTWH(
      cell.left + (cell.width - w) / 2,
      cell.top + (cell.height - h) / 2,
      w,
      h,
    );
    canvas.drawImageRect(image, crop, dst, _alphaPaint(alpha));
  }

  void _drawFrogFrame(Canvas canvas, Frame frame, Image? image, double x,
      double screenY, int direction, double scaleFactor) {
    if (image == null) return;
    final crop = frame.crop;
    final scale = (72 * scaleFactor) / max(crop.width, crop.height);
    final anchorX = (frame.anchor.dx - crop.left) * scale;
    final anchorY = (frame.anchor.dy - crop.top) * scale;
    canvas.save();
    canvas.translate(x, screenY);
    if (direction < 0) canvas.scale(-1, 1);
    final dst = Rect.fromLTWH(
        -anchorX, -anchorY, crop.width * scale, crop.height * scale);
    canvas.drawImageRect(image, crop, dst, _alphaPaint(1));
    canvas.restore();
  }

  void _drawBackdrop(Canvas canvas, GameTheme theme, double cameraBottom, double time,
      Vector2 size) {
    final paint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(0, 0),
        Offset(0, size.y),
        [
          theme.palette.sky,
          theme.palette.glow,
          theme.palette.deep,
        ],
        [0.0, 0.5, 1.0],
      );
    canvas.drawRect(Rect.fromLTWH(0, 0, size.x, size.y), paint);

    final backdrop = game.sprites['RIVER_BACKDROP'];
    if (backdrop != null) {
      final tileHeight = size.y * 1.08;
      final offset = ((cameraBottom * 0.08) % tileHeight + tileHeight) % tileHeight;
      canvas.saveLayer(Rect.fromLTWH(0, 0, size.x, size.y), Paint());
      _drawImage(canvas, backdrop, Rect.fromLTWH(0, -offset, size.x, tileHeight),
          alpha: theme.index == 0 ? 0.85 : 0.25);
      _drawImage(canvas, backdrop, Rect.fromLTWH(0, tileHeight - offset, size.x, tileHeight),
          alpha: theme.index == 0 ? 0.85 : 0.25);
      canvas.restore();
    }
    _drawWeather(canvas, theme, time, size);
  }

  void _drawWeather(Canvas canvas, GameTheme theme, double time, Vector2 size) {
    final regular = !theme.palette.dark;
    final paint = Paint();
    for (var index = 0; index < 24; index++) {
      final seedX = (index * 83.17 + theme.index * 29) % max(1.0, size.x);
      final seedY = (index * 137.51 + theme.index * 53) % max(1.0, size.y);
      paint.color = regular
          ? const Color(0x28FFFACD)
          : const Color(0x1FFFFFFF);
      final x = (seedX + time * (5 + index % 4)) % size.x;
      final y = seedY;
      canvas.drawCircle(Offset(x, y), 1 + index % 2, paint);
    }
  }

  void _drawMotifs(Canvas canvas, GameTheme theme, double cameraBottom, double playBottom,
      Vector2 size) {
    final spacing = max(285.0, size.y * 0.38);
    final first = (cameraBottom / spacing).floor() * spacing;
    final motifAtlas = game.atlases[theme.motifAsset];
    final motifFrame = motifAtlas?.frames[theme.motifFrame];
    final motifImage = game.sprites[theme.motifAsset];
    final propAtlas = game.atlases[theme.propAsset];
    final propFrame = propAtlas?.frames[theme.propFrame];
    final propImage = game.sprites[theme.propAsset];
    for (var index = -1; index < 5; index++) {
      final worldY = first + index * spacing + 130.0;
      final screenY = _worldToScreen(worldY, cameraBottom, playBottom);
      final sizeBox = min(size.x * 0.38, 165.0);
      final right = ((worldY / spacing).floor() + theme.index) % 2 == 0;
      final motifRect = Rect.fromLTWH(
        right ? size.x - sizeBox * 0.82 : -sizeBox * 0.18,
        screenY - sizeBox * 0.62,
        sizeBox,
        sizeBox,
      );
      if (motifFrame != null && motifImage != null) {
        _drawFrameCell(canvas, motifFrame, motifImage, motifRect, alpha: 0.58);
      } else if (motifImage != null) {
        _drawImage(canvas, motifImage, motifRect, alpha: 0.58);
      }
      final propSize = sizeBox * 0.82;
      final propRect = Rect.fromLTWH(
        right ? -propSize * 0.18 : size.x - propSize * 0.82,
        screenY + sizeBox * 0.05,
        propSize,
        propSize,
      );
      if (propFrame != null && propImage != null) {
        _drawFrameCell(canvas, propFrame, propImage, propRect, alpha: 0.72);
      } else if (propImage != null) {
        _drawImage(canvas, propImage, propRect, alpha: 0.72);
      }
    }
  }

  void _drawPlatform(Canvas canvas, Platform platform, GameTheme theme, double time,
      double cameraBottom, double playBottom, Vector2 size) {
    final x = platformX(platform, time, size.x);
    final screenY = _worldToScreen(platformY(platform), cameraBottom, playBottom);
    if (screenY < -90 || screenY > playBottom + 70) return;
    final pw = platform.widthNorm * size.x;
    final shake = platform.fallState == 'shaking' ? sin(time * 60) * 3 : 0;
    final atlas = game.atlases['PLATFORM_ATLAS'];
    final image = game.sprites['PLATFORM_ATLAS'];
    final frameName = platform.type == 'normal' && platform.id % 3 == 0
        ? 'normal_log'
        : _platformFrames[platform.type];
    final frame = atlas?.frames[frameName];

    if (frame != null && image != null) {
      _drawFrameCell(
          canvas, frame, image, Rect.fromLTWH(x - pw / 2 + shake, screenY - 9, pw, 62));
    } else {
      final paint = Paint();
      final rrect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x - pw / 2 + shake, screenY - 6, pw, 14),
        const Radius.circular(7),
      );
      paint.color = theme.palette.deep;
      canvas.drawRRect(rrect, paint);
      paint.color =
          platform.type == 'bouncy' ? theme.palette.accent : theme.palette.glow;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x - pw / 2 + shake, screenY - 6, pw, 5),
          const Radius.circular(5),
        ),
        paint,
      );
    }

    if (platform.type == 'moving' && image != null) {
      final paint = Paint()..color = const Color(0xA6FFFFE6);
      canvas.drawPath(
        Path()
          ..moveTo(x - 11, screenY + 4)
          ..lineTo(x - 3, screenY - 1)
          ..lineTo(x - 3, screenY + 9)
          ..moveTo(x + 11, screenY + 4)
          ..lineTo(x + 3, screenY - 1)
          ..lineTo(x + 3, screenY + 9),
        paint,
      );
    }

    if (platform.checkpoint > 0) {
      final active = platform.checkpoint <= (game.level?.activeCheckpoint ?? 0);
      final flag = atlas?.frames['checkpoint_flag'];
      if (flag != null && image != null) {
        _drawFrameCell(canvas, flag, image,
            Rect.fromLTWH(x - 27, screenY - 61, 54, 66),
            alpha: active ? 1 : 0.42);
      } else {
        _drawFlag(canvas, x, screenY - 8, active ? theme.palette.accent : Colors.white54);
      }
    }

    if (platform.finish) {
      final arch = atlas?.frames['finish_arch'];
      if (arch != null && image != null) {
        _drawFrameCell(
            canvas, arch, image, Rect.fromLTWH(x - 58, screenY - 92, 116, 100));
      } else {
        final paint = Paint()..color = theme.palette.accent.withValues(alpha: 0.85);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x - 30, screenY - 70, 60, 70),
            const Radius.circular(10),
          ),
          paint,
        );
      }
    }
  }

  void _drawFlag(Canvas canvas, double x, double top, Color color) {
    final paint = Paint()..color = Colors.brown.shade700;
    canvas.drawRect(Rect.fromLTWH(x - 1.5, top - 50, 3, 54), paint);
    paint.color = color;
    canvas.drawPath(
      Path()
        ..moveTo(x + 1.5, top - 50)
        ..lineTo(x + 26, top - 42)
        ..lineTo(x + 1.5, top - 34)
        ..close(),
      paint,
    );
  }

  void _drawFly(Canvas canvas, Fly fly, GameTheme theme, double time, double cameraBottom,
      double playBottom, Vector2 size) {
    if (fly.collected) return;
    final x = fly.xNorm * size.x + sin(time * 2.3 + fly.phase) * 7;
    final y = _worldToScreen(fly.y + sin(time * 3 + fly.phase) * 8, cameraBottom, playBottom);
    if (y < -45 || y > playBottom + 45) return;
    final themedImage = game.sprites[theme.creatureAsset];
    final themedFrame = game.atlases[theme.creatureAsset]?.frames[theme.flyFrame];
    final frame = themedFrame ?? game.atlases['ENTITY_ATLAS']?.frames[_flyFrames[fly.type]];
    final image = themedImage ?? game.sprites['ENTITY_ATLAS'];
    final sizeBox = fly.type == 'rare' ? 36.0 : fly.type == 'golden' ? 32.0 : 28.0;
    if (fly.type != 'normal') {
      final haloColor = fly.type == 'rare'
          ? const Color(0x4778EBFF)
          : const Color(0x47FFDC5A);
      final paint = Paint()..color = haloColor;
      canvas.drawCircle(Offset(x, y), fly.type == 'rare' ? 20 : 17, paint);
    }
    if (frame != null && image != null) {
      _drawFrameCell(canvas, frame, image,
          Rect.fromLTWH(x - sizeBox / 2, y - sizeBox / 2, sizeBox, sizeBox));
    } else {
      final paint = Paint();
      paint.color = fly.type == 'golden'
          ? const Color(0xFFFFDC5A)
          : fly.type == 'rare'
              ? const Color(0xFF78EBFF)
              : fly.type == 'special'
                  ? const Color(0xFFFF9ECF)
                  : Colors.white;
      canvas.drawCircle(Offset(x, y), 5, paint);
      paint.color = Colors.black87;
      canvas.drawCircle(Offset(x - 1.6, y - 1), 1.4, paint);
      canvas.drawCircle(Offset(x + 1.6, y - 1), 1.4, paint);
    }
  }

  void _drawEnemy(Canvas canvas, Enemy enemy, GameTheme theme, double time,
      double cameraBottom, double playBottom, Vector2 size) {
    final x = enemy.xNorm * size.x;
    final bob = enemy.type == 'butterfly'
        ? sin(time * 5 + enemy.phase) * 38
        : sin(time * 2 + enemy.phase) * 10;
    final y = _worldToScreen(enemy.y + bob, cameraBottom, playBottom);
    if (y < -70 || y > playBottom + 70) return;
    final box = enemy.type == 'owl'
        ? 62.0
        : enemy.type == 'air_burst'
            ? 68.0
            : 52.0;
    final themedImage = game.sprites[theme.creatureAsset];
    final themedFrame = game.atlases[theme.creatureAsset]?.frames[theme.birdFrame];
    final image = themedImage ?? game.sprites['ENTITY_ATLAS'];
    final frame = themedFrame ?? game.atlases['ENTITY_ATLAS']?.frames[enemy.type];
    if (frame != null && image != null) {
      canvas.save();
      canvas.translate(x, y);
      if (enemy.direction < 0) canvas.scale(-1.0, 1.0);
      _drawFrameCell(canvas, frame, image, Rect.fromLTWH(-box / 2, -box / 2, box, box));
      canvas.restore();
    } else {
      final paint = Paint()..color = Colors.redAccent;
      canvas.drawCircle(Offset(x, y), box / 3, paint);
    }
  }

  void _drawTongue(Canvas canvas, Run run, double cameraBottom, double playBottom) {
    final frog = run.frog;
    if (frog.tongueTimer <= 0) return;
    final x = frog.x + frog.tongueDirection * 17;
    final y = _worldToScreen(frog.y + 35, cameraBottom, playBottom);
    final length = 36 + (frog.tongueTimer / 0.16) * 66;
    final paint = Paint()
      ..color = const Color(0xFFE8798A)
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(x, y),
        Offset(x + frog.tongueDirection * length, y - 2), paint);
    paint.style = PaintingStyle.fill;
    paint.color = const Color(0xFFF4A1AA);
    canvas.drawCircle(Offset(x + frog.tongueDirection * length, y - 2), 5, paint);
  }

  void _drawFrog(Canvas canvas, Frog frog, bool started, double cameraBottom,
      double playBottom) {
    final screenY = _worldToScreen(frog.y, cameraBottom, playBottom);
    final atlas = game.atlases['FROG_SHEET'];
    final frame = atlas?.frames[_frogFrameName(frog, started)];
    final image = game.sprites['FROG_SHEET'];
    if (frame != null && image != null) {
      _drawFrogFrame(canvas, frame, image, frog.x, screenY, frog.direction, 1);
      return;
    }
    final box = kBaseFrogSize;
    final paint = Paint()..color = Colors.green;
    canvas.save();
    canvas.translate(frog.x, screenY);
    if (frog.direction < 0) canvas.scale(-1, 1);
    canvas.drawCircle(Offset(0, -box / 2), box / 2.4, paint);
    canvas.restore();
  }

  void _drawFrogIdle(Canvas canvas, GameTheme theme, double time, Vector2 size) {
    final atlas = game.atlases['FROG_SHEET'];
    final frame = atlas?.frames['squat'];
    final image = game.sprites['FROG_SHEET'];
    final cx = size.x * 0.5;
    final cy = size.y * 0.7 + sin(time * 2) * 4;
    if (frame != null && image != null) {
      _drawFrogFrame(canvas, frame, image, cx, cy, 1, 1.5);
    }
  }

  void _drawParticles(Canvas canvas, Run run, double cameraBottom, double playBottom) {
    final paint = Paint();
    for (final particle in run.particles) {
      final y = _worldToScreen(particle.y, cameraBottom, playBottom);
      paint.color = _parseColor(particle.color)
          .withValues(alpha: max(0, particle.life * 1.7));
      canvas.drawCircle(Offset(particle.x, y), 2.8, paint);
    }
  }

  Color _parseColor(String hex) {
    final v = hex.replaceFirst('#', '');
    return Color(int.parse(v, radix: 16) + 0xFF000000);
  }
}

class KodokGame extends FlameGame with ChangeNotifier {
  KodokGame();

  final Map<String, Image> sprites = {};
  final Map<String, SpriteAtlas> atlases = {};
  final Map<String, SpriteSheet> sheets = {};
  final Save save = Save();
  final Tuning tuning = Tuning(
    gravity: 1350,
    bounceVelocity: 610,
    steering: 980,
    enemySpeed: 1,
    effectsIntensity: 1,
  );
  final InputState input = InputState();

  Level? level;
  Run? run;
  String screen = 'loading';
  double time = 0;

  int lastReward = 0;
  bool lastPerfect = false;

  @override
  Future<void> onLoad() async {
    add(WorldComponent(this));
    for (final entry in assetPaths.entries) {
      sprites[entry.key] = await images.load(entry.value);
      final atlas = await SpriteAtlas.load(entry.key);
      if (atlas != null) atlases[entry.key] = atlas;
      final sheet = await SpriteSheet.load(entry.key);
      if (sheet != null) sheets[entry.key] = sheet;
    }
    screen = 'menu';
    notifyListeners();
  }

  void pressDirection(int direction) {
    if (screen != 'playing' || run == null || level == null) return;
    if (!run!.started) {
      run!.started = true;
      run!.frog.vy = tuning.bounceVelocity;
    }
    flickTongue(run!, level!, direction, size.x, time);
  }

  void startStage(int stage, [int checkpoint = 0]) {
    final safeStage = max(1, min(100, stage));
    level = generateLevel(safeStage);
    run = createRun(level!, checkpoint, size.x);
    save.currentStage = safeStage;
    save.checkpoint = checkpoint;
    save.bestStage = max(save.bestStage, safeStage);
    screen = 'playing';
    input.left = false;
    input.right = false;
    notifyListeners();
  }

  void togglePause() {
    if (screen == 'playing') {
      screen = 'paused';
      notifyListeners();
    } else if (screen == 'paused') {
      resume();
    }
  }

  void resume() {
    if (level == null || run == null) return;
    screen = 'playing';
    notifyListeners();
  }

  void toMenu() {
    screen = 'menu';
    input.left = false;
    input.right = false;
    notifyListeners();
  }

  void refresh() => notifyListeners();

  void restart() => startStage(save.currentStage, save.checkpoint);

  void nextStage() => startStage(min(100, (level?.stage ?? save.currentStage) + 1), 0);

  void _handleCheckpoint(int checkpoint) {
    save.checkpoint = checkpoint;
    save.coins += 5;
  }

  void _handleFinish() {
    if (run == null || level == null) return;
    final perfect = run!.caught == level!.totalFlies;
    final firstClear = save.unlockedWorld <= level!.stage;
    final reward = (firstClear ? 20 : 10) + run!.caught * 2 + (perfect ? 20 : 0);
    save.coins += reward;
    save.totalFly += run!.score;
    save.bestStage = max(save.bestStage, level!.stage);
    save.unlockedWorld = max(save.unlockedWorld, min(100, level!.stage + 1));
    if (perfect && !save.perfectStages.contains(level!.stage)) {
      save.perfectStages.add(level!.stage);
    }
    if (level!.stage < 100) save.currentStage = level!.stage + 1;
    save.checkpoint = 0;
    lastReward = reward;
    lastPerfect = perfect;
    screen = 'complete';
    notifyListeners();
  }

  @override
  void update(double dt) {
    super.update(dt);
    time += dt;
    if (screen == 'playing' && level != null && run != null) {
      updateLevel(level!, dt, enemySpeed: tuning.enemySpeed);
      final events = updateRun(
        run!,
        level!,
        input,
        tuning,
        dt,
        time,
        size.x,
        max(240.0, size.y - 88),
      );
      for (final event in events) {
        if (event.type == 'land') {
          _addLandingParticles(event.platform!);
        } else if (event.type == 'checkpoint') {
          _handleCheckpoint(event.checkpoint!);
        } else if (event.type == 'fail') {
          screen = 'failure';
          notifyListeners();
        } else if (event.type == 'finish') {
          _handleFinish();
        }
      }
      if (screen == 'playing') notifyListeners();
    }
  }

  void _addLandingParticles(Platform platform) {
    final count = max(2, (5 * tuning.effectsIntensity).round());
    for (var index = 0; index < count; index++) {
      run?.particles.add(Particle(
        x: run!.frog.x + (Random().nextDouble() - 0.5) * 25,
        y: platform.y + 3,
        vx: (Random().nextDouble() - 0.5) * 70,
        vy: 30 + Random().nextDouble() * 45,
        life: 0.28 + Random().nextDouble() * 0.2,
        color: _accentHex(level?.theme.palette.accent ?? Colors.white),
      ));
    }
  }

  String _accentHex(Color c) =>
      '#${c.toARGB32().toRadixString(16).padLeft(8, '0').substring(2)}';

  final Set<LogicalKeyboardKey> _heldKeys = {};

  void handleKeyEvent(KeyEvent e) {
    if (e is KeyDownEvent) {
      if (e.logicalKey == LogicalKeyboardKey.arrowLeft ||
          e.logicalKey == LogicalKeyboardKey.keyA) {
        input.left = true;
        if (_heldKeys.add(e.logicalKey)) pressDirection(-1);
      } else if (e.logicalKey == LogicalKeyboardKey.arrowRight ||
          e.logicalKey == LogicalKeyboardKey.keyD) {
        input.right = true;
        if (_heldKeys.add(e.logicalKey)) pressDirection(1);
      } else if (e.logicalKey == LogicalKeyboardKey.escape) {
        togglePause();
      }
    } else if (e is KeyUpEvent) {
      _heldKeys.remove(e.logicalKey);
      if (e.logicalKey == LogicalKeyboardKey.arrowLeft ||
          e.logicalKey == LogicalKeyboardKey.keyA) {
        input.left = false;
      } else if (e.logicalKey == LogicalKeyboardKey.arrowRight ||
          e.logicalKey == LogicalKeyboardKey.keyD) {
        input.right = false;
      }
    }
  }
}
