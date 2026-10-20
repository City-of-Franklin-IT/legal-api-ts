import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { signRequesterToken } from '@/utils/requesterToken'
import { sequelize, Requester, Correspondence, Approval, Attachment } from '@/models/driver-school'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/driver-school/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface

const pickRequesterFields = (body: Partial<Types.RequesterCreateInterface>): Partial<Types.RequesterCreateInterface> => {
  const { citationNumber, firstName, lastName, email, licenseNumber, licenseState } = body ?? {}

  return { citationNumber, firstName, lastName, email, licenseNumber, licenseState }
}

//@desc    Get requesters by query string
//@route   GET /api/v2/legal/driver-school/requester?searchValue=
//@access  Private
export const getRequesters = asyncHandler(async (req: Request<{}, {}, {}, { searchValue?: string }>, res: Response<ControllerResponse & { data: Types.RequesterInterface[] }>) => {
  const searchValue = `%${ req.query.searchValue ?? '' }%`

  const requesters = await Requester.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.like]: searchValue } },
        { lastName: { [Op.like]: searchValue } },
        { email: { [Op.like]: searchValue } },
        { citationNumber: { [Op.like]: searchValue } }
      ]
    },
    order: [['lastName', 'asc'], ['firstName', 'asc']]
  }) as RequesterRecord[]

  res.status(200).json({
    success: true,
    data: requesters
  })
})

//@desc    Get requester by uuid, with correspondence, approvals and attachments
//@route   GET /api/v2/legal/driver-school/requester/:uuid
//@access  Private
export const getRequester = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse & { data: Types.RequesterInterface }>, next: NextFunction) => {
  const requester = await Requester.findOne({
    where: { uuid: req.params.uuid },
    order: [[Correspondence, 'createdAt', 'asc'], [Approval, 'createdAt', 'asc'], [Attachment, 'createdAt', 'asc']],
    include: [
      { model: Correspondence },
      { model: Approval },
      { model: Attachment, attributes: { exclude: ['attachment'] } }
    ]
  }) as RequesterRecord | null

  if(!requester) {
    return next(new ErrorResponse(`Unable to return requester by uuid ${ req.params.uuid }`, 404))
  }

  res.status(200).json({
    success: true,
    data: requester
  })
})

//@desc    Create requester
//@route   POST /api/v1/legal/driver-school/requester
//@access  Private
export const createRequester = asyncHandler(async (req: Request<{}, {}, Types.RequesterCreateInterface>, res: Response<ControllerResponse & { data: Types.RequesterInterface }>) => {
  const requester = await Requester.create(pickRequesterFields(req.body) as Types.RequesterInterface) as RequesterRecord

  res.status(201).json({
    success: true,
    data: requester
  })
})

//@desc    Update requester
//@route   PUT /api/v1/legal/driver-school/requester/:uuid
//@access  Private
export const updateRequester = asyncHandler(async (req: Request<{ uuid: string }, {}, Partial<Types.RequesterCreateInterface>>, res: Response<ControllerResponse & { data: Types.RequesterInterface }>, next: NextFunction) => {
  const requester = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  if(!requester) {
    return next(new ErrorResponse(`Unable to update requester by uuid ${ req.params.uuid }`, 404))
  }

  const fields = pickRequesterFields(req.body)

  // Only apply fields that were sent so a partial update doesn't null the rest
  const updates = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))

  await requester.update(updates)

  res.status(200).json({
    success: true,
    data: requester
  })
})

//@desc    Delete requester and everything attached to it
//@route   DELETE /api/v1/legal/driver-school/requester/:uuid
//@access  Private
export const deleteRequester = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse>, next: NextFunction) => {
  const requester = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  if(!requester) {
    return next(new ErrorResponse(`Unable to delete requester by uuid ${ req.params.uuid }`, 404))
  }

  // Child foreign keys don't cascade, so remove them first
  await sequelize.transaction(async (transaction) => {
    const where = { parentId: requester.uuid }

    await Correspondence.destroy({ where, transaction })
    await Approval.destroy({ where, transaction })
    await Attachment.destroy({ where, transaction })
    await requester.destroy({ transaction })
  })

  res.status(200).json({
    success: true
  })
})

//@desc    Create a token (and link) letting the requester submit back to their request
//@route   POST /api/v1/legal/driver-school/requester/:uuid/token
//@access  Private
export const createRequesterToken = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse & { data: { token: string, url: string } }>, next: NextFunction) => {
  const requester = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  if(!requester) {
    return next(new ErrorResponse(`Unable to create token for requester uuid ${ req.params.uuid }`, 404))
  }

  const token = signRequesterToken(requester.uuid)

  res.status(201).json({
    success: true,
    data: {
      token,
      url: `${ process.env.DRIVER_SCHOOL_PUBLIC_URL }?token=${ encodeURIComponent(token) }`
    }
  })
})
