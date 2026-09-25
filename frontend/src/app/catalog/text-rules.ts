/**
 * Field rules shared with the backend (EntryValidator / TextRules). Both sides
 * trim Unicode White_Space characters and count length after trimming in
 * UTF-16 code units (JavaScript `length`, Java `String.length()`).
 */
export const LIMITS = {
  titleMaxLength: 200,
  creatorMaxLength: 200,
  descriptionMaxLength: 2000,
  yearMin: 1000,
  yearMax: 2100,
} as const;

const EDGE_WHITESPACE = /^\p{White_Space}+|\p{White_Space}+$/gu;

export function trimWhitespace(value: string | null | undefined): string {
  return (value ?? '').replace(EDGE_WHITESPACE, '');
}

/** Trimmed text, or null when blank. */
export function trimToNull(value: string | null | undefined): string | null {
  const trimmed = trimWhitespace(value);
  return trimmed === '' ? null : trimmed;
}
