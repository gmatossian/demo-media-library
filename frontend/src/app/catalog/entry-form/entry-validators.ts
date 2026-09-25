import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isMediaType } from '../catalog-entry';
import { LIMITS, trimToNull, trimWhitespace } from '../text-rules';

// Error values are display messages matching the backend's wording.

export function requiredText(label: string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    trimToNull(control.value) === null ? { required: `${label} is required.` } : null;
}

export function maxTrimmedLength(label: string, max: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    trimWhitespace(control.value).length > max
      ? { maxLength: `${label} must be at most ${max} characters.` }
      : null;
}

export const requiredMediaType: ValidatorFn = (control) =>
  isMediaType(control.value) ? null : { required: 'Type is required.' };

/** Blank is allowed (no year); otherwise a whole number within the limits. */
export const releaseYearRule: ValidatorFn = (control: AbstractControl<string>) => {
  const text = trimWhitespace(control.value);
  if (text === '') {
    return null;
  }
  if (!/^\d+$/.test(text)) {
    return { year: 'Release year must be a whole number, for example 1987.' };
  }
  const year = Number(text);
  return year < LIMITS.yearMin || year > LIMITS.yearMax
    ? { year: `Release year must be between ${LIMITS.yearMin} and ${LIMITS.yearMax}.` }
    : null;
};

/** The API value for the year field: a number, or null when left blank. */
export function parseReleaseYear(value: string): number | null {
  const text = trimWhitespace(value);
  return text === '' ? null : Number(text);
}

export function firstErrorMessage(errors: ValidationErrors | null): string | null {
  if (!errors) {
    return null;
  }
  const first = Object.values(errors)[0];
  return typeof first === 'string' ? first : 'This value is not valid.';
}
