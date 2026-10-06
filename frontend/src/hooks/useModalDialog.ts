import { useEffect, useRef } from 'react'

export function useModalDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closingProgrammatically = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      closingProgrammatically.current = true
      dialog.close()
    }
  }, [])

  function handleClose() {
    if (closingProgrammatically.current) {
      closingProgrammatically.current = false
      return
    }
    onClose()
  }

  return { dialogRef, handleClose }
}
