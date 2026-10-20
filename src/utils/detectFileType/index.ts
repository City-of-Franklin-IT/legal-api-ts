export interface FileTypeInterface {
  mime: string
  ext: string
}

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) => bytes.every((byte, i) => buffer[offset + i] === byte)

//@desc    Identify a PDF or image from its leading bytes; null when the contents aren't an allowed type
export default (buffer: Buffer): FileTypeInterface | null => {
  if(startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return { mime: 'application/pdf', ext: 'pdf' }
  if(startsWith(buffer, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' }
  if(startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' }
  if(startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif' }
  if(startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: 'image/webp', ext: 'webp' }

  return null
}
