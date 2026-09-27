const AIM_LEFT = new Set(['ArrowLeft', 'KeyA']);
const AIM_RIGHT = new Set(['ArrowRight', 'KeyD']);

export interface InputState {
  /** -1 left, +1 right, 0 if neither or both. */
  aim(): number;
}

/**
 * Space / primary click advance the 3-click meter.
 * A/D or arrows steer aim. R resets to the tee.
 * Aim is polled; swing and reset are edge-triggered.
 */
export function bindInput(handlers: {
  onSwing: () => void;
  onReset: () => void;
}): InputState {
  const held = new Set<string>();

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) handlers.onSwing();
      return;
    }
    if (event.code === 'KeyR') {
      if (!event.repeat) handlers.onReset();
      return;
    }
    if (AIM_LEFT.has(event.code) || AIM_RIGHT.has(event.code)) {
      event.preventDefault();
      held.add(event.code);
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    held.delete(event.code);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    handlers.onSwing();
  };

  const onBlur = (): void => {
    held.clear();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('blur', onBlur);

  return {
    aim(): number {
      let axis = 0;
      for (const code of held) {
        if (AIM_LEFT.has(code)) axis -= 1;
        if (AIM_RIGHT.has(code)) axis += 1;
      }
      if (axis > 1) return 1;
      if (axis < -1) return -1;
      return axis;
    },
  };
}
