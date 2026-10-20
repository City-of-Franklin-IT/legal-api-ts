import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import editorTracking from '@/utils/editorTracking'
import isUuid from '@/utils/isUuid'
import { Requester, Approval } from '@/models/driver-school'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/driver-school/types'

type ApprovalRecord = Model<Types.ApprovalInterface> & Types.ApprovalInterface

//@desc    Get approvals by requester uuid
//@route   GET /api/v1/legal/driver-school/approval?parentId=
//@access  Private
export const getApprovals = asyncHandler(async (req: Request<{}, {}, {}, { parentId?: string }>, res: Response<ControllerResponse & { data: Types.ApprovalInterface[] }>, next: NextFunction) => {
  if(!isUuid(req.query.parentId)) {
    return next(new ErrorResponse('A valid parentId is required', 400))
  }

  const approvals = await Approval.findAll({
    where: { parentId: req.query.parentId },
    order: [['createdAt', 'asc']]
  }) as ApprovalRecord[]

  res.status(200).json({
    success: true,
    data: approvals
  })
})

//@desc    Get approval by uuid
//@route   GET /api/v1/legal/driver-school/approval/:uuid
//@access  Private
export const getApproval = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse & { data: Types.ApprovalInterface }>, next: NextFunction) => {
  const approval = await Approval.findOne({ where: { uuid: req.params.uuid } }) as ApprovalRecord | null

  if(!approval) {
    return next(new ErrorResponse(`Unable to return approval by uuid ${ req.params.uuid }`, 404))
  }

  res.status(200).json({
    success: true,
    data: approval
  })
})

//@desc    Create approval
//@route   POST /api/v1/legal/driver-school/approval
//@access  Private
export const createApproval = asyncHandler(async (req: Request<{}, {}, Pick<Types.ApprovalInterface, 'parentId' | 'approval' | 'comment'>>, res: Response<ControllerResponse & { data: Types.ApprovalInterface }>, next: NextFunction) => {
  if(!isUuid(req.body.parentId) || !await Requester.findOne({ where: { uuid: req.body.parentId } })) {
    return next(new ErrorResponse(`Unable to find requester by parentId ${ req.body.parentId }`, 404))
  }

  const approval = await Approval.create({
    parentId: req.body.parentId,
    approval: req.body.approval,
    comment: req.body.comment,
    ...editorTracking(req)
  } as Types.ApprovalInterface) as ApprovalRecord

  res.status(201).json({
    success: true,
    data: approval
  })
})

//@desc    Update approval
//@route   PUT /api/v1/legal/driver-school/approval/:uuid
//@access  Private
export const updateApproval = asyncHandler(async (req: Request<{ uuid: string }, {}, Pick<Types.ApprovalInterface, 'approval' | 'comment'>>, res: Response<ControllerResponse & { data: Types.ApprovalInterface }>, next: NextFunction) => {
  const approval = await Approval.findOne({ where: { uuid: req.params.uuid } }) as ApprovalRecord | null

  if(!approval) {
    return next(new ErrorResponse(`Unable to update approval by uuid ${ req.params.uuid }`, 404))
  }

  const { approval: approved, comment } = req.body ?? {}

  // Only apply fields that were sent; null is a meaningful value (e.g. reset the decision)
  const updates = Object.fromEntries(Object.entries({ approval: approved, comment }).filter(([, value]) => value !== undefined))

  await approval.update({ ...updates, ...editorTracking(req) })

  res.status(200).json({
    success: true,
    data: approval
  })
})

//@desc    Delete approval
//@route   DELETE /api/v1/legal/driver-school/approval/:uuid
//@access  Private
export const deleteApproval = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse>, next: NextFunction) => {
  const approval = await Approval.findOne({ where: { uuid: req.params.uuid } }) as ApprovalRecord | null

  if(!approval) {
    return next(new ErrorResponse(`Unable to delete approval by uuid ${ req.params.uuid }`, 404))
  }

  await approval.destroy()

  res.status(200).json({
    success: true
  })
})
