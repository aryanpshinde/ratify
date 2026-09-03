import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

interface ZodIssue {
  path?: (string | number)[];
  message?: string;
}

export function applyValidationIssues<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return false;
  }

  const issues = Array.isArray(error.issues) ? (error.issues as ZodIssue[]) : [];

  if (issues.length === 0) {
    setError('root' as Path<TFieldValues>, { message: error.message });
    return true;
  }

  for (const issue of issues) {
    const message = issue.message ?? 'Invalid value';
    const path = issue.path;
    const fieldName = (path && path.length > 0 ? path.join('.') : 'root') as Path<TFieldValues>;
    setError(fieldName, { message });
  }

  return true;
}
