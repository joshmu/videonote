/**
 * @path /src/components/shared/Modal/ModalContainer.tsx
 *
 * @project videonote
 * @file ModalContainer.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 27th September 2020
 * @modified Sunday, 22nd November 2020 4:51:33 pm
 * @copyright © 2020 - 2020 MU
 */

import { HTMLMotionProps, motion } from "motion/react";
import { type KeyboardEvent, ReactNode, useEffect, useRef } from "react";

import { CancelBtn } from "@/shared/CancelBtn/CancelBtn";

interface ModalContainerInterface extends HTMLMotionProps<"div"> {
  toggle: () => void;
  children: ReactNode;
  motionKey?: string;
  zIndex?: string;
  props?: { [key: string]: any };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

export const ModalContainer = ({
  toggle,
  children,
  motionKey = "modal",
  zIndex = null,
  ...props
}: ModalContainerInterface) => {
  const box = useRef<HTMLDivElement>(null);

  // take focus so the keyboard starts in the modal, and hand it back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    if (!box.current?.contains(previous)) box.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Tab stays in the modal while it's open
  const keepTabInside = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Tab") return;
    const focusable = [...(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!focusable.length) return;
    // moved here rather than left to the browser: Safari's Tab skips buttons
    event.preventDefault();
    const current = focusable.indexOf(document.activeElement as HTMLElement);
    const step = event.shiftKey ? -1 : 1;
    const next = current === -1 && event.shiftKey ? focusable.length - 1 : current + step;
    focusable[(next + focusable.length) % focusable.length].focus();
  };

  const variants = {
    initial: { opacity: 0, y: "-40%", x: "-50%" },
    animate: { opacity: 1, y: "-50%", transition: { duration: 0.2 } },
    exit: { opacity: 0, y: "-60%", transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      key={motionKey}
      ref={box}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={keepTabInside}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`${
        zIndex ? zIndex : "z-30"
      } absolute w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-auto top-1/2 left-1/2 outline-none`}
      {...props}
    >
      <div className="relative w-full p-6 mx-auto border rounded-sm shadow-md border-themeText bg-themeBg">
        <CancelBtn cancel={toggle} />
        {children}
      </div>
    </motion.div>
  );
};
