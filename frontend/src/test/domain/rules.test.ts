import { describe, expect, it } from 'vitest'
import { findApprovedClaim, isApproved, isOwnerOf, isPending, isReportClosed, isSameUser } from '../../domain/rules'
import type { Claim, ItemId, Report } from '../../domain/types'

function report(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    type: 'FOUND',
    item: { id: 'i1' as ItemId, name: 'Black wallet' },
    location: 'Main hall',
    date: '2026-10-01',
    reporterName: 'Anna Kiss',
    reporterContact: 'anna@example.com',
    status: 'OPEN',
    createdAt: '2026-10-01T00:00:00Z',
    ...overrides,
  }
}

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'c1',
    reportId: 'r1',
    claimantName: 'Bence Toth',
    claimantContact: 'bence@example.com',
    status: 'PENDING',
    ...overrides,
  }
}

describe('isSameUser', () => {
  it('matches regardless of case and surrounding whitespace', () => {
    expect(isSameUser(' Anna Kiss ', 'anna kiss')).toBe(true)
  })

  it('does not match different names', () => {
    expect(isSameUser('Anna Kiss', 'Bence Toth')).toBe(false)
  })
})

describe('isOwnerOf', () => {
  it('is true when the user is the reporter', () => {
    expect(isOwnerOf(report({ reporterName: 'Anna Kiss' }), 'Anna Kiss')).toBe(true)
  })

  it('is false for a different user', () => {
    expect(isOwnerOf(report({ reporterName: 'Anna Kiss' }), 'Bence Toth')).toBe(false)
  })
})

describe('isReportClosed', () => {
  it('is true only when status is CLOSED', () => {
    expect(isReportClosed(report({ status: 'CLOSED' }))).toBe(true)
    expect(isReportClosed(report({ status: 'OPEN' }))).toBe(false)
  })
})

describe('isPending / isApproved', () => {
  it('reflect the claim status', () => {
    expect(isPending(claim({ status: 'PENDING' }))).toBe(true)
    expect(isPending(claim({ status: 'APPROVED' }))).toBe(false)
    expect(isApproved(claim({ status: 'APPROVED' }))).toBe(true)
    expect(isApproved(claim({ status: 'REJECTED' }))).toBe(false)
  })
})

describe('findApprovedClaim', () => {
  it('returns the approved claim among several', () => {
    const approved = claim({ id: 'c2', status: 'APPROVED' })
    const claims = [claim({ id: 'c1', status: 'REJECTED' }), approved, claim({ id: 'c3', status: 'PENDING' })]

    expect(findApprovedClaim(claims)).toBe(approved)
  })

  it('returns undefined when none are approved', () => {
    const claims = [claim({ status: 'PENDING' }), claim({ id: 'c2', status: 'REJECTED' })]

    expect(findApprovedClaim(claims)).toBeUndefined()
  })
})
