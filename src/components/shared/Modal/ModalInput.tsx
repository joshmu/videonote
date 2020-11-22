/**
 * @path /src/components/shared/Modal/ModalInput.tsx
 *
 * @project videonote
 * @file ModalInput.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 12th October 2020
 * @modified Sunday, 22nd November 2020 5:36:52 pm
 * @copyright © 2020 - 2020 MU
 */

interface ModalInputInterface
  extends React.HTMLAttributes<HTMLDivElement | HTMLInputElement> {
  title?: string
  id?: string
  type?: string
  value: string | number
  placeholder?: string
  autoFocus?: boolean
  min?: string | number
  max?: string | number
  step?: string | number
  props?: { [key: string]: any }
}

export const ModalInput = ({
  title = '',
  id = '',
  type = 'text',
  value,
  placeholder = '',
  autoFocus = false,
  min = undefined,
  max = undefined,
  step = undefined,
  ...props
}: ModalInputInterface) => {
  return (
    <div>
      <label className='text-themeText' htmlFor={id}>
        {title}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`block w-full ${
          type === 'range' ? 'px-0' : 'px-4'
        } py-2 mt-2 border rounded-sm border-themeText2 text-themeText bg-themeBg focus:border-themeText focus:outline-none`}
        {...props}
      />
    </div>
  )
}
