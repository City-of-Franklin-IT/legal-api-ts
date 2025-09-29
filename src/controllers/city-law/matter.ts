import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { Matter, Document, Note, RelatedMatter } from '@/models/city-law'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/city-law/types'

//@desc    Get matters by query string
//@route   GET /api/v1/legal/city-law/matter?module=&searchValue=
//@access  Private 
export const getMatters = asyncHandler(async (req: Request<{}, {}, {}, { module: Types.ModuleType, searchValue: string }>, res: Response<ControllerResponse & { data: Types.MatterInterface[] }>, next: NextFunction) => {
  const matters = await Matter.findAll({
    where: {
      MODULE: {
        [Op.in]: req.query.module.split(',')
      },
      TITLE: {
        [Op.like]: '%' + req.query.searchValue + '%'
      }
    },
    order: [['TITLE', 'asc'], [Document, 'CREATED', 'asc'], [Note, 'ADD_TIME', 'asc']],
    include: [
      { model: Document },
      { model: Note },
      { model: RelatedMatter }
    ]
  }) as (Model<Types.MatterInterface> & Types.MatterInterface)[]

  res.status(200).json({
    success: true,
    data: matters
  })
})

//@desc    Get matter by MATTER_ID
//@route   GET /api/v1/legal/city-law/matter/:matterId
//@access  Private
export const getMatter = asyncHandler(async (req: Request<{ matterId: string }>, res: Response<ControllerResponse & { data: Types.MatterInterface }>, next: NextFunction) => {
  const matter = await Matter.findOne({
    where: {
      MATTER_ID: req.params.matterId
    },
    order: [[Document, 'CREATED', 'asc'], [Note, 'ADD_TIME', 'asc']],
    include: [
      { model: Document },
      { model: Note },
      { model: RelatedMatter }
    ]
  }) as Model<Types.MatterInterface> & Types.MatterInterface

  if(!matter) {
    return next(new ErrorResponse(`Unable to return matter by matterId ${ req.params.matterId }`, 500))
  }

  res.status(200).json({
    success: true,
    data: matter
  })
})