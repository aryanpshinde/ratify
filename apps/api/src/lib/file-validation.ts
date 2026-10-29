import {
  isAllowedFileMimeType,
  MAX_FILE_NAME_LENGTH,
  MAX_FILE_SIZE_BYTES,
  type AllowedFileMimeType,
} from '@ratify/shared';

const extensionMimeTypes: Record<string, AllowedFileMimeType> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
};

export function getFileBasename(fileName: string): string {
  return fileName.split(/[\\/]/).pop() ?? '';
}

export function getFileExtension(fileName: string): string {
  const base = getFileBasename(fileName);
  const dotIndex = base.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === base.length - 1) return '';
  return base.slice(dotIndex + 1).toLowerCase();
}

export function resolveFileMimeType(
  fileName: string,
  declaredType: string,
): AllowedFileMimeType | null {
  const extensionMime = extensionMimeTypes[getFileExtension(fileName)];
  if (extensionMime) return extensionMime;
  if (declaredType && isAllowedFileMimeType(declaredType)) return declaredType;
  return null;
}

export function sanitizeFileName(fileName: string): string {
  const base = getFileBasename(fileName)
    .replace(/[\p{Cc}"';]+/gu, '')
    .trim();
  if (base === '.' || base === '..') {
    return '';
  }
  return base;
}

export function isFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > MAX_FILE_SIZE_BYTES;
}

export function isFileNameTooLong(fileName: string): boolean {
  return fileName.length > MAX_FILE_NAME_LENGTH;
}
