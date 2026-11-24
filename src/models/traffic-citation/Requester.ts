'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Requester extends Model<Types.RequesterInterface> {
    declare id: number
    declare requestType: Types.RequestType
    declare citationNumber: string | null
    declare firstName: string
    declare lastName: string
    declare email: string
    declare phone: string
    declare licenseNumber: string | null
    declare licenseState: string | null
    declare dob: string | null
    declare dueDate: string | null
    declare uuid: string
    declare createdAt: Date
    declare updatedAt: Date

    static associate({ Offense, Attachment, Notification }: { Offense: ModelStatic<Model<Types.OffenseInterface>>, Attachment: ModelStatic<Model<Types.AttachmentInterface>>, Notification: ModelStatic<Model<Types.NotificationInterface>> }) {
      this.hasMany(Offense, { sourceKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Attachment, { sourceKey: 'uuid', foreignKey: 'parentId' })
      this.hasMany(Notification, { sourceKey: 'uuid', foreignKey: 'parentId' })
    }
  }

  Requester.init({
    id: {
      type: dataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    requestType: {
      type: dataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['DRIVING_SCHOOL', 'CORRECTABLE']] }
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
    phone: {
      type: dataTypes.STRING(20),
      allowNull: false
    },
    licenseNumber: {
      type: dataTypes.STRING(25)
    },
    licenseState: {
      type: dataTypes.CHAR(2),
      validate: { len: [2, 2] }
    },
    dob: {
      type: dataTypes.DATEONLY
    },
    dueDate: {
      type: dataTypes.DATEONLY
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
