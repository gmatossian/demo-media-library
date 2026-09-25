import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith } from 'rxjs';

import { CatalogApi } from './catalog-api';
import { CatalogEntry } from './catalog-entry';
import { describeError } from '../shared/api-problem';

export type EntryLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; entry: CatalogEntry }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

/** Parses a route id; anything but a positive integer is treated as missing. */
export function parseEntryId(raw: string | undefined): number | null {
  return raw && /^[1-9]\d{0,15}$/.test(raw) ? Number(raw) : null;
}

/** Loads one entry for detail/edit views, distinguishing "missing" from failures. */
export function loadEntry(api: CatalogApi, rawId: string | undefined): Observable<EntryLoadState> {
  const id = parseEntryId(rawId);
  if (id === null) {
    return of({ status: 'not-found' });
  }
  return api.get(id).pipe(
    map((entry): EntryLoadState => ({ status: 'loaded', entry })),
    catchError((error: unknown) =>
      of<EntryLoadState>(
        error instanceof HttpErrorResponse && error.status === 404
          ? { status: 'not-found' }
          : { status: 'error', message: describeError(error).message },
      ),
    ),
    startWith<EntryLoadState>({ status: 'loading' }),
  );
}
