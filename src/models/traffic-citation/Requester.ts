'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Requester extends Model<Types.RequesterInterface> {
    declare id: number
    declare citationNumber: string | null
    declare firstName: string
    declare lastName: string
    declare email: string
    declare licenseNumber: string
    declare licenseState: string
    declare uuid: string
    declare createdAt: Date
    declare updatedAt: Date

    static associate({ Correspondence, Approval, Attachment }: { Correspondence: ModelStatic<Model<Types.CorrespondenceInterface>>, Approval: ModelStatic<Model<Types.ApprovalInterface>>, Attachment: ModelStatic<Model<Types.AttachmentInterface>> }) {
      this.hasMany(Correspondence, { sourceKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Approval, { sourceKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Attachment, { sourceKey: 'uuid', foreignKey: 'parentId' })
    }
  }

  Requester.init({
    id: {
      type: dataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    citationNumber: {
      type: dataTypes.STRING(20)
    },
    firstName: {
      type: dataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: dataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: dataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true }
    },
    licenseNumber: {
      type: dataTypes.STRING(10),
      allowNull: false
    },
    licenseState: {
      type: dataTypes.CHAR(2),
      allowNull: false,
      validate: { len: [2, 2] }
    },
    createdAt: {
      type: dataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: dataTypes.DATE,
      allowNull: false
    },
    uuid: {
      type: dataTypes.UUID,
      allowNull: false,
      defaultValue: dataTypes.UUIDV4
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Requester',
    tableName: 'requester'
  })

  return Requester
}
