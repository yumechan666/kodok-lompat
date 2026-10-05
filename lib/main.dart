import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import 'game/kodok_game.dart';

void main() {
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kodok',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.green),
      home: GameScreen(game: KodokGame()),
    );
  }
}

class GameScreen extends StatelessWidget {
  const GameScreen({super.key, required this.game});

  final KodokGame game;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: KeyboardListener(
        focusNode: FocusNode()..requestFocus(),
        onKeyEvent: game.handleKeyEvent,
        child: ListenableBuilder(
          listenable: game,
          builder: (context, _) {
            final screen = game.screen;
            return Stack(
              children: [
                Positioned.fill(
                  child: GameWidget(game: game),
                ),
                if (screen == 'loading') _centeredText('Loading…'),
                if (screen == 'menu') _menu(),
                if (screen == 'playing') _playing(),
                if (screen == 'paused') _paused(),
                if (screen == 'failure') _failure(),
                if (screen == 'complete') _complete(),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _centeredText(String text) => Center(
        child: Text(text, style: const TextStyle(fontSize: 22, color: Colors.white)),
      );

  Widget _menu() => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('KODOK',
                style: TextStyle(fontSize: 56, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 8),
            Text('Best stage: ${game.save.bestStage}',
                style: const TextStyle(fontSize: 16, color: Colors.white70)),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () => game.startStage(game.save.currentStage, game.save.checkpoint),
              child: const Text('PLAY'),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  onPressed: () => game
                    ..save.currentStage = (game.save.currentStage - 1).clamp(1, 100)
                    ..refresh(),
                  icon: const Icon(Icons.remove, color: Colors.white),
                ),
                Text('Stage ${game.save.currentStage}',
                    style: const TextStyle(color: Colors.white, fontSize: 18)),
                IconButton(
                  onPressed: () => game
                    ..save.currentStage = (game.save.currentStage + 1).clamp(1, 100)
                    ..refresh(),
                  icon: const Icon(Icons.add, color: Colors.white),
                ),
              ],
            ),
          ],
        ),
      );

  Widget _playing() => Stack(
        children: [
          Positioned(
            top: 12,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  'Stage ${game.level?.stage}   Flies ${game.run?.caught}/${game.level?.totalFlies}   '
                  'Score ${game.run?.score}   ${_checkpointLabel()}',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ),
          ),
          Positioned(
            top: 12,
            right: 12,
            child: IconButton(
              onPressed: game.togglePause,
              icon: const Icon(Icons.pause, color: Colors.white),
            ),
          ),
          if (game.run != null && game.run!.toastTimer > 0)
            Positioned(
              top: 60,
              left: 0,
              right: 0,
              child: Center(
                child: Text(game.run!.toast,
                    style: const TextStyle(color: Colors.amber, fontSize: 22, fontWeight: FontWeight.bold)),
              ),
            ),
          Positioned(
            left: 16,
            bottom: 24,
            child: _directionButton(-1, Icons.arrow_left),
          ),
          Positioned(
            right: 16,
            bottom: 24,
            child: _directionButton(1, Icons.arrow_right),
          ),
        ],
      );

  String _checkpointLabel() {
    final cp = game.run?.checkpoint ?? 0;
    if (cp <= 0) return 'A';
    return String.fromCharCode(64 + cp);
  }

  Widget _directionButton(int dir, IconData icon) => GestureDetector(
        onTapDown: (_) {
          game.input.left = dir < 0;
          game.input.right = dir > 0;
          game.pressDirection(dir);
        },
        onTapUp: (_) {
          game.input.left = false;
          game.input.right = false;
        },
        onTapCancel: () {
          game.input.left = false;
          game.input.right = false;
        },
        child: Container(
          width: 86,
          height: 86,
          decoration: BoxDecoration(
            color: Colors.white24,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white54),
          ),
          child: Icon(icon, color: Colors.white, size: 40),
        ),
      );

  Widget _paused() => _panel(
        children: [
          const Text('Paused', style: TextStyle(fontSize: 34, color: Colors.white)),
          const SizedBox(height: 20),
          FilledButton(onPressed: game.resume, child: const Text('Resume')),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: game.toMenu, child: const Text('Main Menu')),
        ],
      );

  Widget _failure() => _panel(
        children: [
          const Text('You Fell!', style: TextStyle(fontSize: 34, color: Colors.white)),
          const SizedBox(height: 12),
          Text('Reached stage ${game.level?.stage}',
              style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 20),
          FilledButton(onPressed: game.restart, child: const Text('Retry')),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: game.toMenu, child: const Text('Main Menu')),
        ],
      );

  Widget _complete() => _panel(
        children: [
          const Text('Stage Clear!', style: TextStyle(fontSize: 34, color: Colors.white)),
          const SizedBox(height: 12),
          Text('Reward +${game.lastReward} ${game.lastPerfect ? "(Perfect!)" : ""}',
              style: const TextStyle(color: Colors.amber, fontSize: 18)),
          const SizedBox(height: 20),
          FilledButton(onPressed: game.nextStage, child: const Text('Next Stage')),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: game.toMenu, child: const Text('Main Menu')),
        ],
      );

  Widget _panel({required List<Widget> children}) => Container(
        color: Colors.black54,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: children,
          ),
        ),
      );
}
