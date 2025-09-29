import dotenv from 'dotenv'
dotenv.config({ path: 'config/config.env' })

// Types
import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize'
import { ConfigInterface, DBPathInterface } from '../types'
import * as Types from './types'

// Models
import MatterModel from './Matter'
import DocumentModel from './Document'
import NoteModel from './Note'
import RelatedMatterModel from './RelatedMatter'

const env = process.env.NODE_ENV || 'development'

import config from '../../config/config'

const cfg = config as ConfigInterface

const db = {
  sequelize: {} as Sequelize,
  Matter: {} as ModelStatic<Model<Types.MatterInterface>>,
  Document: {} as ModelStatic<Model<Types.DocumentInterface>>,
  Note: {} as ModelStatic<Model<Types.NoteInterface>>,
  RelatedMatter: {} as ModelStatic<Model<Types.RelatedMatterInterface>>,
} as Types.DatabaseInterface

const dbPath: DBPathInterface = cfg[env].databases['city-law']

db.sequelize = new Sequelize(dbPath.database, dbPath.username, dbPath.password, dbPath)

db.Matter = MatterModel(db.sequelize, DataTypes)
db.Document = DocumentModel(db.sequelize, DataTypes)
db.Note = NoteModel(db.sequelize, DataTypes)
db.RelatedMatter = RelatedMatterModel(db.sequelize, DataTypes)
  
Object.keys(db).forEach(modelName => {
  if((db[modelName] as Types.ModelWithAssociate).associate) {
    (db[modelName] as Types.ModelWithAssociate).associate(db)
  }
})

export const Matter = db.Matter
export const Document = db.Document
export const Note = db.Note
export const RelatedMatter = db.RelatedMatter