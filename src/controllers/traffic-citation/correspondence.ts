import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import editorTracking from '@/utils/editorTracking'
import { Requester, Offense, Correspondence } from '@/models/traffic-citation'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/traffic-citation/types'

type CorrespondenceRecord = Model<Types.CorrespondenceInterface> & Types.CorrespondenceInterface

//@desc    Staff message on a request, optionally about one offense
//@route   POST /api/v2/legal/traffic-citation/request/:uuid/correspondence
//@access  citation.admin
export const createCorrespondence = asyncHandler(async (req: Request<{ uuid: string }, {}, { message?: string, offenseUuid?: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface }>, next: NextFunction) => {
  const { message, offenseUuid } = req.body

  if(typeof message !== 'string' || !message.trim()) {
    return next(new ErrorResponse('A message is required', 400))
  }

  if(!await Requester.findOne({ where: { uuid: req.params.uuid } })) {
    return next(new ErrorResponse(`Unable to find request by uuid ${ req.params.uuid }`, 404))
  }

  if(offenseUuid !== undefined && offenseUuid !== null) {
    if(!await Offense.findOne({ where: { uuid: offenseUuid, parentId: req.params.uuid } })) {
      return next(new ErrorResponse('That offense does not belong to this request', 400))
    }
  }

  const correspondence = await Correspondence.create({
    parentId: req.params.uuid,
    offenseUuid: offenseUuid ?? null,
    message: message.trim(),
    createdBy: editorTracking(req).updatedBy
  } as Types.CorrespondenceInterface) as CorrespondenceRecord

  res.status(201).json({ success: true, data: correspondence })
})
