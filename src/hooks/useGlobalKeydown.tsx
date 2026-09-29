/**
 * @path /src/hooks/useGlobalKeydown.tsx
 *
 * @project videonote
 * @file useGlobalKeydown.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 30th September 2020
 * @modified Monday, 23rd November 2020 5:06:50 pm
 * @copyright © 2020 - 2020 MU
 */

import { useEffect, useEffectEvent, useRef } from "react";

import { Keymap } from "@/context/controlsContext";

type HandlerType = (eventKey: Keymap, keysPressed: Keymap[]) => void;

/**
 * Calls `handler` with each keymap keydown and the keys already held.
 * Listeners are added once: a browser runs microtasks between listeners, so a
 * re-render that swapped them mid-keydown would drop the other hook's listener.
 */
export const useGlobalKeydown = (handler: HandlerType): void => {
  const keysPressed = useRef<Keymap[]>([]);
  const onKeyDown = useEffectEvent(handler);

  useEffect(() => {
    const isKeymapKey = (key: string): key is Keymap =>
      Object.values(Keymap).includes(key as Keymap);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isKeymapKey(event.key)) return;
      const held = keysPressed.current;
      keysPressed.current = [...held, event.key];
      onKeyDown(event.key, held);
    };

    const handleKeyup = (event: KeyboardEvent): void => {
      const key = event.key;
      keysPressed.current = keysPressed.current.filter((pressedKey) => pressedKey !== key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, []);
};
