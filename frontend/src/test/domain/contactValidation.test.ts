import { describe, expect, it } from 'vitest'
import { contactError, isValidEmail, isValidPhone } from '../../domain/contactValidation'

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('anna@example.com')).toBe(true)
  })

  it('rejects a string with no @', () => {
    expect(isValidEmail('anna.example.com')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts a phone number with a country code and at least 7 digits', () => {
    expect(isValidPhone('+36 30 123 4567')).toBe(true)
  })

  it('rejects fewer than 7 digits', () => {
    expect(isValidPhone('123456')).toBe(false)
  })

  it('rejects letters', () => {
    expect(isValidPhone('call-anna-now')).toBe(false)
  })
})

describe('contactError', () => {
  it('requires a value', () => {
    expect(contactError('   ')).toBe('Contact is required')
  })

  it('accepts a valid email', () => {
    expect(contactError('anna@example.com')).toBeUndefined()
  })

  it('accepts a valid phone number', () => {
    expect(contactError('+36301234567')).toBeUndefined()
  })

  it('rejects something that is neither', () => {
    expect(contactError('not-a-contact')).toBe('Enter a valid email address or phone number')
  })
})
