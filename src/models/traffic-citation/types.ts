// Types
import { Sequelize, ModelStatic, Model } from "sequelize"
import { BaseInterface } from '../types'

export interface RequesterInterface {
  id: number
  citationNumber: string | null
  firstName: string
  lastName: string
  email: string
  licenseNumber: string
  licenseState: string
  uuid: string
  createdAt: Date
  updatedAt: Date
}

export interface CorrespondenceInterface extends Omit<BaseInterface, 'updatedBy' | 'updatedAt'> {
  id: number
  parentId: string
  message: string
}

export interface ApprovalInterface extends BaseInterface {
  id: number
  parentId: string
  approval: boolean | null
  comment: string | null
}

export interface AttachmentInterface extends BaseInterface {
  id: number
  parentId: string
  attachment: Buffer
  caption: string | null
  isInternal: boolean | null
}

export type RequesterCreateInterface = Pick<RequesterInterface, 'citationNumber' | 'firstName' | 'lastName' | 'email' | 'licenseNumber' | 'licenseState'>

export interface DatabaseInterface {
  sequelize: Sequelize
  Requester: ModelStatic<Model<RequesterInterface>>
  Correspondence: ModelStatic<Model<CorrespondenceInterface>>
  Approval: ModelStatic<Model<ApprovalInterface>>
  Attachment: ModelStatic<Model<AttachmentInterface>>
  [key: string]: ModelStatic<Model<any, any>> | Sequelize
}

export interface ModelWithAssociate extends ModelStatic<Model> {
  associate: (db: DatabaseInterface) => void
}
