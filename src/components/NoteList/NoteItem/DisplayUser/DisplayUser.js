const DisplayUser = ({ noteUser, currentUser }) => {
  let displayName = 'guest'

  // if we have a noteUser present
  if (noteUser) {
    displayName = noteUser.username ? noteUser.username : noteUser.email
  }

  // don't display name if the note is created by the current user
  if (noteUser?._id === currentUser?._id) return <></>

  return (
    <div className='absolute bottom-0 right-1 text-themeText2'>
      <div className='text-xs'>{displayName.toLowerCase()}</div>
    </div>
  )
}

export default DisplayUser
