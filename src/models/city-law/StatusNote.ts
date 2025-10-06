'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class StatusNote extends Model<Types.StatusNoteInterface>{
    declare STATUS_NOTE_ID: number
    declare MATTER_ID: number
    declare NOTES: string

    static associate({ Matter }: { Matter: ModelStatic<Model<Types.MatterInterface>> }) {
      this.belongsTo(Matter, { targetKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
    }
  }

  StatusNote.init({
    STATUS_NOTE_ID: {
      type: dataTypes.NUMBER,
      allowNull: false,
      primaryKey: true
    },
    MATTER_ID: {
      type: dataTypes.NUMBER,
      allowNull: false
    },
    NOTES: {
      type: dataTypes.STRING,
      allowNull: false
    }
  },{
    sequelize,
    freezeTableName: true,
    tableName: 'ViewStatus',
    modelName: 'StatusNote',
    timestamps: false
  })

  return StatusNote
}