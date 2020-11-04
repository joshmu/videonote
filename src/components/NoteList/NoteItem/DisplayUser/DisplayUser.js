const DisplayUser = ({ noteUser, currentUser }) => {
  let displayName = 'guest'

  // if we have a noteUser present who is not the admin
  if (noteUser) {
    // get the note user id
    const noteUserId = typeof noteUser === 'string' ? noteUser : noteUser._id
    // don't display name if the note is created by the current user
    if (noteUserId === currentUser?._id) return <></>

    // else decide on display name
    displayName = noteUser.username ? noteUser.username : noteUser.email
  }

  return (
    <div className='absolute bottom-0 right-1 text-themeText2'>
      <div className='text-xs'>{displayName.toLowerCase()}</div>
    </div>
  )
}

export default DisplayUser
