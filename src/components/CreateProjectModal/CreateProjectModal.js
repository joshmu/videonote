import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import LocalVideoLoader from '../LocalVideoLoader'
import Animate from '../shared/Animate'

// todo: project title => id
// todo: lock project title ? or use hidden random id?
// todo: video src
// todo: update
// todo: onChange handle all inputs

export default function CreateProjectModal({ toggle: toggleModal }) {
  const { settings, updateSettings, createProject } = useGlobalContext()

  const [project, setProject] = useState({
    title: '',
    src: '',
  })

  const handleCreate = e => {
    e.preventDefault()
    if (project.title.length === 0 || project.src.length === 0) return

    createProject(project)
    toggleModal()
  }

  const handleChange = e => {
    if (e.target.id === 'offset')
      return updateSettings({ playOffset: Number(e.target.value) })
    setProject({ ...project, [e.target.id]: e.target.value })
  }

  const handleVideoSrc = url => {
    console.log(url)
    if (typeof url !== 'string' || url.length === 0) return
    setProject({ ...project, src: url })
  }

  return (
    <Animate motionKey='createProjectModal'>
      <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
        <div className='max-w-4xl p-6 mx-auto bg-white rounded-sm shadow-md'>
          <h2 className='text-lg font-semibold text-gray-700 capitalize'>
            Create Project
          </h2>

          <form>
            <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
              <div>
                <label className='text-gray-700' htmlFor='title'>
                  Project Title
                </label>
                <input
                  id='title'
                  type='text'
                  className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                  value={project.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className='text-gray-700' htmlFor='src'>
                  Video Source
                </label>
                <input
                  id='src'
                  type='text'
                  placeholder='Dropbox, Vimeo, Youtube Url...'
                  className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                  value={project.src}
                  onChange={handleChange}
                />
                <LocalVideoLoader handleVideoSrc={handleVideoSrc} />
              </div>
            </div>

            <div className='flex justify-end mt-4'>
              <button
                onClick={handleCreate}
                className='px-4 py-2 text-gray-200 bg-gray-800 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700'
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </Animate>
  )
}
