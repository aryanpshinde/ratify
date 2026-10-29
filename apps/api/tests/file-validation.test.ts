import { describe, expect, it } from 'vitest';
import { isAllowedFileMimeType, MAX_FILE_NAME_LENGTH, MAX_FILE_SIZE_BYTES } from '@ratify/shared';
import {
  getFileExtension,
  isFileNameTooLong,
  isFileTooLarge,
  resolveFileMimeType,
  sanitizeFileName,
} from '../src/lib/file-validation.js';

describe('file validation', () => {
  it('resolves the mime type from the extension when known', () => {
    expect(resolveFileMimeType('design.pdf', '')).toBe('application/pdf');
    expect(resolveFileMimeType('logo.png', 'application/octet-stream')).toBe('image/png');
    expect(resolveFileMimeType('shot.jpg', '')).toBe('image/jpeg');
    expect(resolveFileMimeType('shot.jpeg', '')).toBe('image/jpeg');
    expect(resolveFileMimeType('notes.txt', '')).toBe('text/plain');
    expect(resolveFileMimeType('notes.md', '')).toBe('text/markdown');
    expect(resolveFileMimeType('contract.docx', '')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(resolveFileMimeType('archive.zip', '')).toBe('application/zip');
  });

  it('falls back to the declared type when the extension is missing but allowed', () => {
    expect(resolveFileMimeType('artifact', 'image/webp')).toBe('image/webp');
    expect(resolveFileMimeType('artifact', 'application/pdf')).toBe('application/pdf');
  });

  it('rejects disallowed and unknown types', () => {
    expect(resolveFileMimeType('payload.html', 'text/html')).toBeNull();
    expect(resolveFileMimeType('payload.svg', 'image/svg+xml')).toBeNull();
    expect(resolveFileMimeType('payload.bin', 'application/octet-stream')).toBeNull();
    expect(resolveFileMimeType('payload', '')).toBeNull();
  });

  it('accepts only allowlisted mime types via the shared predicate', () => {
    expect(isAllowedFileMimeType('image/png')).toBe(true);
    expect(isAllowedFileMimeType('image/svg+xml')).toBe(false);
  });

  it('extracts the extension respecting case and absence', () => {
    expect(getFileExtension('FILE.PDF')).toBe('pdf');
    expect(getFileExtension('no-extension')).toBe('');
    expect(getFileExtension('.env')).toBe('');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('sanitizes file names to a bare basename', () => {
    expect(sanitizeFileName('..\\..\\evil"file).txt')).toBe('evilfile).txt');
    expect(sanitizeFileName('/tmp/a/b\nreport.pdf')).toBe('breport.pdf');
    expect(sanitizeFileName('  spaced  name.txt ')).toBe('spaced  name.txt');
    expect(sanitizeFileName('')).toBe('');
  });

  it('rejects dot-only file names', () => {
    expect(sanitizeFileName('.')).toBe('');
    expect(sanitizeFileName('..')).toBe('');
    expect(sanitizeFileName('/path/to/..')).toBe('');
  });

  it('enforces the 10 MB cap boundary', () => {
    expect(isFileTooLarge(MAX_FILE_SIZE_BYTES)).toBe(false);
    expect(isFileTooLarge(MAX_FILE_SIZE_BYTES + 1)).toBe(true);
    expect(isFileTooLarge(0)).toBe(false);
  });

  it('enforces the file name length cap boundary', () => {
    expect(isFileNameTooLong('a'.repeat(MAX_FILE_NAME_LENGTH - 1))).toBe(false);
    expect(isFileNameTooLong('a'.repeat(MAX_FILE_NAME_LENGTH))).toBe(false);
    expect(isFileNameTooLong('a'.repeat(MAX_FILE_NAME_LENGTH + 1))).toBe(true);
  });
});
