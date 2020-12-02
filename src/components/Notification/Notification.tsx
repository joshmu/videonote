/**
 * @path /src/components/Notification/Notification.tsx
 *
 * @project videonote
 * @file Notification.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 25th September 2020
 * @modified Wednesday, 2nd December 2020 3:38:15 pm
 * @copyright © 2020 - 2020 MU
 */

import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode } from 'react'
import {
  AiOutlineInfoCircle as InfoIcon,
  AiOutlineVideoCamera as ProjectIcon,
  AiOutlineCheck as SuccessIcon,
  AiOutlineWarning as WarningIcon,
} from 'react-icons/ai'
import { VscError as ErrorIcon } from 'react-icons/vsc'

import {
  AlertInterface,
  useNotificationContext,
} from '@/context/notificationContext'
import { CancelBtn } from '@/shared/CancelBtn/CancelBtn'

export const Notification = () => {
  const { alerts, removeAlert } = useNotificationContext()

  const closeAlert = (id: string): void => {
    removeAlert(id)
  }

  return (
    <div className='absolute top-0 left-0 z-50 w-full max-w-md'>
      <AnimatePresence>
        {alerts.length > 0 &&
          alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{
                ease: [0.6, 0.05, -0.01, 0.9],
              }}
              className='p-2'
            >
              <Alert
                type={alert.type}
                msg={alert.msg}
                cancel={() => closeAlert(alert.id)}
              />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}

interface AlertProps extends AlertInterface {
  cancel: () => void
}

const Alert = ({ type, msg, cancel }: AlertProps) => (
  <div className='relative flex w-full max-w-md mx-auto overflow-hidden border rounded-sm shadow-md bg-themeBg border-themeText2'>
    <CancelBtn cancel={cancel} />
    {type === 'project' && (
      <div className='flex items-center justify-center w-12 bg-themeAccent'>
        <ProjectIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'success' && (
      <div className='flex items-center justify-center w-12 bg-green-400'>
        <SuccessIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'info' && (
      <div className='flex items-center justify-center w-12 bg-blue-400'>
        <InfoIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'warning' && (
      <div className='flex items-center justify-center w-12 bg-yellow-400'>
        <WarningIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'error' && (
      <div className='flex items-center justify-center w-12 bg-red-400'>
        <ErrorIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}

    <div className='px-4 py-2 -mx-3'>
      <div className='mx-3'>
        {type === 'project' && (
          <>
            <AlertTitle>Project</AlertTitle>
            <AlertMsg>{msg}</AlertMsg>
          </>
        )}
        {type === 'success' && (
          <>
            <AlertTitle>Success</AlertTitle>
            <AlertMsg>{msg}</AlertMsg>
          </>
        )}
        {type === 'info' && (
          <>
            <AlertTitle>Info</AlertTitle>
            <AlertMsg>{msg}</AlertMsg>
          </>
        )}
        {type === 'warning' && (
          <>
            <AlertTitle>Warning</AlertTitle>
            <AlertMsg>{msg}</AlertMsg>
          </>
        )}
        {type === 'error' && (
          <>
            <AlertTitle>Error</AlertTitle>
            <AlertMsg>{msg}</AlertMsg>
          </>
        )}
      </div>
    </div>
  </div>
)

const AlertTitle = ({ children }: { children: ReactNode }) => (
  <span className='font-semibold text-themeAccent'>{children}</span>
)

const AlertMsg = ({ children }: { children: ReactNode }) => (
  <p className='text-sm text-themeText'>{children}</p>
)
