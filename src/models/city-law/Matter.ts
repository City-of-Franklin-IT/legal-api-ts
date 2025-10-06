'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class Matter extends Model<Types.MatterInterface> {
    declare MATTER_ID: number
    declare CASENO: string
    declare TITLE: string
    declare OPEN_DT: string
    
    static associate({ Document, Note, RelatedMatter, StatusNote }: { Document: ModelStatic<Model<Types.DocumentInterface>>, Note: ModelStatic<Model<Types.NoteInterface>>, RelatedMatter: ModelStatic<Model<Types.RelatedMatterInterface>>, StatusNote: ModelStatic<Model<Types.StatusNoteInterface>> }) {
      this.hasMany(Document, { sourceKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
      this.hasMany(Note, { sourceKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
      this.hasMany(RelatedMatter, { sourceKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
      this.hasOne(StatusNote, { sourceKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
    }
  }

  Matter.init({
    MATTER_ID: {
      type: dataTypes.NUMBER,
      allowNull: false,
      primaryKey: true
    },
    CASENO: {
      type: dataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue('CASENO').trimEnd()
      }
    },
    TITLE: {
      type: dataTypes.STRING,
      allowNull: false
    },
    OPEN_DT: {
      type: dataTypes.STRING,
      allowNull: false
    },
    MODULE: {
      type: dataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue('MODULE').trimEnd()
      }
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'Matter',
    tableName: 'BASE',
    timestamps: false
  })

  return Matter
}