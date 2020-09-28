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
        <span className='px-6 py-3 transition-colors duration-200 ease-in-out rounded-sm cursor-pointer bg-highlight-500 text-highlight-100 hover:bg-highlight-600'>
          Load Local Video
        </span>
      </label>
    </div>
  )
}
