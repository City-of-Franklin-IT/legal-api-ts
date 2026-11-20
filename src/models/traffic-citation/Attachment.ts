'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Attachment extends Model<Types.AttachmentInterface> {
    declare id: number
    declare parentId: string
    declare offenseUuid: string | null
    declare fileName: string
    declare contentType: string
    declare fileSize: number
    declare attachment: Buffer
    declare caption: string | null
    declare isInternal: boolean | null
    declare uuid: string
    declare createdAt: Date
    declare createdBy: string
    declare updatedAt: Date
    declare updatedBy: string

    static associate({ Requester, Offense }: { Requester: ModelStatic<Model<Types.RequesterInterface>>, Offense: ModelStatic<Model<Types.OffenseInterface>> }) {
      this.belongsTo(Requester, { targetKey: 'uuid', foreignKey: 'parentId' })
      this.belongsTo(Offense, { targetKey: 'uuid', foreignKey: 'offenseUuid' })
    }
  }

  Attachment.init({
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
    offenseUuid: {
      type: dataTypes.UUID
    },
    fileName: {
      type: dataTypes.STRING(255),
      allowNull: false
    },
    contentType: {
      type: dataTypes.STRING(100),
      allowNull: false
    },
    fileSize: {
      type: dataTypes.BIGINT,
      allowNull: false
    },
    attachment: {
      type: dataTypes.BLOB('long'),
      allowNull: false
    },
    caption: {
      type: dataTypes.TEXT
    },
    isInternal: {
      type: dataTypes.BOOLEAN
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
    modelName: 'Attachment',
    tableName: 'attachment',
    defaultScope: {
      attributes: { exclude: ['attachment'] }
    }
  })

  return Attachment
}
