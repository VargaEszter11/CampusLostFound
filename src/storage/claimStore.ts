import type { Claim, ClaimStatus, Handover } from '../domain/types'
import { newHandoverCode } from '../domain/types'
import { closeReport, getReport } from './reportStore'
import { isSameUser } from './authStore'

const CLAIMS_KEY = 'lostfound.claims'
const HANDOVERS_KEY = 'lostfound.handovers'

function readClaims(): Claim[] {
  const raw = localStorage.getItem(CLAIMS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Claim[]
  } catch {
    return []
  }
}

function writeClaims(list: Claim[]): void {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(list))
}

function readHandovers(): Handover[] {
  const raw = localStorage.getItem(HANDOVERS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Handover[]
  } catch {
    return []
  }
}

function writeHandovers(list: Handover[]): void {
  localStorage.setItem(HANDOVERS_KEY, JSON.stringify(list))
}

export function getClaimsForReport(reportId: string): Claim[] {
  return readClaims().filter((c) => c.reportId === reportId)
}

export function getClaimsByClaimant(claimantName: string): Claim[] {
  return readClaims().filter((c) => isSameUser(c.claimantName, claimantName))
}

export interface NewClaimInput {
  reportId: string
  claimantName: string
  claimantContact: string
  reason?: string
}

export function createClaim(input: NewClaimInput): Claim {
  const report = getReport(input.reportId)
  if (!report) throw new Error('Report not found')
  if (report.status !== 'OPEN') throw new Error('This item was already handed over')
  if (getHandoverForReport(input.reportId)) throw new Error('This report already has an approved claim')

  const claim: Claim = {
    id: crypto.randomUUID(),
    reportId: input.reportId,
    claimantName: input.claimantName,
    claimantContact: input.claimantContact,
    reason: input.reason || undefined,
    status: 'PENDING',
  }
  const list = readClaims()
  list.push(claim)
  writeClaims(list)
  return claim
}

export function getHandoverForReport(reportId: string): Handover | undefined {
  const approvedClaim = getClaimsForReport(reportId).find((c) => c.status === 'APPROVED')
  if (!approvedClaim) return undefined
  return readHandovers().find((h) => h.claimId === approvedClaim.id)
}

export function approveClaim(claimId: string): Handover {
  const claims = readClaims()
  const claim = claims.find((c) => c.id === claimId)
  if (!claim) throw new Error('Claim not found')
  if (claim.status !== 'PENDING') throw new Error('This claim was already resolved')

  const report = getReport(claim.reportId)
  if (!report) throw new Error('Report not found')
  if (report.status !== 'OPEN') throw new Error('This item was already handed over')
  if (getHandoverForReport(claim.reportId)) throw new Error('This report already has an approved claim')

  const updatedClaims = claims.map((c): Claim => {
    if (c.id === claimId) return { ...c, status: 'APPROVED' as ClaimStatus }
    if (c.reportId === claim.reportId && c.status === 'PENDING') return { ...c, status: 'REJECTED' as ClaimStatus }
    return c
  })
  writeClaims(updatedClaims)

  // Approval only reveals contact info and issues a code; the report stays open until confirmHandover closes it.
  const handover: Handover = {
    id: crypto.randomUUID(),
    claimId,
    handoverCode: newHandoverCode(),
    confirmed: false,
  }
  const handovers = readHandovers()
  handovers.push(handover)
  writeHandovers(handovers)
  return handover
}

export function confirmHandover(reportId: string): Handover {
  const handover = getHandoverForReport(reportId)
  if (!handover) throw new Error('No approved claim to hand over')
  if (handover.confirmed) throw new Error('This item was already handed over')

  const updated = readHandovers().map((h): Handover =>
    h.id === handover.id ? { ...h, confirmed: true, date: new Date().toISOString() } : h,
  )
  writeHandovers(updated)

  // Only now is the item actually marked claimed/found, so it can't be claimed again.
  closeReport(reportId)

  return { ...handover, confirmed: true, date: new Date().toISOString() }
}

export function rejectClaim(claimId: string): void {
  const updated = readClaims().map((c) => (c.id === claimId ? { ...c, status: 'REJECTED' as ClaimStatus } : c))
  writeClaims(updated)
}
