export function createInput({ leftButton, rightButton, onPress, onPause }) {
  const state = { left: false, right: false };
  const activePointers = new Map();
  const cleanups = [];

  function bindDirection(button, direction) {
    const down = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      activePointers.set(event.pointerId, direction);
      state[direction] = true;
      button.classList.add("is-pressed");
      onPress(direction === "left" ? -1 : 1);
    };
    const up = (event) => {
      if (activePointers.get(event.pointerId) !== direction) return;
      activePointers.delete(event.pointerId);
      state[direction] = [...activePointers.values()].includes(direction);
      button.classList.toggle("is-pressed", state[direction]);
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    cleanups.push(() => {
      button.removeEventListener("pointerdown", down);
      button.removeEventListener("pointerup", up);
      button.removeEventListener("pointercancel", up);
    });
  }

  bindDirection(leftButton, "left");
  bindDirection(rightButton, "right");

  const keyDown = (event) => {
    if (event.repeat) return;
    if (["ArrowLeft", "KeyA"].includes(event.code)) {
      event.preventDefault();
      state.left = true;
      leftButton.classList.add("is-pressed");
      onPress(-1);
    } else if (["ArrowRight", "KeyD"].includes(event.code)) {
      event.preventDefault();
      state.right = true;
      rightButton.classList.add("is-pressed");
      onPress(1);
    } else if (event.code === "Escape") {
      event.preventDefault();
      onPause();
    }
  };
  const keyUp = (event) => {
    if (["ArrowLeft", "KeyA"].includes(event.code)) {
      state.left = false;
      leftButton.classList.remove("is-pressed");
    } else if (["ArrowRight", "KeyD"].includes(event.code)) {
      state.right = false;
      rightButton.classList.remove("is-pressed");
    }
  };
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  return {
    state,
    clear() {
      state.left = false;
      state.right = false;
      activePointers.clear();
      leftButton.classList.remove("is-pressed");
      rightButton.classList.remove("is-pressed");
    },
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    },
  };
}
