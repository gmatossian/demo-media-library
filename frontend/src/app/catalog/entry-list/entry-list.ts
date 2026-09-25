import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, NavigationStart, ParamMap, Router, RouterLink } from '@angular/router';
import { Subject, combineLatest, distinctUntilChanged, map, merge, startWith, switchMap, takeUntil, timer } from 'rxjs';

import { CatalogApi } from '../catalog-api';
import {
  CatalogFilters,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  MediaType,
  NO_FILTERS,
  hasFilters,
  isMediaType,
} from '../catalog-entry';
import { trimWhitespace } from '../text-rules';
import { DemoDataApi } from '../../demo/demo-data-api';
import { loadEntries } from './list-state';

const SEARCH_DEBOUNCE_MS = 300;

/** Router `info` marking navigations made by this view's own filter controls. */
const FILTER_NAVIGATION = 'catalog-filters';

/**
 * Catalog list. The URL (?q=&type=) is the source of truth for filters.
 *
 * Typing is applied to the URL after a short pause. Anything else that changes
 * the URL — Clear, choosing a type, Back/Forward, links, reset — cancels typing
 * that has not been applied yet, so a stale keystroke never overrides it.
 */
@Component({
  selector: 'app-entry-list',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './entry-list.html',
  styleUrl: './entry-list.css',
})
export class EntryList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogApi);
  private readonly demoData = inject(DemoDataApi);

  protected readonly mediaTypes = MEDIA_TYPES;
  protected readonly typeLabels = MEDIA_TYPE_LABELS;
  protected readonly hasFilters = hasFilters;

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly typeControl = new FormControl<MediaType | ''>('', { nonNullable: true });

  private readonly retries = new Subject<void>();
  /** Drops typing that has not been applied to the URL yet. */
  private readonly pendingSearchCancels = new Subject<void>();
  /** Whether the navigation in progress was started by this view's controls. */
  private filterNavigationInProgress = false;

  private readonly filters$ = this.route.queryParamMap.pipe(
    map(parseFilters),
    distinctUntilChanged(sameFilters),
  );

  /** Reloads when the filters change, on retry, and after a demo-data reset. */
  protected readonly state = toSignal(
    combineLatest([
      this.filters$,
      merge(this.retries, this.demoData.resets).pipe(startWith(undefined)),
    ]).pipe(
      map(([filters]) => filters),
      loadEntries((filters) => this.api.list(filters), NO_FILTERS),
    ),
    { requireSync: true },
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.showUrlFilters();

    // Navigations this view did not start win over pending typing, and the
    // controls then show the filters from their URL.
    this.router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.filterNavigationInProgress = this.router.currentNavigation()?.extras.info === FILTER_NAVIGATION;
        if (!this.filterNavigationInProgress) {
          this.pendingSearchCancels.next();
        }
      } else if (event instanceof NavigationEnd && !this.filterNavigationInProgress) {
        this.showUrlFilters();
      }
    });

    // A cancellable debounce. The result is compared with the URL rather than the
    // previous keystroke, so the same query can be applied again after Clear.
    this.searchControl.valueChanges
      .pipe(
        switchMap((value) =>
          timer(SEARCH_DEBOUNCE_MS).pipe(
            map(() => trimWhitespace(value)),
            takeUntil(this.pendingSearchCancels),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((q) => {
        if (q !== this.urlFilters().q) {
          this.navigate({ q: q || null }, true);
        }
      });

    // A new type applies together with whatever query has been typed so far.
    this.typeControl.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((type) => {
      this.pendingSearchCancels.next();
      this.navigate({ q: trimWhitespace(this.searchControl.value) || null, type: type || null }, false);
    });
  }

  protected clearFilters(): void {
    this.pendingSearchCancels.next();
    this.searchControl.setValue('', { emitEvent: false });
    this.typeControl.setValue('', { emitEvent: false });
    this.navigate({ q: null, type: null }, false);
  }

  protected retry(): void {
    this.retries.next();
  }

  private urlFilters(): CatalogFilters {
    return parseFilters(this.route.snapshot.queryParamMap);
  }

  private showUrlFilters(): void {
    const filters = this.urlFilters();
    this.searchControl.setValue(filters.q, { emitEvent: false });
    this.typeControl.setValue(filters.type ?? '', { emitEvent: false });
  }

  /** Typing replaces the history entry; choosing a type or clearing adds one. */
  private navigate(params: { q?: string | null; type?: string | null }, replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl,
      info: FILTER_NAVIGATION,
    });
  }
}

function parseFilters(params: ParamMap): CatalogFilters {
  const type = params.get('type');
  return { q: trimWhitespace(params.get('q')), type: isMediaType(type) ? type : null };
}

function sameFilters(a: CatalogFilters, b: CatalogFilters): boolean {
  return a.q === b.q && a.type === b.type;
}
