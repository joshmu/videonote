import ReactPlayer from 'react-player'
import ActionInput from '../ActionInput/ActionInput'
import style from './videoPlayer.module.scss'

export default function VideoPlayer() {
  const url = 'https://www.youtube.com/watch?v=gdZLi9oWNZg'

  // todo: how can we always center video vertically?
  // todo: wrapper for theme toggle otherwise insert in to navbar

  return (
    // wrapper to position input
    <div className='relative w-full h-full'>
      {/* resposive wrapper */}
      <div className={`${style.playerWrapper} w-full h-full`}>
        <ReactPlayer
          className={`${style.reactPlayer} `}
          url={url}
          controls={false}
          config={{
            youtube: {
              playerVars: { showinfo: 0, autoplay: 0 },
            },
            vimeo: {},
          }}
          width='100%'
          height='100%'
        />
      </div>

      {/* input wrapper */}
      <div className='absolute bottom-0 z-50 w-2/3 h-12 mb-8 transform -translate-x-1/2 left-1/2'>
        <ActionInput />
      </div>
    </div>
  )
}
