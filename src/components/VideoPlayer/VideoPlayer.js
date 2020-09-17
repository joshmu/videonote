import { useEffect } from 'react'
import ReactPlayer from 'react-player'
import style from './videoPlayer.module.scss'

export default function VideoPlayer() {
  const url = 'https://www.youtube.com/watch?v=gdZLi9oWNZg'

  // todo: how can we always center video vertically?
  // todo: wrapper for theme toggle otherwise insert in to navbar

  return (
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
  )
}
