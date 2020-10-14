import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'
import ModalPrimaryBtn from '@/shared/Modal/ModalPrimaryBtn'

import LocalVideoForm from '../../shared/LocalVideoForm/LocalVideoForm'
import ExportNotes from './ExportNotes/ExportNotes'

export default function CurrentProjectModal({
  toggle: toggleModal,
  motionKey,
}) {
  const { updateProject, project, copyToClipboard } = useGlobalContext()
  const [state, setState] = useState(null)

  useEffect(() => {
    setState(project)
  }, [project])

  const handleUpdate = e => {
    e.preventDefault()
    if (state.title.length === 0 || state.src.length === 0) return
    if (state.title === project.title && state.src === project.src) return

    updateProject(state)
    toggleModal()
  }

  const handleChange = e => {
    const updated = { ...state, [e.target.id]: e.target.value }
    setState(updated)
  }

  const handleVideoSrc = url => {
    console.log(url)
    if (typeof url !== 'string' || url.length === 0) return
    const updated = { ...state, src: url }
    setState(updated)
  }

  const handleShare = () => {
    // toggle
    const updated = !state.isPrivate
    // create new project state
    const updatedState = { ...state, isPrivate: updated }
    setState(updatedState)
    // as this is important we will send to the server rather than wait for user to update manually
    updateProject(updatedState)
    // if we are sharing
    if (!updated) {
      // auto copy to clipboard
      copyToClipboard()
    }
  }

  const handleShareUrlClick = () => {
    if (state.isPrivate) return
    copyToClipboard()
  }

  return (
    <>
      {state && (
        <ModalContainer toggle={toggleModal} motionKey={motionKey}>
          <ModalHeader>{state.title}</ModalHeader>

          <ModalInnerContainer>
            <ModalForm>
              <ModalInput
                title='Project Title'
                id='title'
                type='text'
                value={state.title}
                onChange={handleChange}
              />

              <ModalInput
                title='Video URL'
                placeholder='Dropbox, Youtube, Vimeo...'
                id='src'
                type='text'
                value={state.src}
                onChange={handleChange}
              />

              <LocalVideoForm handleVideoSrc={handleVideoSrc} />

              <div className='relative mt-2'>
                <ToggleInput
                  title={
                    state.isPrivate
                      ? 'Share this project?'
                      : 'Sharing this project!'
                  }
                  state={!state.isPrivate}
                  onClick={handleShare}
                />
                {!state.isPrivate && (
                  <motion.a
                    href={`https://videonote.app/vn/${project._id}`}
                    target='_blank'
                    whileHover={{ scale: 0.95 }}
                    onClick={handleShareUrlClick}
                    className='absolute italic cursor-pointer top-8 text-highlight-400'
                  >
                    videonote.app/vn/{project._id}
                  </motion.a>
                )}
              </div>

              <div className='mt-2'>
                <ExportNotes />
              </div>

              <div></div>
              <ModalPrimaryBtn onClick={handleUpdate}>Update</ModalPrimaryBtn>
            </ModalForm>
          </ModalInnerContainer>
        </ModalContainer>
      )}
    </>
  )
}
