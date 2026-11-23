'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Notification extends Model<Types.NotificationInterface> {
    declare id: number
    declare parentId: string
    declare kind: Types.NotificationKind
    declare status: Types.NotificationStatus
    declare uuid: string
    declare createdAt: Date
    declare createdBy: string

    static associate({ Requester }: { Requester: ModelStatic<Model<Types.RequesterInterface>> }) {
      this.belongsTo(Requester, { targetKey: 'uuid', foreignKey: 'parentId' })
    }
  }

  Notification.init({
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
    kind: {
      type: dataTypes.STRING(30),
      allowNull: false,
      validate: { isIn: [Types.NOTIFICATION_KINDS as unknown as string[]] }
    },
    status: {
      type: dataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [Types.NOTIFICATION_STATUSES as unknown as string[]] }
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
    modelName: 'Notification',
    tableName: 'notification',
    updatedAt: false
  })

  return Notification
}
