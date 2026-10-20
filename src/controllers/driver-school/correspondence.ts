import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import isUuid from '@/utils/isUuid'
import { Requester, Correspondence } from '@/models/driver-school'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/driver-school/types'

type CorrespondenceRecord = Model<Types.CorrespondenceInterface> & Types.CorrespondenceInterface

//@desc    Get correspondence by requester uuid
//@route   GET /api/v1/legal/driver-school/correspondence?parentId=
//@access  Private
export const getCorrespondences = asyncHandler(async (req: Request<{}, {}, {}, { parentId?: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface[] }>, next: NextFunction) => {
  if(!isUuid(req.query.parentId)) {
    return next(new ErrorResponse('A valid parentId is required', 400))
  }

  const correspondences = await Correspondence.findAll({
    where: { parentId: req.query.parentId },
    order: [['createdAt', 'asc']]
  }) as CorrespondenceRecord[]

  res.status(200).json({
    success: true,
    data: correspondences
  })
})

//@desc    Get correspondence by uuid
//@route   GET /api/v1/legal/driver-school/correspondence/:uuid
//@access  Private
export const getCorrespondence = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface }>, next: NextFunction) => {
  const correspondence = await Correspondence.findOne({ where: { uuid: req.params.uuid } }) as CorrespondenceRecord | null

  if(!correspondence) {
    return next(new ErrorResponse(`Unable to return correspondence by uuid ${ req.params.uuid }`, 404))
  }

  res.status(200).json({
    success: true,
    data: correspondence
  })
})

//@desc    Create correspondence
//@route   POST /api/v1/legal/driver-school/correspondence
//@access  Private
export const createCorrespondence = asyncHandler(async (req: Request<{}, {}, { parentId: string, message: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface }>, next: NextFunction) => {
  if(!isUuid(req.body.parentId) || !await Requester.findOne({ where: { uuid: req.body.parentId } })) {
    return next(new ErrorResponse(`Unable to find requester by parentId ${ req.body.parentId }`, 404))
  }

  const correspondence = await Correspondence.create({
    parentId: req.body.parentId,
    message: req.body.message,
    createdBy: String(req.entra?.preferred_username.toLowerCase())
  } as Types.CorrespondenceInterface) as CorrespondenceRecord

  res.status(201).json({
    success: true,
    data: correspondence
  })
})

//@desc    Update correspondence message (no audit columns exist for updates)
//@route   PUT /api/v1/legal/driver-school/correspondence/:uuid
//@access  Private
export const updateCorrespondence = asyncHandler(async (req: Request<{ uuid: string }, {}, { message: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface }>, next: NextFunction) => {
  const correspondence = await Correspondence.findOne({ where: { uuid: req.params.uuid } }) as CorrespondenceRecord | null

  if(!correspondence) {
    return next(new ErrorResponse(`Unable to update correspondence by uuid ${ req.params.uuid }`, 404))
  }

  await correspondence.update({ message: req.body.message })

  res.status(200).json({
    success: true,
    data: correspondence
  })
})

//@desc    Delete correspondence
//@route   DELETE /api/v1/legal/driver-school/correspondence/:uuid
//@access  Private
export const deleteCorrespondence = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse>, next: NextFunction) => {
  const correspondence = await Correspondence.findOne({ where: { uuid: req.params.uuid } }) as CorrespondenceRecord | null

  if(!correspondence) {
    return next(new ErrorResponse(`Unable to delete correspondence by uuid ${ req.params.uuid }`, 404))
  }

  await correspondence.destroy()

  res.status(200).json({
    success: true
  })
})
