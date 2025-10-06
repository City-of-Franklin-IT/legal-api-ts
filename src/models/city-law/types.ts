// Types
import { Sequelize, ModelStatic, Model } from "sequelize"

export interface MatterInterface {
  MATTER_ID: number
  CASENO: string
  TITLE: string
  OPEN_DT: string
  MODULE: ModuleType
}

export interface DocumentInterface {
  DOC_ID: number
  MATTER_ID: number
  CASENO: string
  DESCRIP: string
  CREATED: string
  FILE_PATH: string
  EXT: string
  CATEGORY: string
}

export interface RelatedMatterInterface {
  CROSSREF_ID: number
  MATTER_ID: number
  MATTER_ID2: number
  RELATED_TITLE: string
}

export interface NoteInterface {
  NOTES_ID: number
  MATTER_ID: number
  TITLE: string
  NOTE_TYPE: string
  ADD_TIME: string
  NOTES: string
}

export interface StatusNoteInterface {
  STATUS_NOTE_ID: number
  MATTER_ID: number
  NOTES: string
}

export type ModuleType =
  | "AS"
  | "FI"
  | "LH"
  | "LI"

export interface DatabaseInterface {
  sequelize: Sequelize
  Matter: ModelStatic<Model<MatterInterface>>
  Document: ModelStatic<Model<DocumentInterface>>
  Note: ModelStatic<Model<NoteInterface>>
  RelatedMatter: ModelStatic<Model<RelatedMatterInterface>>
  StatusNote: ModelStatic<Model<StatusNoteInterface>>
  [key: string]: ModelStatic<Model<any, any>> | Sequelize | { matter: Sequelize, document: Sequelize, note: Sequelize, relatedMatter: Sequelize }
}

export interface ModelWithAssociate extends ModelStatic<Model> {
  associate: (db: DatabaseInterface) => void
}