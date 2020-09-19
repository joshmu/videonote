import ReactPlayer from 'react-player'
import ActionInput from '../ActionInput/ActionInput'
import { motion } from 'framer-motion'

import { useVideoContext } from '../../context/videoContext'

import style from './videoPlayer.module.scss'

export default function VideoPlayer() {
  const {
    url,
    playing,
    volume,
    playerRef,
    handleReady,
    handleProgress,
  } = useVideoContext()

  // todo: how can we always center video vertically?
  // todo: wrapper for theme toggle otherwise insert in to navbar

  return (
    // wrapper to position input
    <div className='relative w-full h-full'>
      {/* resposive wrapper */}
      <div className={`${style.playerWrapper} w-full h-full`}>
        <ReactPlayer
          url={url}
          controls={false}
          playing={playing}
          volume={volume}
          progressInterval={500}
          onReady={handleReady}
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
      </div>
      {/* input wrapper */}
      {playerRef.current && (
        <motion.div
          key='action-input'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className='absolute bottom-0 z-50 w-2/3 h-12 mb-8 transform -translate-x-1/2 left-1/2'>
            <ActionInput />
          </div>
        </motion.div>
      )}
    </div>
  )
}
