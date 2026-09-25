import { HttpErrorResponse } from '@angular/common/http';

export interface ApiProblem {
  /** Message suitable for display. */
  message: string;
  /** Field name to message, from a validation problem. */
  fieldErrors: Record<string, string>;
  status: number;
}

/** Turns an HTTP failure into something the UI can show. */
export function describeError(error: unknown): ApiProblem {
  if (!(error instanceof HttpErrorResponse)) {
    return { message: 'Something went wrong.', fieldErrors: {}, status: 0 };
  }
  const body = error.error;
  const isProblem = body !== null && typeof body === 'object' && typeof body.status === 'number';
  if (isProblem) {
    return {
      message: typeof body.detail === 'string' ? body.detail : `Request failed (${error.status}).`,
      fieldErrors: isRecordOfStrings(body.errors) ? body.errors : {},
      status: error.status,
    };
  }
  const message =
    error.status === 0 || error.status >= 500
      ? 'The catalog service could not be reached. Check that the backend is running.'
      : `Request failed (${error.status}).`;
  return { message, fieldErrors: {}, status: error.status };
}

/**
 * A save whose result is unknown: no response at all (network failure) or any
 * 5xx, including API problem responses. The change may or may not have been
 * stored, so the user should check before trying again. 4xx responses are
 * definite failures: nothing was changed.
 */
export function isUncertainOutcome(problem: ApiProblem): boolean {
  return problem.status === 0 || problem.status >= 500;
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}
