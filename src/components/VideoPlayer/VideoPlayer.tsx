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

import { Variants, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

import { useVideoContext } from '@/context/videoContext'
import { useIsMount } from '@/hooks/useIsMount'
import { Loader } from '@/shared/Loader/Loader'

import { ActionInput } from '../ActionInput/ActionInput'
import { Underlay } from './Underlay/Underlay'
import style from './videoPlayer.module.scss'

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
}

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
  } = useVideoContext()

  const isMount = useIsMount()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isMount) return
    // if url changes then presume we are loading a new video
    console.log(`loading ${url}`)
    if (typeof url === 'string' && url.length > 0) setIsLoading(true)
  }, [url, isMount])

  const preHandleReady = (reactPlayer: ReactPlayer) => {
    handleReady(reactPlayer)
    setIsLoading(false)
  }

  const isPlayerReady = !isLoading && playerRef.current

  return (
    <div className='relative flex w-full transition-all duration-500 ease-in-out'>
      <Underlay show={isPlayerReady} />

      <div className='relative z-10 w-full my-auto'>
        {/* // wrapper to position input */}
        <motion.div
          key='videoContent'
          initial='initial'
          animate='animate'
          exit='exit'
          variants={videoContentVariants}
          id='videoContent'
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
        </motion.div>

        <Loader show={isLoading} />
      </div>

      {/* input wrapper */}
      {!isLoading && url && (
        <motion.div
          key='action-input'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className='absolute bottom-0 z-10 w-2/3 h-12 mb-8 transform -translate-x-1/2 left-1/2'>
            <ActionInput />
          </div>
        </motion.div>
      )}
    </div>
  )
}
