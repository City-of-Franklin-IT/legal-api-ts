'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Note extends Model<Types.NoteInterface>{
    declare NOTES_ID: number
    declare MATTER_ID: number
    declare TITLE: string
    declare NOTE_TYPE: string
    declare ADD_TIME: string
    declare NOTES: string

    static associate({ Matter }: { Matter: ModelStatic<Model<Types.MatterInterface>> }) {
      this.belongsTo(Matter, { targetKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
    }
  }

  Note.init({
    NOTES_ID: {
      type: dataTypes.NUMBER,
      allowNull: false,
      primaryKey: true
    },
    MATTER_ID: {
      type: dataTypes.NUMBER,
      allowNull: false
    },
    TITLE: {
      type: dataTypes.STRING,
      allowNull: false
    },
    NOTE_TYPE: {
      type: dataTypes.STRING
    },
    ADD_TIME: {
      type: dataTypes.STRING,
      allowNull: false
    },
    NOTES: {
      type: dataTypes.STRING,
      allowNull: false
    }
  },{
    sequelize,
    freezeTableName: true,
    tableName: 'ViewNotesMemo',
    modelName: 'Note',
    timestamps: false
  })

  return Note
}