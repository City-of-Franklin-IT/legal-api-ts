import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import editorTracking from '@/utils/editorTracking'
import detectFileType from '@/utils/detectFileType'
import cleanFileName from '@/utils/cleanFileName'
import { sequelize, Offense, Approval, Attachment } from '@/models/traffic-citation'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/traffic-citation/types'

type OffenseRecord = Model<Types.OffenseInterface> & Types.OffenseInterface

const CORRECTABLE_OUTCOMES: Types.Outcome[] = ['APPROVED', 'NOT_APPROVED', 'MORE_INFO']

// Outcomes staff may set, by offense type. SUBMITTED (back to under review) is always allowed, even after the defendant
// was told: staff may need to reopen a decision (for example after a phone call). It is a history row like any other.
const allowedOutcomes = (offenseType: Types.OffenseType): Types.Outcome[] => {
  if(offenseType === 'DRIVING_SCHOOL') return ['SUBMITTED', 'APPROVED', 'NOT_APPROVED_HISTORY', 'NOT_APPROVED_CHARGE'] // no More info: the defendant sends no documents, the court checks the record itself
  if(offenseType === 'REGISTRATION') return ['SUBMITTED', ...CORRECTABLE_OUTCOMES, 'REDUCED'] // reduced to $77.00 applies to registration only (F6)

  return ['SUBMITTED', ...CORRECTABLE_OUTCOMES]
}

const OWES_MONEY: Types.Outcome[] = ['NOT_APPROVED', 'REDUCED']

const MAX_COMMENT_LENGTH = 5000

type DecisionBody = { outcome?: Types.Outcome, amount?: number | string | null, comment?: string | null }

//@desc    Record a staff decision on one offense: appends a history row and updates the offense's current outcome.
//         A driving school decision may carry the court's letter (multipart, file field "attachment"): it is stored as an
//         internal attachment (the defendant never sees it in the portal) in the same transaction as the decision.
//@route   POST /api/v2/legal/traffic-citation/offense/:uuid/decision
//@access  citation.admin
export const createDecision = asyncHandler(async (req: Request<{ uuid: string }, {}, DecisionBody>, res: Response<ControllerResponse & { data: Types.OffenseInterface }>, next: NextFunction) => {
  const { outcome, amount, comment } = req.body ?? {}
  const file = req.file

  const offense = await Offense.findOne({ where: { uuid: req.params.uuid } }) as OffenseRecord | null

  if(!offense) {
    return next(new ErrorResponse(`Unable to find offense by uuid ${ req.params.uuid }`, 404))
  }

  if(file && offense.offenseType !== 'DRIVING_SCHOOL') {
    return next(new ErrorResponse('A file can only be sent with a driving school decision', 400))
  }

  if(!outcome || !allowedOutcomes(offense.offenseType).includes(outcome)) {
    return next(new ErrorResponse(`Outcome is not allowed for a ${ offense.offenseType } offense`, 400))
  }

  let cleanAmount: number | null = null

  if(OWES_MONEY.includes(outcome)) {
    const parsed = typeof amount === 'string' ? Number(amount) : amount

    if(typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0 || parsed > 99999999.99 || Math.round(parsed * 100) !== parsed * 100) {
      return next(new ErrorResponse('A valid amount (0 or more, at most two decimals) is required for this outcome', 400))
    }

    cleanAmount = Number(parsed.toFixed(2))
  }

  const cleanComment = typeof comment === 'string' && comment.trim() ? comment.trim() : null

  if(cleanComment && cleanComment.length > MAX_COMMENT_LENGTH) {
    return next(new ErrorResponse(`Comment must be ${ MAX_COMMENT_LENGTH } characters or fewer`, 400))
  }

  if(outcome === 'MORE_INFO' && !cleanComment) {
    return next(new ErrorResponse('A note to the defendant is required for More info needed', 400))
  }

  const { updatedBy } = editorTracking(req)

  await sequelize.transaction(async (transaction) => {
    await Approval.create({
      parentId: offense.uuid,
      outcome,
      amount: cleanAmount,
      comment: cleanComment,
      createdBy: updatedBy
    } as Types.ApprovalInterface, { transaction })

    // The defendant only sees the staff note on More info; the history row keeps every note
    await offense.update({
      outcome,
      amount: cleanAmount,
      staffNote: outcome === 'MORE_INFO' ? cleanComment : null,
      updatedBy
    }, { transaction })

    if(file) {
      // The type comes from the file's own bytes (checked by the upload middleware), never from the browser
      const fileType = detectFileType(file.buffer)!

      await Attachment.create({
        parentId: offense.parentId,
        offenseUuid: offense.uuid,
        fileName: cleanFileName(file.originalname, 'document'),
        contentType: fileType.mime,
        fileSize: file.size,
        attachment: file.buffer,
        caption: cleanComment,
        isInternal: true,
        createdBy: updatedBy,
        updatedBy
      } as Types.AttachmentInterface, { transaction })
    }
  })

  res.status(201).json({ success: true, data: offense })
})
