import type { Claim, ClaimStatus, Handover, HandoverCode } from '../domain/types'
import { apiUrl, throwIfNotOk } from '../api/http'

export interface NewClaimInput {
  reportId: string
  claimantName: string
  claimantContact: string
  reason?: string
}

interface ApiClaim {
  id: string
  reportId: string
  claimantName: string
  claimantContact: string
  reason: string | null
  status: ClaimStatus
}

interface ApiHandover {
  id: string
  claimId: string
  handoverCode: string
  confirmed: boolean
  date: string | null
}

function mapClaim(dto: ApiClaim): Claim {
  return {
    id: dto.id,
    reportId: dto.reportId,
    claimantName: dto.claimantName,
    claimantContact: dto.claimantContact,
    reason: dto.reason ?? undefined,
    status: dto.status,
  }
}

function mapHandover(dto: ApiHandover): Handover {
  return {
    id: dto.id,
    claimId: dto.claimId,
    handoverCode: dto.handoverCode as HandoverCode,
    confirmed: dto.confirmed,
    date: dto.date ?? undefined,
  }
}

export async function getClaimsForReport(reportId: string): Promise<Claim[]> {
  const res = await fetch(apiUrl(`/api/reports/${reportId}/claims`))
  await throwIfNotOk(res)
  const data = (await res.json()) as ApiClaim[]
  return data.map(mapClaim)
}

export async function getClaimsByClaimant(claimantName: string): Promise<Claim[]> {
  const params = new URLSearchParams({ claimantName })
  const res = await fetch(apiUrl(`/api/claims?${params}`))
  await throwIfNotOk(res)
  const data = (await res.json()) as ApiClaim[]
  return data.map(mapClaim)
}

export async function getHandoverForReport(reportId: string): Promise<Handover | undefined> {
  const res = await fetch(apiUrl(`/api/reports/${reportId}/handover`))
  if (res.status === 404) return undefined
  await throwIfNotOk(res)
  return mapHandover((await res.json()) as ApiHandover)
}

export async function createClaim(input: NewClaimInput): Promise<Claim> {
  const res = await fetch(apiUrl('/api/claims'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId: input.reportId,
      claimantName: input.claimantName,
      claimantContact: input.claimantContact,
      reason: input.reason,
    }),
  })
  await throwIfNotOk(res)
  return mapClaim((await res.json()) as ApiClaim)
}

export async function approveClaim(claimId: string): Promise<Handover> {
  const res = await fetch(apiUrl(`/api/claims/${claimId}/approve`), { method: 'POST' })
  await throwIfNotOk(res)
  return mapHandover((await res.json()) as ApiHandover)
}

export async function rejectClaim(claimId: string): Promise<Claim> {
  const res = await fetch(apiUrl(`/api/claims/${claimId}/reject`), { method: 'POST' })
  await throwIfNotOk(res)
  return mapClaim((await res.json()) as ApiClaim)
}

export async function confirmHandover(reportId: string): Promise<Handover> {
  const res = await fetch(apiUrl(`/api/reports/${reportId}/handover/confirm`), { method: 'POST' })
  await throwIfNotOk(res)
  return mapHandover((await res.json()) as ApiHandover)
}
