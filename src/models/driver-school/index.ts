// Types
import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize'
import { ConfigInterface, DBPathInterface } from '../types'
import * as Types from './types'

// Models
import RequesterModel from './Requester'
import CorrespondenceModel from './Correspondence'
import ApprovalModel from './Approval'
import AttachmentModel from './Attachment'

const env = process.env.NODE_ENV || 'development'

import config from '../../config/config'

const cfg = config as ConfigInterface

const db = {
  sequelize: {} as Sequelize,
  Requester: {} as ModelStatic<Model<Types.RequesterInterface>>,
  Correspondence: {} as ModelStatic<Model<Types.CorrespondenceInterface>>,
  Approval: {} as ModelStatic<Model<Types.ApprovalInterface>>,
  Attachment: {} as ModelStatic<Model<Types.AttachmentInterface>>
} as Types.DatabaseInterface

const dbPath: DBPathInterface = cfg[env].databases['driver-school']

db.sequelize = new Sequelize(dbPath.database, dbPath.username, dbPath.password, dbPath)

db.Requester = RequesterModel(db.sequelize, DataTypes)
db.Correspondence = CorrespondenceModel(db.sequelize, DataTypes)
db.Approval = ApprovalModel(db.sequelize, DataTypes)
db.Attachment = AttachmentModel(db.sequelize, DataTypes)

Object.keys(db).forEach(modelName => {
  if((db[modelName] as Types.ModelWithAssociate).associate) {
    (db[modelName] as Types.ModelWithAssociate).associate(db)
  }
})

export const sequelize = db.sequelize
export const Requester = db.Requester
export const Correspondence = db.Correspondence
export const Approval = db.Approval
export const Attachment = db.Attachment
