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
        <span className='px-4 py-2 text-sm transition-colors duration-200 ease-in-out border rounded-sm cursor-pointer text-themeText hover:text-themeBg hover:bg-themeText'>
          Use Local Video
        </span>
      </label>
    </div>
  )
}
