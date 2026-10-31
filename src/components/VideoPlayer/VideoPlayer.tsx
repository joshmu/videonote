/**
 * @path /src/components/VideoPlayer/VideoPlayer.tsx
 *
 * @project videonote
 * @file VideoPlayer.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 17th September 2020
 * @modified Friday, 11th December 2020 10:40:46 am
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from "motion/react";
import { type SyntheticEvent, useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";

import { useVideoContext } from "@/context/videoContext";
import { Loader } from "@/shared/Loader/Loader";

import { ActionInput } from "../ActionInput/ActionInput";
import { Underlay } from "./Underlay/Underlay";
import style from "./videoPlayer.module.scss";

const videoContentVariants: Variants = {
  initial: {
    opacity: 0,
    // x: '-100%',
  },
  animate: {
    opacity: 1,
    // x: 0,
  },
  exit: {
    opacity: 0,
    // x: '-100%',
  },
};

/**
 * ReactPlayer calls play() without handling its promise. A source the browser
 * can't play rejects it, and `onError` already warns the user about that source.
 */
const ignoreUnsupportedPlay = (player: HTMLVideoElement): void => {
  const play = player.play.bind(player);
  player.play = () =>
    Promise.resolve(play()).catch((error: unknown) => {
      if ((error as Error)?.name !== "NotSupportedError") throw error;
    });
};

// Hosted players never fire canplay: YouTube and Vimeo fire loadedmetadata, TikTok only durationchange.
const READY_EVENTS = ["loadedmetadata", "durationchange", "canplay"];

export const VideoPlayer = () => {
  const {
    url,
    playing,
    volume,
    playbackRate,
    handleReady,
    handleProgress,
    handlePlayerError,
    handleDuration,
    playerRef,
  } = useVideoContext();

  // the url the player last said it could play: anything else is still loading
  const [readyUrl, setReadyUrl] = useState<string>(null);
  // the url that last failed: nothing more is coming, so stop showing the loader
  const [failedUrl, setFailedUrl] = useState<string>(null);
  const isLoading = !!url && readyUrl !== url;
  const currentUrl = useRef<string>(url);
  currentUrl.current = url;

  // React sets src while rendering, so a quick player can be ready before this
  // runs, and well before event props attach: its event would be missed for good.
  const attachPlayer = useCallback(
    (player: HTMLVideoElement | null) => {
      playerRef.current = player;
      if (!player) return;
      ignoreUnsupportedPlay(player);
      const handleLoaded = () => {
        handleDuration(player.duration);
        handleReady();
        setReadyUrl(currentUrl.current);
      };
      READY_EVENTS.forEach((type) => player.addEventListener(type, handleLoaded));
      if (player.readyState >= HTMLMediaElement.HAVE_METADATA) handleLoaded();
    },
    [playerRef],
  );

  const handleTimeUpdate = (e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    handleProgress({
      playedSeconds: el.currentTime,
      played: el.duration ? el.currentTime / el.duration : 0,
      loadedSeconds: el.buffered.length > 0 ? el.buffered.end(el.buffered.length - 1) : 0,
      loaded:
        el.duration && el.buffered.length > 0
          ? el.buffered.end(el.buffered.length - 1) / el.duration
          : 0,
    });
  };

  const isPlayerReady = !isLoading && !!playerRef.current;

  return (
    <div className="relative flex w-full transition-all duration-500 ease-in-out">
      <Underlay show={isPlayerReady} />

      <div className="relative z-10 w-full my-auto">
        {/* // wrapper to position input */}
        <motion.div
          key="videoContent"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={videoContentVariants}
          id="videoContent"
        >
          {/* resposive video wrapper */}
          <div className={`${style.playerWrapper} w-full h-full`}>
            {url && (
              <ReactPlayer
                ref={attachPlayer}
                src={url}
                onError={(error) => {
                  setFailedUrl(url);
                  handlePlayerError(error);
                }}
                controls={false}
                playing={playing}
                volume={volume}
                playbackRate={playbackRate}
                onTimeUpdate={handleTimeUpdate}
                className={`${style.reactPlayer} `}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </motion.div>

        <Loader show={isLoading && failedUrl !== url} />
      </div>

      {/* input wrapper */}
      {!isLoading && url && (
        <motion.div
          key="action-input"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="absolute bottom-0 z-10 w-2/3 h-12 mb-8 transform -translate-x-1/2 left-1/2">
            <ActionInput />
          </div>
        </motion.div>
      )}
    </div>
  );
};
