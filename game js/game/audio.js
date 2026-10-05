export async function createAudioController(sdk) {
  let managed = null;
  let unlocked = false;
  let paused = true;
  let settings = { music: true, sound: true };
  let themeIndex = 0;
  let musicStep = 0;
  let musicTimer = 0;

  try {
    managed = await sdk.audio.getContext();
  } catch {
    managed = null;
  }

  const context = managed?.context;

  function tone(frequency, duration, volume, type = "sine", delay = 0) {
    if (!context || context.state !== "running") return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(Math.max(0.001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function musicTick() {
    if (paused || !settings.music || !unlocked) return;
    const scale = [0, 4, 7, 11, 7, 4];
    const root = 174.61 * 2 ** ((themeIndex % 7) / 12);
    const note = root * 2 ** (scale[musicStep % scale.length] / 12);
    tone(note, 0.34, 0.025, "sine");
    tone(note * 2, 0.12, 0.012, "triangle", 0.03);
    musicStep += 1;
  }

  if (context) musicTimer = window.setInterval(musicTick, 430);

  return {
    async unlock() {
      if (!managed || unlocked) return;
      try {
        await managed.unlock();
        unlocked = true;
      } catch {
        unlocked = false;
      }
    },
    setPaused(value) {
      paused = value;
    },
    setTheme(index) {
      themeIndex = index;
      musicStep = 0;
    },
    setSettings(next) {
      settings = { ...settings, ...next };
    },
    play(name) {
      if (!settings.sound || paused || !unlocked) return;
      if (name === "bounce") {
        tone(185, 0.09, 0.05, "sine");
        tone(310, 0.12, 0.035, "triangle", 0.035);
      } else if (name === "catch") {
        tone(720, 0.05, 0.045, "square");
        tone(1100, 0.09, 0.035, "sine", 0.035);
      } else if (name === "checkpoint") {
        tone(440, 0.16, 0.04, "triangle");
        tone(660, 0.2, 0.035, "triangle", 0.1);
        tone(880, 0.28, 0.03, "sine", 0.2);
      } else if (name === "fall") {
        tone(210, 0.28, 0.06, "sawtooth");
        tone(120, 0.35, 0.035, "sine", 0.06);
      } else if (name === "creak") {
        tone(90, 0.12, 0.035, "square");
        tone(72, 0.15, 0.025, "square", 0.11);
      } else if (name === "ui") {
        tone(560, 0.055, 0.025, "triangle");
      } else if (name === "finish") {
        [523, 659, 784].forEach((frequency, index) => tone(frequency, 0.35, 0.035, "triangle", index * 0.1));
      }
    },
    destroy() {
      window.clearInterval(musicTimer);
      void managed?.dispose().catch(() => {});
    },
  };
}
