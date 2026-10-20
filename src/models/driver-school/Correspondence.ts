'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Correspondence extends Model<Types.CorrespondenceInterface> {
    declare id: number
    declare parentId: string
    declare message: string
    declare uuid: string
    declare createdAt: Date
    declare createdBy: string

    static associate({ Requester }: { Requester: ModelStatic<Model<Types.RequesterInterface>> }) {
      this.belongsTo(Requester, { targetKey: 'uuid', foreignKey: 'parentId' })
    }
  }

  Correspondence.init({
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
    message: {
      type: dataTypes.TEXT,
      allowNull: false
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
    modelName: 'Correspondence',
    tableName: 'correspondence',
    updatedAt: false
  })

  return Correspondence
}
