import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  BsVolumeDownFill as VolumeDownIcon,
  BsFillVolumeUpFill as VolumeUpIcon,
} from 'react-icons/bs'
import {
  TiMediaPause as PauseIcon,
  TiMediaPlay as PlayIcon,
  TiMediaRewind as SeekBackIcon,
  TiMediaFastForward as SeekForwardIcon,
} from 'react-icons/ti'

import { useVideoContext } from '@/context/videoContext'
import MotionFadeInOut from '@/shared/ux/MotionFadeInOut'

export default function ActionSymbols() {
  const { action: playerAction } = useVideoContext()
  const [action, setAction] = useState('')
  let timer

  useEffect(() => {
    if (playerAction === '') return
    // clear timeout if there is one
    if (timer) clearTimeout(timer)
    // set action
    setAction(playerAction)
    // start timeout
    timer = setTimeout(() => {
      setAction('')
    }, 1000)
  }, [playerAction])

  return (
    <div className='mr-2 text-2xl text-themeAccent'>
      <AnimatePresence exitBeforeEnter>
        {action === 'play' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <PlayIcon />
          </MotionFadeInOut>
        )}
        {action === 'pause' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <PauseIcon />
          </MotionFadeInOut>
        )}
        {action === 'volumeUp' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <VolumeUpIcon />
          </MotionFadeInOut>
        )}
        {action === 'volumeDown' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <VolumeDownIcon />
          </MotionFadeInOut>
        )}
        {action === 'seekBack' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <SeekBackIcon />
          </MotionFadeInOut>
        )}
        {action === 'seekForward' && (
          <MotionFadeInOut motionKey={action} duration={0.5}>
            <SeekForwardIcon />
          </MotionFadeInOut>
        )}
      </AnimatePresence>
    </div>
  )
}
