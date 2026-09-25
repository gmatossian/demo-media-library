export type MediaType = 'BOOK' | 'FILM' | 'ALBUM';

export const MEDIA_TYPES: readonly MediaType[] = ['BOOK', 'FILM', 'ALBUM'];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  BOOK: 'Book',
  FILM: 'Film',
  ALBUM: 'Album',
};

/** One `creator` field, labelled for the kind of entry. */
export const CREATOR_LABELS: Record<MediaType, string> = {
  BOOK: 'Author',
  FILM: 'Director',
  ALBUM: 'Artist',
};

export function isMediaType(value: unknown): value is MediaType {
  return MEDIA_TYPES.includes(value as MediaType);
}

/** A catalog record as returned by the API. Timestamps are ISO-8601 UTC. */
export interface CatalogEntry {
  id: number;
  type: MediaType;
  title: string;
  creator: string;
  releaseYear: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The descriptive fields a client may create or replace. */
export interface EntryInput {
  type: MediaType;
  title: string;
  creator: string;
  releaseYear: number | null;
  description: string | null;
}

/** List criteria; an empty query means no title search. */
export interface CatalogFilters {
  q: string;
  type: MediaType | null;
}

export const NO_FILTERS: CatalogFilters = { q: '', type: null };

export function hasFilters(filters: CatalogFilters): boolean {
  return filters.q !== '' || filters.type !== null;
}
