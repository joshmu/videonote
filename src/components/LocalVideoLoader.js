export default function LocalVideoLoader({ handleVideoSrc }) {
  const handleFileInput = e => {
    const file = e.target.files[0]
    const url = URL.createObjectURL(file)
    handleVideoSrc(url)
  }

  return (
    <div className='mt-3'>
      <label htmlFor='videoFile'>
        <input
          className='hidden'
          id='videoFile'
          name='videoFile'
          type='file'
          onChange={handleFileInput}
        />
        <span className='px-6 py-3 text-white transition-colors duration-200 ease-in-out rounded-sm cursor-pointer hover:bg-highlight-700 hover:bg-opacity-25'>
          Use Local Video
        </span>
      </label>
    </div>
  )
}
