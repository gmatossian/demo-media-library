import { Observable, OperatorFunction, catchError, map, of, scan, startWith, switchMap } from 'rxjs';

import { CatalogEntry, CatalogFilters } from '../catalog-entry';
import { describeError } from '../../shared/api-problem';

export interface ListState {
  /** The criteria most recently requested. */
  requested: CatalogFilters;
  /** The entries on screen and the criteria they were loaded for. */
  result: { filters: CatalogFilters; entries: CatalogEntry[] } | null;
  loading: boolean;
  error: string | null;
}

type ListEvent =
  | { kind: 'started'; filters: CatalogFilters }
  | { kind: 'loaded'; filters: CatalogFilters; entries: CatalogEntry[] }
  | { kind: 'failed'; filters: CatalogFilters; message: string };

/**
 * Loads entries for each requested filter. `switchMap` unsubscribes from the
 * previous request when a new one starts (HttpClient then aborts it), so an
 * older response can never replace results for the current query. Previous
 * results stay visible while the next ones load, to avoid flicker while typing.
 */
export function loadEntries(
  fetch: (filters: CatalogFilters) => Observable<CatalogEntry[]>,
  initial: CatalogFilters,
): OperatorFunction<CatalogFilters, ListState> {
  const initialState: ListState = { requested: initial, result: null, loading: true, error: null };
  return (filters$) =>
    filters$.pipe(
      switchMap((filters) =>
        fetch(filters).pipe(
          map((entries): ListEvent => ({ kind: 'loaded', filters, entries })),
          catchError((error: unknown) =>
            of<ListEvent>({ kind: 'failed', filters, message: describeError(error).message }),
          ),
          startWith<ListEvent>({ kind: 'started', filters }),
        ),
      ),
      scan(reduce, initialState),
      startWith(initialState),
    );
}

function reduce(state: ListState, event: ListEvent): ListState {
  switch (event.kind) {
    case 'started':
      return { ...state, requested: event.filters, loading: true, error: null };
    case 'loaded':
      return {
        requested: event.filters,
        result: { filters: event.filters, entries: event.entries },
        loading: false,
        error: null,
      };
    case 'failed':
      return { requested: event.filters, result: null, loading: false, error: event.message };
  }
}
