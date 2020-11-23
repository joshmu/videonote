/**
 * @path /src/components/Modals/CurrentProjectModal/ExportNotes/ExportNotes.tsx
 *
 * @project videonote
 * @file ExportNotes.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Friday, 9th October 2020
 * @modified Monday, 23rd November 2020 11:35:45 am
 * @copyright © 2020 - 2020 MU
 */

import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import React from 'react'
import { BsCloudDownload as DownloadIcon } from 'react-icons/bs'

import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { formatDuration } from '@/utils/clientHelpers'

export const ExportNotes = () => {
  const { project } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  // detect if we can offer a download function for the client's browser
  const isFileSaverSupported = !!new Blob()
  if (!isFileSaverSupported) {
    console.error('file-save download function not available for your browser.')
    return <div></div>
  }

  const createTxtFile = (): string => {
    if (project?.notes.length === 0) return

    let txtContent = `VIDEONOTE\n\n`
    txtContent += `${printDate()}\n`
    txtContent += `Project: ${project.title.toUpperCase()}\n`
    txtContent += `---\n\n`
    // content
    txtContent += project.notes
      .map(
        msg =>
          `${msg.done ? 'x' : '-'} [${formatDuration(msg.time)}] ${msg.content}`
      )
      .join('\n')

    return txtContent
  }

  const handleClick = (): void => {
    addAlert({ type: 'info', msg: `Exporting Notes` })
    console.log('export notes')
    const txtFile = createTxtFile()

    // file-saver
    const blob = new Blob([txtFile], {
      type: 'text/plain;charset=utf-8',
    })
    saveAs(blob, `VIDEONOTE - ${project.title}.txt`)
  }

  return (
    <div
      onClick={handleClick}
      className='flex items-center justify-start cursor-pointer'
    >
      <DownloadIcon />
      <span className='ml-2 text-md'>Export Notes</span>
    </div>
  )
}

const printDate = (date: Date = null): string => {
  if (!date) date = new Date()
  return format(date, 'do MM y')
}
