import { join } from 'path';

/**
 * Project public root (static files). Override with PUBLIC_DIR on WHM if cwd differs.
 */
export function getPublicRoot() {
  if (process.env.PUBLIC_DIR) {
    return process.env.PUBLIC_DIR.replace(/\/$/, '');
  }
  return join(process.cwd(), 'public');
}

/**
 * Writable uploads directory. Override with UPLOAD_DIR on WHM (must be web-accessible).
 * Default: {public}/uploads
 */
export function getUploadDir(folder = 'uploads') {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR.replace(/\/$/, '');
  }
  return join(getPublicRoot(), folder);
}

/** Public URL path for a stored file */
export function uploadPublicUrl(folder, filename) {
  if (process.env.UPLOAD_URL_PREFIX) {
    const prefix = process.env.UPLOAD_URL_PREFIX.replace(/\/$/, '');
    return `${prefix}/${filename}`;
  }
  return `/${folder}/${filename}`;
}
