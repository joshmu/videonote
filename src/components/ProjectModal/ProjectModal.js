import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import Animate from '../shared/Animate'

// todo: project title => id
// todo: lock project title ? or use hidden random id?
// todo: video src
// todo: update
// todo: onChange handle all inputs

export default function ProjectModal() {
  const {
    modalOpen,
    toggleModalOpen,
    settings,
    updateSettings,
    createProject,
  } = useGlobalContext()

  const [project, setProject] = useState({
    title: '',
    src: '',
  })

  const handleCreate = e => {
    e.preventDefault()
    if (project.title.length > 0 && project.src) createProject(project)
    toggleModalOpen('project')
  }

  const handleChange = e => {
    if (e.target.id === 'offset')
      return updateSettings({ playOffset: Number(e.target.value) })
    setProject({ ...project, [e.target.id]: e.target.value })
  }

  return (
    <>
      {modalOpen === 'create' && (
        <Animate motionKey='projectModal'>
          <div className='absolute top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50'></div>
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
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                      value={project.src}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className='text-gray-700' htmlFor='offset'>
                      Playback Offset (Secs)
                    </label>
                    <input
                      id='offset'
                      type='number'
                      className='block w-full px-4 py-2 mt-2 text-gray-800 bg-white border border-gray-300 rounded-sm focus:border-gray-500 focus:outline-none focus:shadow-none'
                      value={settings.playOffset}
                      onChange={handleChange}
                    />
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
      )}
    </>
  )
}
