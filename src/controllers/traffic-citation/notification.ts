import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import editorTracking from '@/utils/editorTracking'
import { Requester, Offense, Notification } from '@/models/traffic-citation'
import { deriveStatus } from './requester'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/traffic-citation/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface
type OffenseRecord = Model<Types.OffenseInterface> & Types.OffenseInterface
type NotificationRecord = Model<Types.NotificationInterface> & Types.NotificationInterface

//@desc    Record the answer to "Ready to notify defendant?": NOTIFIED (yes, the email phase sends it) or PENDING (saved without
//         notifying, so staff are reminded in the queue). The latest row for a request decides whether one is still owed.
//         The kind must match where the request stands, so a row can never claim something that did not happen.
//@route   POST /api/v2/legal/traffic-citation/request/:uuid/notification
//@access  citation.admin
export const createNotification = asyncHandler(async (req: Request<{ uuid: string }, {}, { kind?: Types.NotificationKind, status?: Types.NotificationStatus }>, res: Response<ControllerResponse & { data: Types.NotificationInterface }>, next: NextFunction) => {
  const { kind, status } = req.body

  const request = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  if(!request) {
    return next(new ErrorResponse(`Unable to find request by uuid ${ req.params.uuid }`, 404))
  }

  const offenses = await Offense.findAll({ where: { parentId: request.uuid }, attributes: ['outcome'] }) as OffenseRecord[]

  const fits =
    kind === 'DRIVING_SCHOOL' ? request.requestType === 'DRIVING_SCHOOL' && offenses.every(offense => offense.outcome !== 'SUBMITTED') :
    kind === 'MORE_INFO' ? request.requestType === 'CORRECTABLE' && offenses.some(offense => offense.outcome === 'MORE_INFO') :
    request.requestType === 'CORRECTABLE' && deriveStatus(offenses) === 'COMPLETED'

  if(!fits) {
    return next(new ErrorResponse(`A ${ kind } notification does not fit where this request stands`, 409))
  }

  const notification = await Notification.create({
    parentId: request.uuid,
    kind,
    status,
    createdBy: editorTracking(req).updatedBy
  } as Types.NotificationInterface) as NotificationRecord

  res.status(201).json({ success: true, data: notification })
})
