'use strict';

// Types
import { Sequelize, Model, ModelStatic, DataTypes } from "sequelize"
import * as Types from './types'

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {

  class RelatedMatter extends Model<Types.RelatedMatterInterface>{
    declare CROSSREF_ID: number
    declare MATTER_ID: number
    declare MATTER_ID2: number
    declare RELATED_TITLE: string
    
    static associate({ Matter }: { Matter: ModelStatic<Model<Types.MatterInterface>> }) {
      this.belongsTo(Matter, { targetKey: 'MATTER_ID', foreignKey: 'MATTER_ID' })
    }
  }

  RelatedMatter.init({
    CROSSREF_ID: {
      type: dataTypes.NUMBER,
      allowNull: false,
      primaryKey: true
    },
    MATTER_ID: {
      type: dataTypes.NUMBER,
      allowNull: false
    },
    MATTER_ID2: {
      type: dataTypes.NUMBER,
      allowNull: false
    },
    RELATED_TITLE: {
      type: dataTypes.STRING,
      allowNull: false
    }
  },{
    sequelize,
    freezeTableName: true,
    modelName: 'RelatedMatter',
    tableName: 'ViewRelatedMatters',
    timestamps: false
  })

  return RelatedMatter
}