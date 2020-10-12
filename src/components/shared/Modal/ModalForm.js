const ModalForm = ({ children }) => (
  <form>
    <div className='grid grid-cols-1 gap-6 mt-2 sm:grid-cols-2'>{children}</div>
    {/* <div className='grid grid-cols-1 gap-6 mt-4'>{children}</div> */}
  </form>
)

export default ModalForm
