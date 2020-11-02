import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

import { useGlobalContext } from '@/context/globalContext'
import { useVideoContext } from '@/context/videoContext'
import { useIsMount } from '@/hooks/useIsMount'

import ActionInput from '../ActionInput/ActionInput'
import Loader from '../shared/Loader/Loader'
import style from './videoPlayer.module.scss'

export default function VideoPlayer() {
  const { projects, project, admin, checkCanEdit } = useGlobalContext()
  const {
    url,
    playing,
    volume,
    playbackRate,
    playerRef,
    handleReady,
    handleProgress,
    handlePlayerError,
    handleDuration,
  } = useVideoContext()

  const isMount = useIsMount()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isMount) return
    // if url changes then presume we are loading a new video
    if (typeof url === 'string' && url.length > 0) setIsLoading(true)
  }, [url, isMount])

  const preHandleReady = reactPlayer => {
    handleReady(reactPlayer)
    setIsLoading(false)
  }

  const videoContentVariants = {
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
  }

  return (
    // wrapper to position input
    <motion.div
      key='videoContent'
      initial='initial'
      animate='animate'
      exit='exit'
      variants={videoContentVariants}
      id='videoContent'
      className='relative w-full h-full transition-all duration-500 ease-in-out'
    >
      {/* resposive video wrapper */}
      <div className={`${style.playerWrapper} w-full h-full`}>
        {url && (
          <ReactPlayer
            url={url}
            onError={handlePlayerError}
            controls={false}
            playing={playing}
            volume={volume}
            playbackRate={playbackRate}
            progressInterval={500}
            onDuration={handleDuration}
            onReady={preHandleReady}
            onProgress={handleProgress}
            config={{
              youtube: {
                playerVars: { showinfo: 0, autoplay: 0 },
              },
              vimeo: {},
            }}
            className={`${style.reactPlayer} `}
            width='100%'
            height='100%'
          />
        )}
      </div>
      {/* input wrapper */}
      {!isLoading && url && (
        <motion.div
          key='action-input'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div
            className={`${
              checkCanEdit() ? 'h-12' : 'h-1'
            } absolute bottom-0 z-10 w-2/3 mb-8 transform -translate-x-1/2 left-1/2`}
          >
            <ActionInput />
          </div>
        </motion.div>
      )}
      {isLoading && <Loader />}
    </motion.div>
  )
}
