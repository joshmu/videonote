/**
 * @path /src/context/videoContext.tsx
 *
 * @project videonote
 * @file videoContext.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Friday, 11th December 2020 10:32:59 am
 * @copyright © 2020 - 2020 MU
 */

import { type RefObject, createContext, useContext, useEffect, useRef, useState } from "react";

import { ProgressInterface } from "@/components/shared/types";
import { useAnounceAction } from "@/hooks/useAnounceAction";
import { LocalVideoLoader } from "@/shared/LocalVideoForm/LocalVideoLoader";

import { useNotificationContext } from "./notificationContext";
import { useProjectsContext } from "./projectsContext";
import { useSessionContext } from "./sessionContext";

export enum PlayerAction {
  PLAY = "play",
  PAUSE = "pause",
  VOLUME_UP = "volumeUp",
  VOLUME_DOWN = "volumeDown",
  SEEK_FORWARD = "seekForward",
  SEEK_BACK = "seekBack",
}
type SeekToType = (secs: number, settings?: { offset?: boolean }) => void;
interface VideoContextInterface {
  playing: boolean;
  volume: number;
  setVolume: (vol: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  duration: number | null;
  handleDuration: (duration: number) => void;
  progress: ProgressInterface;
  handleReady: () => void;
  url: string;
  togglePlay: () => void;
  changeVolume: (increment: number) => void;
  handleProgress: (progress: ProgressInterface) => void;
  seekTo: SeekToType;
  playerRef: RefObject<HTMLVideoElement>;
  handlePlayerError: (error: any) => void;
  jumpBack: () => void;
  jumpForward: () => void;
  action: string;
}

const videoContext = createContext<VideoContextInterface>(null!);

export const VideoProvider = (props: { [key: string]: any }) => {
  const { project, updateProject, warnLocalVideo } = useProjectsContext();
  const { settings } = useSessionContext();
  const { alerts, addAlert, removeAlert } = useNotificationContext();
  const playerRef = useRef<HTMLVideoElement>(null!);
  const [url, setUrl] = useState<string>(null!);
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [duration, setDuration] = useState<number>(null!);
  // todo: this type cast is incorrect and null conditionals need to be checked in useNoteProximity
  const [progress, setProgress] = useState<ProgressInterface>({} as ProgressInterface);

  // a local file played instead of the project's stored src, this session only
  const [localVideo, setLocalVideo] = useState<{ projectId: string; src: string; url: string }>(
    null,
  );

  // the "can't play" warning on screen and the project src it was raised for
  const unplayableWarning = useRef<{ id: string; projectId: string; src: string }>(null);

  const [action, setAction] = useAnounceAction("");

  const isWarningFor = (target: { _id?: string; src?: string } | null): boolean =>
    unplayableWarning.current?.projectId === target?._id &&
    unplayableWarning.current?.src === target?.src;

  const dropUnplayableWarning = (): void => {
    if (unplayableWarning.current) removeAlert(unplayableWarning.current.id);
    unplayableWarning.current = null;
  };

  // the warning belongs to one project src: drop it once another one is current
  useEffect(() => {
    if (unplayableWarning.current && !isWarningFor(project)) dropUnplayableWarning();
  }, [project?._id, project?.src]);

  useEffect(() => {
    if (project !== null && project.src !== null) {
      const isLocal = localVideo?.projectId === project._id && localVideo.src === project.src;
      const nextUrl = isLocal ? localVideo.url : project.src;
      if (nextUrl !== url) {
        console.log("project changed, setting url");
        setUrl(nextUrl);
      }
    } else {
      setUrl(null);
    }
  }, [project, localVideo]);

  const handleReady = (): void => {
    // player ref is now assigned via the ref prop on ReactPlayer
  };

  const togglePlay = (): void => {
    setPlaying((playing) => {
      const updatedPlayState = !playing;
      // console.log({ playing, newState })
      setAction(updatedPlayState ? PlayerAction.PLAY : PlayerAction.PAUSE);
      return updatedPlayState;
    });
  };

  const changeVolume = (increment: number): void => {
    // validate
    if (Number.isNaN(Number(increment))) return;

    // increment
    let newVolume = volume + Number(increment);
    // limit between 0 - 1
    newVolume = newVolume < 0 ? 0 : newVolume > 1 ? 1 : newVolume;
    setVolume(newVolume);

    setAction(increment > 0 ? PlayerAction.VOLUME_UP : PlayerAction.VOLUME_DOWN);
  };

  const handleProgress = (progressObj: ProgressInterface): void => {
    // * config progress interval via -> progressInterval prop
    // {playedSeconds: 8.362433858856201, played: 0.03743574367943649, loadedSeconds: 38.721, loaded: 0.17334061536119902}
    setProgress(progressObj);
  };

  const seekTo: SeekToType = (secs, { offset = true } = {}): void => {
    // validate
    if (Number.isNaN(Number(secs)) || playerRef === null) return;

    // settings offset
    const playPosition = secs + (offset ? settings.playOffset : 0);

    playerRef.current.currentTime = playPosition;

    // if a video has not loaded then also initiate and play
    if (!progress.loaded) {
      console.log("video not loaded, initiating...");
      togglePlay();
    }
  };

  const jumpBack = (): void => {
    const destination = progress.playedSeconds - settings.seekJump;
    seekTo(destination > 0 ? destination : 0);

    setAction(PlayerAction.SEEK_BACK);
  };

  const jumpForward = (): void => {
    const destination = progress.playedSeconds + settings.seekJump;
    seekTo(destination);

    setAction(PlayerAction.SEEK_FORWARD);
  };

  const handlePlayerError = (error: any): void => {
    console.log("vn player error", error);

    // a local file saved in an earlier session: its blob url can never play again
    if (project && url === project.src && project.src.startsWith("blob:")) {
      updateProject({ src: "" });
      warnLocalVideo(project);
      return;
    }

    // keep the stored url (other browsers may play it) and offer a local copy instead
    const { _id: projectId, src } = project ?? {};
    const isShowing = alerts.some((alert) => alert.id === unplayableWarning.current?.id);
    if (isShowing && isWarningFor(project)) return;
    dropUnplayableWarning();

    const alertId = addAlert({
      type: "warning",
      persistent: true,
      msg: (
        <span>
          This browser can't play this video. Check the URL, or if its codec is the problem, try
          another browser or re-encode it to H.264/AAC.
          <LocalVideoLoader
            id="unplayableVideoFile"
            handleVideoSrc={(localUrl) => {
              setLocalVideo({ projectId, src, url: localUrl });
              dropUnplayableWarning();
            }}
          />
        </span>
      ),
    });
    unplayableWarning.current = { id: alertId, projectId, src };
  };

  const handleDuration = (secs: number): void => {
    setDuration(secs);
  };

  const value = {
    handleReady,
    url,
    playing,
    togglePlay,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    duration,
    handleDuration,
    changeVolume,
    handleProgress,
    progress,
    seekTo,
    playerRef,
    handlePlayerError,
    jumpForward,
    jumpBack,
    action,
  };

  return <videoContext.Provider value={value} {...props} />;
};

export const useVideoContext = (): VideoContextInterface => {
  return useContext(videoContext);
};
