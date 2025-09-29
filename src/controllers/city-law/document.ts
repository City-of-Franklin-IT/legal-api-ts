import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import archiver from 'archiver'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { Document } from '@/models/city-law'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import * as Types from '@/models/city-law/types'

//@desc    Get document
//@route   GET /api/v1/legal/city-law/document/:docId
//@access  Private
export const getDocument = asyncHandler(async (req: Request<{ docId: string }>, res: Response, next: NextFunction) => {
  const file = await Document.findOne({
    where: {
      DOC_ID: req.params.docId
    }
  }) as Model<Types.DocumentInterface> & Types.DocumentInterface

  if(!file) {
    return next(new ErrorResponse(`Unable to return document by docId ${ req.params.docId }`, 500))
  }

  const absolutePath = path.join('/mnt/City_Law', file.FILE_PATH)

  const stats = await fs.promises.stat(absolutePath)

  const mimeType = mime.lookup(absolutePath) || 'application/octet-stream'

  res.setHeader('Content-Type', mimeType)
  res.setHeader('Content-Length', stats.size.toString())

  const filename = path.basename(file.FILE_PATH)
  res.setHeader('Content-Disposition', `inline; filename="${ filename }"`)

  res.sendFile(absolutePath, (err) => {
    if(err) {
      console.error('Error sending file:', err);
      if(!res.headersSent) {
        return next(new ErrorResponse('Failed to send file', 500));
      }
    }
  })
})

//@desc    Get documents as zip
//@route   GET /api/v1/legal/city-law/document/zip/:matterId
//@access  Private
export const getDocumentsZip = asyncHandler(async (req: Request<{ matterId: string }>, res: Response, next: NextFunction) => {
  const documents = await Document.findAll({
    where: {
      MATTER_ID: req.params.matterId
    }
  }) as (Model<Types.DocumentInterface> & Types.DocumentInterface)[]

  if(!documents || documents.length === 0) {
    return next(new ErrorResponse(`No documents found for matter ID ${ req.params.matterId }`, 404))
  }

  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  archive.on('error', (err) => {
    console.error('Archive error:', err)
    if(!res.headersSent) {
      return next(new ErrorResponse('Failed to create zip archive', 500))
    }
  })

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="matter_${ req.params.matterId }_documents.zip"`)

  archive.pipe(res)

  for(const document of documents) {
    const absolutePath = path.join('/mnt/City_Law', document.FILE_PATH)

    const fileExists = await fs.promises.access(absolutePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)

    if(fileExists) {
      const filename = path.basename(document.FILE_PATH)
      archive.file(absolutePath, { name: filename })
    } else {
      console.error(`File not found: ${ absolutePath }`)
    }
  }

  await archive.finalize()
})