const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  const digitCount = (trimmed.match(/\d/g) ?? []).length
  return digitCount >= 7 && PHONE_REGEX.test(trimmed)
}

export function contactError(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return 'Contact is required'
  if (isValidEmail(trimmed) || isValidPhone(trimmed)) return undefined
  return 'Enter a valid email address or phone number'
}
