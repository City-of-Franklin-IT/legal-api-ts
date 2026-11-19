'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Approval extends Model<Types.ApprovalInterface> {
    declare id: number
    declare parentId: string
    declare approval: boolean | null
    declare comment: string | null
    declare uuid: string
    declare createdAt: Date
    declare createdBy: string
    declare updatedAt: Date
    declare updatedBy: string

    static associate({ Requester }: { Requester: ModelStatic<Model<Types.RequesterInterface>> }) {
      this.belongsTo(Requester, { targetKey: 'uuid', foreignKey: 'parentId' })
    }
  }

  Approval.init({
    id: {
      type: dataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    parentId: {
      type: dataTypes.UUID,
      allowNull: false
    },
    approval: {
      type: dataTypes.BOOLEAN
    },
    comment: {
      type: dataTypes.TEXT
    },
    uuid: {
      type: dataTypes.UUID,
      allowNull: false,
      defaultValue: dataTypes.UUIDV4
    },
    createdAt: {
      type: dataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: dataTypes.DATE,
      allowNull: false
    },
    createdBy: {
      type: dataTypes.STRING(255),
      allowNull: false
    },
    updatedBy: {
      type: dataTypes.STRING(255),
      allowNull: false
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Approval',
    tableName: 'approval'
  })

  return Approval
}
