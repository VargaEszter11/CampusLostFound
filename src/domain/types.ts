export type ItemId = string & { readonly __brand: 'ItemId' }
export type HandoverCode = string & { readonly __brand: 'HandoverCode' }

export function newItemId(): ItemId {
  return crypto.randomUUID() as ItemId
}

export function newHandoverCode(): HandoverCode {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code as HandoverCode
}

export type ReportType = 'LOST' | 'FOUND'
export type ReportStatus = 'OPEN' | 'CLOSED'

export interface Item {
  id: ItemId
  name: string
  description?: string
  category?: string
}

export interface Report {
  id: string
  type: ReportType
  item: Item
  location: string
  date: string
  reporterName: string
  reporterContact: string
  status: ReportStatus
  createdAt: string
}

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Claim {
  id: string
  reportId: string
  claimantName: string
  claimantContact: string
  reason?: string
  status: ClaimStatus
}

export interface Handover {
  id: string
  claimId: string
  handoverCode: HandoverCode
  date?: string
  confirmed: boolean
}
