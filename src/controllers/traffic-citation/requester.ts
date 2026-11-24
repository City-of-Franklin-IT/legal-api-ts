import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { Requester, Offense, Approval, Attachment, Notification } from '@/models/traffic-citation'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/traffic-citation/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface
type OffenseRecord = Model<Types.OffenseInterface> & Types.OffenseInterface

const defendantReplied = (offenses: Array<{ outcome: Types.Outcome, Approvals: Array<{ outcome: Types.Outcome }> }>): boolean =>
  offenses.some(offense => offense.outcome === 'SUBMITTED' && offense.Approvals.slice(-1)[0]?.outcome === 'MORE_INFO')

export type RequestStatus = 'NEEDS_REVIEW' | 'MORE_INFO' | 'COMPLETED'

export const deriveStatus = (offenses: Array<Pick<Types.OffenseInterface, 'outcome'>>): RequestStatus => {
  if(offenses.some(offense => offense.outcome === 'SUBMITTED')) return 'NEEDS_REVIEW'
  if(offenses.some(offense => offense.outcome === 'MORE_INFO')) return 'MORE_INFO'

  return 'COMPLETED'
}

type MatchFields = Pick<Types.RequesterInterface, 'uuid' | 'citationNumber' | 'licenseState' | 'licenseNumber'>

const clean = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()

const same = (a: string | null | undefined, b: string | null | undefined) => !!clean(a) && clean(a) === clean(b)

const isDuplicateOf = (a: MatchFields, b: MatchFields) => {
  if(a.uuid === b.uuid) return false

  const sameCitation = same(a.citationNumber, b.citationNumber)
  const sameLicense = same(a.licenseNumber, b.licenseNumber) && clean(a.licenseState) === clean(b.licenseState)

  return sameCitation || sameLicense
}

//@desc    Staff queue: requests with their derived status and duplicate flag (no license, DOB or phone)
//@route   GET /api/v2/legal/traffic-citation/request?searchValue=&requestType=&status=
//@access  citation.admin
export const getRequests = asyncHandler(async (req: Request<{}, {}, {}, { searchValue?: string, requestType?: string, status?: string }>, res: Response) => {
  const { searchValue, requestType, status } = req.query

  const search = `%${ searchValue ?? '' }%`

  const where = {
    ...(requestType && { requestType }),
    ...(searchValue && {
      [Op.or]: [
        { firstName: { [Op.like]: search } },
        { lastName: { [Op.like]: search } },
        { email: { [Op.like]: search } },
        { citationNumber: { [Op.like]: search } }
      ]
    })
  }

  const requests = await Requester.findAll({
    where,
    attributes: ['uuid', 'requestType', 'firstName', 'lastName', 'email', 'citationNumber', 'licenseState', 'licenseNumber', 'createdAt'],
    include: [
      { model: Offense, attributes: ['offenseType', 'outcome'], include: [{ model: Approval, attributes: ['outcome'] }] }
    ],
    order: [['createdAt', 'desc'], [Offense, Approval, 'createdAt', 'asc']]
  }) as Array<RequesterRecord & { Offenses: Array<OffenseRecord & { Approvals: Array<{ outcome: Types.Outcome }> }> }>

  // Duplicates are checked against every request, not just the filtered ones
  const everyone = await Requester.findAll({ attributes: ['uuid', 'citationNumber', 'licenseState', 'licenseNumber'] }) as RequesterRecord[]

  const data = requests
    .map(request => ({
      uuid: request.uuid,
      requestType: request.requestType,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      citationNumber: request.citationNumber,
      createdAt: request.createdAt,
      status: deriveStatus(request.Offenses),
      offenses: request.Offenses.map(({ offenseType, outcome }) => ({ offenseType, outcome })),
      duplicate: everyone.some(other => isDuplicateOf(request, other)),
      replied: defendantReplied(request.Offenses)
    }))
    .filter(request => !status || request.status === status)

  res.status(200).json({ success: true, data })
})

//@desc    Staff review: full request, offenses with decision history, attachment metadata, possible duplicates
//@route   GET /api/v2/legal/traffic-citation/request/:uuid
//@access  citation.admin
export const getRequest = asyncHandler(async (req: Request<{ uuid: string }>, res: Response, next: NextFunction) => {
  const request = await Requester.findOne({
    where: { uuid: req.params.uuid },
    order: [[Offense, 'id', 'asc'], [Offense, Approval, 'createdAt', 'asc'], [Attachment, 'createdAt', 'asc'], [Notification, 'id', 'asc']],
    include: [
      { model: Offense, include: [{ model: Approval }] },
      { model: Attachment, attributes: { exclude: ['attachment'] } },
      { model: Notification }
    ]
  }) as (RequesterRecord & { Offenses: OffenseRecord[] }) | null

  if(!request) {
    return next(new ErrorResponse(`Unable to return request by uuid ${ req.params.uuid }`, 404))
  }

  const others = await Requester.findAll({
    where: { uuid: { [Op.ne]: request.uuid } },
    attributes: ['uuid', 'requestType', 'citationNumber', 'licenseState', 'licenseNumber', 'createdAt'],
    include: [{ model: Offense, attributes: ['outcome'] }],
    order: [['createdAt', 'desc']]
  }) as Array<RequesterRecord & { Offenses: OffenseRecord[] }>

  const duplicates = others
    .filter(other => isDuplicateOf(request, other))
    .map(other => ({ uuid: other.uuid, requestType: other.requestType, createdAt: other.createdAt, status: deriveStatus(other.Offenses) }))

  res.status(200).json({ success: true, data: { request, duplicates } })
})

//@desc    Set (or clear with null) the one payable-by date for the whole request
//@route   PUT /api/v2/legal/traffic-citation/request/:uuid/due-date
//@access  citation.admin
export const setDueDate = asyncHandler(async (req: Request<{ uuid: string }, {}, { dueDate?: string | null }>, res: Response<ControllerResponse & { data: { dueDate: string | null } }>, next: NextFunction) => {
  const dueDate = req.body.dueDate

  const request = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  if(!request) {
    return next(new ErrorResponse(`Unable to update request by uuid ${ req.params.uuid }`, 404))
  }

  await request.update({ dueDate })

  res.status(200).json({ success: true, data: { dueDate: request.dueDate } })
})
