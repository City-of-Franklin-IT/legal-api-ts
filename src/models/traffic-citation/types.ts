// Types
import { Sequelize, ModelStatic, Model } from "sequelize"
import { BaseInterface } from '../types'

export const REQUEST_TYPES = ['DRIVING_SCHOOL', 'CORRECTABLE'] as const
export type RequestType = typeof REQUEST_TYPES[number]

export const OFFENSE_TYPES = ['WINDOW_TINTED', 'REGISTRATION', 'DRIVERS_LICENSE', 'LIGHT_LAW', 'FINANCIAL_RESPONSIBILITY', 'HANDICAP_PARKING', 'DRIVING_SCHOOL'] as const
export type OffenseType = typeof OFFENSE_TYPES[number]

export const OUTCOMES = ['SUBMITTED', 'APPROVED', 'NOT_APPROVED', 'REDUCED', 'MORE_INFO', 'NOT_APPROVED_HISTORY', 'NOT_APPROVED_CHARGE'] as const
export type Outcome = typeof OUTCOMES[number]

// What the defendant is told about. A row is written each time staff answer "Ready to notify defendant?":
// NOTIFIED when they say yes (the email phase sends it), PENDING when they save without notifying.
// The latest row for a request decides whether a notification is still owed.
export const NOTIFICATION_KINDS = ['MORE_INFO', 'COMPLETED', 'DRIVING_SCHOOL'] as const
export type NotificationKind = typeof NOTIFICATION_KINDS[number]

export const NOTIFICATION_STATUSES = ['PENDING', 'NOTIFIED'] as const
export type NotificationStatus = typeof NOTIFICATION_STATUSES[number]

export interface RequesterInterface {
  id: number
  requestType: RequestType
  citationNumber: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string | null
  licenseState: string | null
  dob: string | null
  dueDate: string | null
  uuid: string
  createdAt: Date
  updatedAt: Date
}

export interface OffenseInterface {
  id: number
  parentId: string
  offenseType: OffenseType
  outcome: Outcome
  amount: number | null
  staffNote: string | null
  uuid: string
  createdAt: Date
  updatedAt: Date
  updatedBy: string | null
}

export interface NotificationInterface extends Omit<BaseInterface, 'updatedBy' | 'updatedAt'> {
  id: number
  parentId: string
  kind: NotificationKind
  status: NotificationStatus
}

export interface CorrespondenceInterface extends Omit<BaseInterface, 'updatedBy' | 'updatedAt'> {
  id: number
  parentId: string
  offenseUuid: string | null
  message: string
}

// Append-only history of staff decisions; parentId is the offense uuid
export interface ApprovalInterface extends Omit<BaseInterface, 'updatedBy' | 'updatedAt'> {
  id: number
  parentId: string
  outcome: Outcome
  amount: number | null
  comment: string | null
}

export interface AttachmentInterface extends BaseInterface {
  id: number
  parentId: string
  offenseUuid: string | null
  fileName: string
  contentType: string
  fileSize: number
  attachment: Buffer
  caption: string | null
  isInternal: boolean | null
}

export type RequesterCreateInterface = Pick<RequesterInterface, 'requestType' | 'citationNumber' | 'firstName' | 'lastName' | 'email' | 'phone' | 'licenseNumber' | 'licenseState' | 'dob'>

export interface DatabaseInterface {
  sequelize: Sequelize
  Requester: ModelStatic<Model<RequesterInterface>>
  Offense: ModelStatic<Model<OffenseInterface>>
  Correspondence: ModelStatic<Model<CorrespondenceInterface>>
  Approval: ModelStatic<Model<ApprovalInterface>>
  Notification: ModelStatic<Model<NotificationInterface>>
  Attachment: ModelStatic<Model<AttachmentInterface>>
  [key: string]: ModelStatic<Model<any, any>> | Sequelize
}

export interface ModelWithAssociate extends ModelStatic<Model> {
  associate: (db: DatabaseInterface) => void
}
