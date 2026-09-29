/**
 * @path /src/components/ActionInput/ActionSymbols/ActionSymbols.tsx
 *
 * @project videonote
 * @file ActionSymbols.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 28th September 2020
 * @modified Monday, 23rd November 2020 3:22:52 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  BsVolumeDownFill as VolumeDownIcon,
  BsFillVolumeUpFill as VolumeUpIcon,
} from "react-icons/bs";
import {
  TiMediaPause as PauseIcon,
  TiMediaPlay as PlayIcon,
  TiMediaRewind as SeekBackIcon,
  TiMediaFastForward as SeekForwardIcon,
} from "react-icons/ti";

import { PlayerAction, useVideoContext } from "@/context/videoContext";
import { MotionFadeInOut } from "@/shared/ux/MotionFadeInOut";

export default function ActionSymbols() {
  const { action: playerAction } = useVideoContext();
  const [action, setAction] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // show each player action for a second, restarting on a new one
  useEffect(() => {
    if (playerAction === "") return;
    setAction(playerAction);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAction(""), 1000);
  }, [playerAction]);

  return (
    <div className="mr-2 text-2xl text-themeAccent">
      <AnimatePresence mode="wait">
        {action === PlayerAction.PLAY && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <PlayIcon />
          </MotionFadeInOut>
        )}
        {action === PlayerAction.PAUSE && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <PauseIcon />
          </MotionFadeInOut>
        )}
        {action === PlayerAction.VOLUME_UP && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <VolumeUpIcon />
          </MotionFadeInOut>
        )}
        {action === PlayerAction.VOLUME_DOWN && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <VolumeDownIcon />
          </MotionFadeInOut>
        )}
        {action === PlayerAction.SEEK_BACK && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <SeekBackIcon />
          </MotionFadeInOut>
        )}
        {action === PlayerAction.SEEK_FORWARD && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <SeekForwardIcon />
          </MotionFadeInOut>
        )}
      </AnimatePresence>
    </div>
  );
}
