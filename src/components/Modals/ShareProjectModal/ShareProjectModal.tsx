/**
 * @path /src/components/Modals/ShareProjectModal/ShareProjectModal.tsx
 *
 * @project videonote
 * @file ShareProjectModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 2nd November 2020
 * @modified Sunday, 22nd November 2020 6:02:18 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalForm } from '@/shared/Modal/ModalForm'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { ModalInput } from '@/shared/Modal/ModalInput'
import { ShareProjectInterface } from '@/shared/types'

// todo: remove bad characters from url path entry
const formatUrl = (txt: string): string => txt.replace(' ', '-').toLowerCase()

export const ShareProjectModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const {
    project,
    copyToClipboard,
    shareProject,
    removeShareProject,
  } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const defaults = {
    url: `${formatUrl(project.title)}`,
    password: '',
    canEdit: true,
  }
  const initialState: ShareProjectInterface = project.share
    ? { ...(project.share as ShareProjectInterface) }
    : defaults

  const [state, setState] = useState<ShareProjectInterface>(initialState)

  // update state if project.share state is updated
  useEffect(() => {
    if (project.share) setState({ ...(project.share as ShareProjectInterface) })
  }, [project])

  const handleSubmit = async (
    event: FormEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault()

    if (state.url.length === 0) {
      addAlert({
        type: 'error',
        msg: 'Unique Share Url required.',
      })
      return
    }

    const shareData = { ...state }
    // if password hasn't been altered then don't provide it as we currently have a hashed version
    if (
      shareData.password === (project.share as ShareProjectInterface)?.password
    )
      delete shareData.password

    const apiSuccess = await shareProject(state)
    if (apiSuccess) {
      addAlert({ type: 'success', msg: 'Shared project updated.' })
      copyToClipboard(`https://videonote.app/vn/${state.url}`)
    } else {
      addAlert({ type: 'error', msg: 'An error occurred...' })
    }
  }
  const handleRemoveShare = async (
    event: MouseEvent<HTMLElement>
  ): Promise<void> => {
    event.preventDefault()
    const apiSuccess = await removeShareProject()

    if (apiSuccess) {
      addAlert({ type: 'success', msg: 'Project is now private.' })
      toggleModal()
    } else {
      addAlert({ type: 'error', msg: 'An error occurred...' })
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const id: string = event.target.id
    let data = { url: '' }

    // if 'id' is 'url' then format before adding
    if (id === 'url') {
      data.url = formatUrl(event.target.value)
    } else {
      //  otherwise all other entries currently need no additional formatting
      data[event.target.id] = event.target.value
    }

    const updatedState = { ...state, ...data }
    setState(updatedState)
  }

  const handleCanEditToggle = (): void => {
    setState(current => {
      const updatedState: ShareProjectInterface = {
        ...current,
        canEdit: !state.canEdit,
      }
      return updatedState
    })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Share Project - {project.title}</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title={`Unique share url title`}
            placeholder='Your-unique-link'
            id='url'
            type='text'
            value={state.url}
            onChange={handleChange}
          />
          <ModalInput
            title='Password protect?'
            placeholder='Empty for no password'
            id='password'
            type='password'
            value={state.password}
            onChange={handleChange}
          />

          <div className='relative mt-2'>
            <ToggleInput
              title={`Users can edit notes${state.canEdit ? '.' : '?'}`}
              state={state.canEdit}
              onClick={handleCanEditToggle}
            />
          </div>

          {project.share && (
            <>
              <div>
                <p>Your project share link is:</p>
                <motion.a
                  href={`https://videonote.app/vn/${
                    (project.share as ShareProjectInterface).url
                  }`}
                  target='_blank'
                  whileHover={{ scale: 0.95 }}
                  onClick={() =>
                    copyToClipboard(
                      `https://videonote.app/vn/${
                        (project.share as ShareProjectInterface).url
                      }`
                    )
                  }
                  className='italic cursor-pointer top-8 text-themeAccent'
                >
                  videonote.app/vn/
                  {(project.share as ShareProjectInterface).url}
                </motion.a>
              </div>
            </>
          )}

          {project.share && (
            <div className='flex items-center'>
              <ModalPrimaryBtn
                handleClick={handleRemoveShare}
                type='button'
                color='bg-red-400'
              >
                <span className='italic'>Remove Share Access</span>
              </ModalPrimaryBtn>
            </div>
          )}

          <ModalPrimaryBtn handleClick={handleSubmit}>
            {project.share ? 'Update' : 'Share'}
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
