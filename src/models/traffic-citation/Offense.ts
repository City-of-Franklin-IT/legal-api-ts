'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Offense extends Model<Types.OffenseInterface> {
    declare id: number
    declare parentId: string
    declare offenseType: Types.OffenseType
    declare outcome: Types.Outcome
    declare amount: number | null
    declare staffNote: string | null
    declare uuid: string
    declare createdAt: Date
    declare updatedAt: Date
    declare updatedBy: string | null

    static associate({ Requester, Approval, Attachment }: { Requester: ModelStatic<Model<Types.RequesterInterface>>, Approval: ModelStatic<Model<Types.ApprovalInterface>>, Attachment: ModelStatic<Model<Types.AttachmentInterface>> }) {
      this.belongsTo(Requester, { targetKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Approval, { sourceKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Attachment, { sourceKey: 'uuid', foreignKey: 'offenseUuid' })
    }
  }

  Offense.init({
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
    offenseType: {
      type: dataTypes.STRING(30),
      allowNull: false,
      validate: { isIn: [Types.OFFENSE_TYPES as unknown as string[]] }
    },
    outcome: {
      type: dataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'SUBMITTED',
      validate: { isIn: [Types.OUTCOMES as unknown as string[]] }
    },
    amount: {
      type: dataTypes.DECIMAL(10, 2),
      // SQL Server returns decimals as numbers on read but our writes are strings; always hand out a number
      get() {
        const value = this.getDataValue('amount') as unknown
        return value === null || value === undefined ? null : Number(value)
      }
    },
    staffNote: {
      type: dataTypes.TEXT('long')
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
    updatedBy: {
      type: dataTypes.STRING(255)
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Offense',
    tableName: 'offense'
  })

  return Offense
}
