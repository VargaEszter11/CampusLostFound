import type { Claim, Report } from './types'

export function isSameUser(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function isOwnerOf(report: Report, userName: string): boolean {
  return isSameUser(userName, report.reporterName)
}

export function isReportClosed(report: Report): boolean {
  return report.status === 'CLOSED'
}

export function isPending(claim: Claim): boolean {
  return claim.status === 'PENDING'
}

export function isApproved(claim: Claim): boolean {
  return claim.status === 'APPROVED'
}

export function findApprovedClaim(claims: Claim[]): Claim | undefined {
  return claims.find(isApproved)
}
