// Strip any path, control characters and quotes the browser sent; never trust it for anything but display
const cleanFileName = (name: string, fallback = 'file') => {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[\u0000-\u001f\u007f"]/g, '').trim().slice(0, 255)

  return cleaned || fallback
}

export default cleanFileName
