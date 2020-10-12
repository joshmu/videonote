import React from 'react'
import { saveAs } from 'file-saver'
import { BsCloudDownload as DownloadIcon } from 'react-icons/bs'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { format } from 'date-fns'
import { formatDuration } from '@/utils/clientHelpers'

export default function ExportNotes() {
  const { project } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  // detect if we can offer a download function for the client's browser
  const isFileSaverSupported = !!new Blob()
  if (!isFileSaverSupported) {
    console.error('file-save download function not available for your browser.')
    return <div></div>
  }

  function handleClick() {
    addAlert({ type: 'info', msg: `Exporting Notes` })
    console.log('export notes')
    const txtFile = createTxtFile()

    // file-saver
    const blob = new Blob([txtFile], {
      type: 'text/plain;charset=utf-8',
    })
    saveAs(blob, `VIDEONOTE - ${project.title}.txt`)
  }

  function createTxtFile() {
    let txtContent = `VIDEONOTE\n\n`
    txtContent += `${printDate()}\n`
    txtContent += `Project: ${project.title.toUpperCase()}\n`
    txtContent += `---\n\n`
    // content
    txtContent += project.todos
      .map(
        msg =>
          `- [${msg.done ? 'x' : ' '}] ${msg.msg} (${formatDuration(msg.time)})`
      )
      .join('\n')

    return txtContent
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

const printDate = date => {
  if (!date) date = new Date()
  return format(date, 'do MM y')
}
