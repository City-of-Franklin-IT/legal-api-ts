// Types
import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize'
import { ConfigInterface, DBPathInterface } from '../types'
import * as Types from './types'

// Models
import RequesterModel from './Requester'
import OffenseModel from './Offense'
import CorrespondenceModel from './Correspondence'
import ApprovalModel from './Approval'
import AttachmentModel from './Attachment'

const env = process.env.NODE_ENV || 'development'

import config from '../../config/config'

const cfg = config as ConfigInterface

const db = {
  sequelize: {} as Sequelize,
  Requester: {} as ModelStatic<Model<Types.RequesterInterface>>,
  Offense: {} as ModelStatic<Model<Types.OffenseInterface>>,
  Correspondence: {} as ModelStatic<Model<Types.CorrespondenceInterface>>,
  Approval: {} as ModelStatic<Model<Types.ApprovalInterface>>,
  Attachment: {} as ModelStatic<Model<Types.AttachmentInterface>>
} as Types.DatabaseInterface

// Sequelize's SQL Server DATEONLY parser runs moment(value).format() on the driver's UTC-midnight Date, which formats
// in the server's local zone and returns the previous day west of UTC (a due date of 12/31 read back as 12/30).
// This module's connection uses useUTC and stores UTC, so read a `date` as the UTC calendar day instead.
// The parser store is shared by every SQL Server connection in the process; no city-law model reads a `date` column.
const mssqlTypes = (DataTypes as unknown as { mssql: { DATEONLY: { parse: (value: unknown) => string } } }).mssql

mssqlTypes.DATEONLY.parse = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value)

const dbPath: DBPathInterface = cfg[env].databases['traffic-citation']

db.sequelize = new Sequelize(dbPath.database, dbPath.username, dbPath.password, dbPath)

;(db.sequelize as unknown as { connectionManager: { refreshTypeParser: (types: unknown) => void } }).connectionManager.refreshTypeParser(mssqlTypes)

db.Requester = RequesterModel(db.sequelize, DataTypes)
db.Offense = OffenseModel(db.sequelize, DataTypes)
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
export const Offense = db.Offense
export const Correspondence = db.Correspondence
export const Approval = db.Approval
export const Attachment = db.Attachment
