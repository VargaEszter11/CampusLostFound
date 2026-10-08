export type ItemId = string & { readonly __brand: 'ItemId' }
export type HandoverCode = string & { readonly __brand: 'HandoverCode' }

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
  reporterContact: string | null
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

export interface HandoverListItem extends Handover {
  reportId: string
  itemName: string
  reportType: ReportType
  reporterName: string
  claimantName: string
  claimantContact: string
  reporterContact: string
  yourRole: 'REPORTER' | 'CLAIMANT'
}

export type NotificationType =
  | 'CLAIM_CREATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'HANDOVER_CONFIRMED'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  reportId: string | null
  claimId: string | null
  handoverId: string | null
  read: boolean
  createdAt: string
}

export interface AdminHandoverSummary {
  id: string
  claimantName: string
  claimantEmail: string
  claimantContact: string
  handoverCode: HandoverCode
  confirmed: boolean
  confirmedAt: string | null
}

export interface AdminReport extends Omit<Report, 'reporterContact'> {
  reporterEmail: string
  reporterContact: string
  claimCount: number
  pendingClaimCount: number
  handover: AdminHandoverSummary | null
}
