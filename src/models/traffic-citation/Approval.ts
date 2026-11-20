'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Approval extends Model<Types.ApprovalInterface> {
    declare id: number
    declare parentId: string
    declare outcome: Types.Outcome
    declare amount: number | null
    declare comment: string | null
    declare uuid: string
    declare createdAt: Date
    declare createdBy: string

    static associate({ Offense }: { Offense: ModelStatic<Model<Types.OffenseInterface>> }) {
      this.belongsTo(Offense, { targetKey: 'uuid', foreignKey: 'parentId' })
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
    outcome: {
      type: dataTypes.STRING(30),
      allowNull: false
    },
    amount: {
      type: dataTypes.DECIMAL(10, 2),
      // SQL Server returns decimals as numbers on read but our writes are strings; always hand out a number
      get() {
        const value = this.getDataValue('amount') as unknown
        return value === null || value === undefined ? null : Number(value)
      }
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
    createdBy: {
      type: dataTypes.STRING(255),
      allowNull: false
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Approval',
    tableName: 'approval',
    updatedAt: false
  })

  return Approval
}
