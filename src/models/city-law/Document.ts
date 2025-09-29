'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Document extends Model<Types.DocumentInterface> {
    declare DOC_ID: number
    declare MATTER_ID: number
    declare CASENO: string
    declare DESCRIP: string
    declare CREATED: string
    declare FILE_PATH: string
    declare EXT: string
    declare CATEGORY: string

    static associate({ Matter }: { Matter: ModelStatic<Model<Types.MatterInterface>> }) {
      this.belongsTo(Matter, { targetKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
    }
  }

  Document.init({
    DOC_ID: {
      type: dataTypes.NUMBER,
      allowNull: false,
      primaryKey: true
    },
    MATTER_ID: {
      type: dataTypes.NUMBER,
      allowNull: false
    },
    CASENO: {
      type: dataTypes.STRING,
      allowNull: false
    },
    DESCRIP: {
      type: dataTypes.STRING,
      allowNull: false
    },
    CREATED: {
      type: dataTypes.STRING,
      allowNull: false
    },
    FILE_PATH: {
      type: dataTypes.STRING,
      allowNull: false
    },
    EXT: {
      type: dataTypes.STRING,
      allowNull: false
    },
    CATEGORY: {
      type: dataTypes.STRING,
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Document',
    tableName: 'ViewDoc',
    timestamps: false
  })

  return Document
}