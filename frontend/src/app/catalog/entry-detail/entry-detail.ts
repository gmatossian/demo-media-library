import { DatePipe } from '@angular/common';
import { Component, ElementRef, Injector, afterNextRender, effect, inject, input, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { CatalogApi } from '../catalog-api';
import { CREATOR_LABELS, CatalogEntry, MEDIA_TYPE_LABELS } from '../catalog-entry';
import { EntryLoadState, loadEntry } from '../entry-loader';
import { describeError } from '../../shared/api-problem';
import { Notices } from '../../shared/notices';

@Component({
  selector: 'app-entry-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './entry-detail.html',
  styleUrl: './entry-detail.css',
})
export class EntryDetail {
  private readonly api = inject(CatalogApi);
  private readonly notices = inject(Notices);
  private readonly injector = inject(Injector);

  /** Route parameter, bound by the router. */
  readonly id = input<string>();

  protected readonly typeLabels = MEDIA_TYPE_LABELS;
  protected readonly creatorLabels = CREATOR_LABELS;

  protected readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => loadEntry(this.api, id))), {
    initialValue: { status: 'loading' } as EntryLoadState,
  });

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  private readonly cancelDeleteButton = viewChild<ElementRef<HTMLButtonElement>>('cancelDeleteButton');

  constructor() {
    const title = inject(Title);
    effect(() => {
      const state = this.state();
      if (state.status === 'loaded') {
        title.setTitle(`${state.entry.title} · Media Library`);
      }
    });
  }

  protected askToDelete(): void {
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
    // Start on the safe choice.
    afterNextRender(() => this.cancelDeleteButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  protected confirmDelete(entry: CatalogEntry): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.api.delete(entry.id).subscribe({
      next: () => void this.notices.navigateAndShow('/entries', `Deleted “${entry.title}”.`),
      error: (error: unknown) => {
        const problem = describeError(error);
        this.deleting.set(false);
        this.deleteError.set(
          problem.status === 404
            ? 'This entry no longer exists. It may already have been deleted.'
            : `The entry was not deleted. ${problem.message}`,
        );
      },
    });
  }
}
