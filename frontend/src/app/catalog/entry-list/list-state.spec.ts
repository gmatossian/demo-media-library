import { Subject } from 'rxjs';

import { CatalogEntry, CatalogFilters, NO_FILTERS } from '../catalog-entry';
import { ListState, loadEntries } from './list-state';

function entry(id: number, title: string): CatalogEntry {
  return {
    id,
    type: 'BOOK',
    title,
    creator: 'Someone',
    releaseYear: null,
    description: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('loadEntries', () => {
  it('never lets an older response overwrite results for the current query', () => {
    const filters$ = new Subject<CatalogFilters>();
    const responses = new Map<string, Subject<CatalogEntry[]>>();
    const fetch = (filters: CatalogFilters) => {
      const response = new Subject<CatalogEntry[]>();
      responses.set(filters.q, response);
      return response;
    };
    const states: ListState[] = [];
    filters$.pipe(loadEntries(fetch, NO_FILTERS)).subscribe((state) => states.push(state));

    filters$.next({ q: 'dun', type: null });
    filters$.next({ q: 'dune', type: null });

    // The slow response for the old query arrives after the new query started.
    responses.get('dun')!.next([entry(1, 'Dunes of Somewhere'), entry(2, 'Dune')]);
    expect(states.at(-1)).toMatchObject({ requested: { q: 'dune' }, loading: true, result: null });

    responses.get('dune')!.next([entry(2, 'Dune')]);
    expect(states.at(-1)).toMatchObject({
      requested: { q: 'dune' },
      loading: false,
      result: { filters: { q: 'dune' }, entries: [entry(2, 'Dune')] },
    });
    expect(states.some((state) => state.result?.filters.q === 'dun')).toBe(false);
  });

  it('keeps showing the previous results while the next query loads', () => {
    const filters$ = new Subject<CatalogFilters>();
    const responses: Subject<CatalogEntry[]>[] = [];
    const fetch = () => {
      const response = new Subject<CatalogEntry[]>();
      responses.push(response);
      return response;
    };
    const states: ListState[] = [];
    filters$.pipe(loadEntries(fetch, NO_FILTERS)).subscribe((state) => states.push(state));

    filters$.next(NO_FILTERS);
    responses[0].next([entry(1, 'Arrival')]);
    filters$.next({ q: 'x', type: null });

    expect(states.at(-1)).toMatchObject({
      requested: { q: 'x' },
      loading: true,
      result: { filters: NO_FILTERS, entries: [entry(1, 'Arrival')] },
    });
  });
});
