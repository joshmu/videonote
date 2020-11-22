/**
 * @path /src/components/Modals/CurrentProjectModal/CurrentProjectModal.js
 *
 * @project videonote
 * @file CurrentProjectModal.js
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Wednesday, 30th September 2020
 * @modified Sunday, 22nd November 2020 3:26:55 pm
 * @copyright © 2020 - 2020 MU
 */

import { useEffect, useState } from 'react'

import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { LocalVideoForm } from '@/shared/LocalVideoForm/LocalVideoForm'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'

import ExportNotes from './ExportNotes/ExportNotes'

export default function CurrentProjectModal({
  toggle: toggleModal,
  motionKey,
}) {
  const { updateProject, project, copyToClipboard } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [state, setState] = useState(null)

  useEffect(() => {
    setState(project)
  }, [project])

  const handleUpdate = e => {
    e.preventDefault()

    if (state.title.length === 0)
      return addAlert({
        type: 'error',
        msg: 'Title required.',
      })

    updateProject(state)
    addAlert({ type: 'info', msg: `Updating project: ${state.title}` })
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

  // const handleShare = () => {
  //   // toggle
  //   const updated = !state.isShared
  //   // create new project state
  //   const updatedState = { ...state, isShared: updated }
  //   setState(updatedState)
  //   // as this is important we will send to the server rather than wait for user to update manually
  //   updateProject(updatedState)
  //   // if we are sharing
  //   if (!updated) {
  //     // auto copy to clipboard
  //     copyToClipboard()
  //   }
  // }

  // const handleShareUrlClick = () => {
  //   if (state.isShared) return
  //   copyToClipboard()
  // }

  return (
    state && (
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

            {state.src.length === 0 && (
              <LocalVideoForm handleVideoSrc={handleVideoSrc} />
            )}

            {/* <div className='relative mt-2'>
              <ToggleInput
                title={
                  state.isShared
                    ? 'Share this project?'
                    : 'Sharing this project!'
                }
                state={!state.isShared}
                onClick={handleShare}
              />
              {!state.isShared && (
                <motion.a
                  href={`https://videonote.app/vn/${project._id}`}
                  target='_blank'
                  whileHover={{ scale: 0.95 }}
                  onClick={handleShareUrlClick}
                  className='absolute italic cursor-pointer top-8 text-themeAccent'
                >
                  videonote.app/vn/{project._id}
                </motion.a>
              )}
            </div> */}

            <div className='mt-2'>
              <ExportNotes />
            </div>

            <ModalPrimaryBtn handleClick={handleUpdate}>Update</ModalPrimaryBtn>
          </ModalForm>
        </ModalInnerContainer>
      </ModalContainer>
    )
  )
}
