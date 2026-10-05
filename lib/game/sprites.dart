import 'dart:convert';

import 'package:flutter/services.dart';

class Frame {
  Frame.fromJson(Map<String, dynamic> json)
      : content = _rect(json['content']),
        source = _rect(json['source']),
        anchor = _offset(json['anchor']);

  final Rect content;
  final Rect source;
  final Offset anchor;

  Rect get crop => content.width > 0 && content.height > 0 ? content : source;

  static Rect _rect(dynamic j) => Rect.fromLTWH(
        (j['x'] as num).toDouble(),
        (j['y'] as num).toDouble(),
        (j['w'] as num).toDouble(),
        (j['h'] as num).toDouble(),
      );

  static Offset _offset(dynamic j) =>
      Offset((j['x'] as num).toDouble(), (j['y'] as num).toDouble());
}

class SpriteAtlas {
  SpriteAtlas(this.frames);

  final Map<String, Frame> frames;

  static Future<SpriteAtlas?> load(String assetKey) async {
    final path = 'assets/json/${assetKey.toLowerCase()}-transparent.frames.json';
    try {
      final text = await rootBundle.loadString(path);
      final data = jsonDecode(text) as Map<String, dynamic>;
      if (data.containsKey('frames')) {
        final frames = <String, Frame>{};
        for (final f in data['frames'] as List) {
          final frame = Frame.fromJson(f as Map<String, dynamic>);
          frames[f['name'] as String] = frame;
        }
        return SpriteAtlas(frames);
      }
    } catch (_) {
      // No frame data for this asset; render without it.
    }
    return null;
  }
}

class SpriteSheet {
  SpriteSheet(this.animations);

  final Map<String, List<Frame>> animations;

  static Future<SpriteSheet?> load(String assetKey) async {
    final path = 'assets/json/${assetKey.toLowerCase()}-transparent.frames.json';
    try {
      final text = await rootBundle.loadString(path);
      final data = jsonDecode(text) as Map<String, dynamic>;
      if (data.containsKey('animations')) {
        final animations = <String, List<Frame>>{};
        for (final a in data['animations'] as List) {
          final name = a['name'] as String;
          final frames = (a['frames'] as List)
              .map((f) => Frame.fromJson(f as Map<String, dynamic>))
              .toList();
          animations[name] = frames;
        }
        return SpriteSheet(animations);
      }
    } catch (_) {
      // No animation data for this asset.
    }
    return null;
  }
}
