/**
 * @path /src/components/Modals/CurrentProjectModal/ExportNotes/ExportNotes.tsx
 *
 * @project videonote
 * @file ExportNotes.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 9th October 2020
 * @modified Wednesday, 25th November 2020 1:29:12 pm
 * @copyright © 2020 - 2020 MU
 */

import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { BsCloudDownload as DownloadIcon } from 'react-icons/bs'

import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { ProjectInterface } from '@/shared/types'
import { formatDuration } from '@/utils/clientHelpers'

export const ExportNotes = ({
  dynamicLabel = true,
  className = '',
}: {
  dynamicLabel?: boolean
  className?: string
}) => {
  const { project } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [showLabel, setShowLabel] = useState<boolean>(false)
  const [isFileSaverSupported, setIsFileSaverSupported] = useState<boolean>(
    true
  )

  useEffect(() => {
    // detect if we can offer a download function for the client's browser
    const supported = !!new Blob()
    setIsFileSaverSupported(supported)
    if (!supported) {
      setIsFileSaverSupported(false)
      console.error(
        'file-save download function not available for your browser.'
      )
    }
  }, [])

  const handleExport = (): void => {
    addAlert({ type: 'info', msg: `Exporting Notes` })
    console.log('export notes')
    const txtFile = createTxtFile(project)

    // file-saver
    const blob = new Blob([txtFile], {
      type: 'text/plain;charset=utf-8',
    })
    saveAs(blob, `VIDEONOTE - ${project.title}.txt`)
  }

  const handleEnter = (): void => {
    if (!dynamicLabel) return
    setShowLabel(true)
  }
  const handleExit = (): void => {
    if (!dynamicLabel) return
    setShowLabel(false)
  }

  return isFileSaverSupported ? (
    <div
      onClick={handleExport}
      onMouseEnter={handleEnter}
      onMouseLeave={handleExit}
      className={`flex items-center justify-start cursor-pointer text-sm ${className}`}
    >
      <DownloadIcon className='w-4 h-4 opacity-50' />
      <AnimatePresence>
        {(!dynamicLabel || showLabel) && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='ml-2'
          >
            Export Notes
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  ) : null
}

const createTxtFile = (project: ProjectInterface): string => {
  if (project?.notes.length === 0) return

  let txtContent = `VIDEONOTE\n\n`
  txtContent += `${project.title.toUpperCase()}\n`
  txtContent += `${printDate()}\n`
  txtContent += `---\n\n`
  // content
  txtContent += project.notes
    .map(
      msg =>
        `${msg.done ? 'x' : '-'} ${formatDuration(msg.time)} ${msg.content}`
    )
    .join('\n')

  return txtContent
}

const printDate = (date: Date = null): string => {
  if (!date) date = new Date()
  return format(date, 'dd/MM/y')
}
