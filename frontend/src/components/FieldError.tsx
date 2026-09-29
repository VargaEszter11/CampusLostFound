interface Props {
  readonly message?: string
}

export function FieldError({ message }: Props) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-400">{message}</p>
}
