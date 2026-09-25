import { Component, ElementRef, Injector, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, map, of, startWith, switchMap, tap } from 'rxjs';

import { CatalogApi } from '../catalog-api';
import { CREATOR_LABELS, CatalogEntry, EntryInput, MEDIA_TYPES, MEDIA_TYPE_LABELS, MediaType } from '../catalog-entry';
import { EntryLoadState, loadEntry } from '../entry-loader';
import { LIMITS, trimToNull, trimWhitespace } from '../text-rules';
import { describeError, isUncertainOutcome } from '../../shared/api-problem';
import { Notices } from '../../shared/notices';
import {
  firstErrorMessage,
  maxTrimmedLength,
  parseReleaseYear,
  releaseYearRule,
  requiredMediaType,
  requiredText,
} from './entry-validators';

type FormLoadState = EntryLoadState | { status: 'new' };
type FieldName = 'type' | 'title' | 'creator' | 'releaseYear' | 'description';

/** Raw form values: text as typed, the year as text so bad input is never silently dropped. */
interface EntryFormValue {
  type: MediaType | '';
  title: string;
  creator: string;
  releaseYear: string;
  description: string;
}

interface FormFailure {
  message: string;
  /** Set when the save's outcome is unknown: where to check before retrying. */
  check: { url: string; label: string } | null;
}

/** Shared create (/entries/new) and edit (/entries/:id/edit) form. */
@Component({
  selector: 'app-entry-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './entry-form.html',
  styleUrl: './entry-form.css',
})
export class EntryForm {
  private readonly api = inject(CatalogApi);
  private readonly notices = inject(Notices);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Route parameter; absent when creating. */
  readonly id = input<string>();

  protected readonly mediaTypes = MEDIA_TYPES;
  protected readonly typeLabels = MEDIA_TYPE_LABELS;
  protected readonly limits = LIMITS;

  protected readonly form = new FormGroup({
    type: new FormControl<MediaType | ''>('', { nonNullable: true, validators: requiredMediaType }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [requiredText('Title'), maxTrimmedLength('Title', LIMITS.titleMaxLength)],
    }),
    creator: new FormControl('', {
      nonNullable: true,
      validators: [requiredText('Creator'), maxTrimmedLength('Creator', LIMITS.creatorMaxLength)],
    }),
    releaseYear: new FormControl('', { nonNullable: true, validators: releaseYearRule }),
    description: new FormControl('', {
      nonNullable: true,
      validators: maxTrimmedLength('Description', LIMITS.descriptionMaxLength),
    }),
  });

  protected readonly loadState = toSignal(
    toObservable(this.id).pipe(
      switchMap((id): Observable<FormLoadState> => (id === undefined ? of({ status: 'new' }) : loadEntry(this.api, id))),
      tap((state) => {
        if (state.status === 'loaded') {
          this.form.reset(toFormValue(state.entry));
        }
      }),
    ),
    { initialValue: { status: 'loading' } as FormLoadState },
  );

  private readonly selectedType = toSignal(this.form.controls.type.valueChanges, { initialValue: '' as const });
  protected readonly creatorLabel = computed(() => {
    const type = this.selectedType();
    return type ? CREATOR_LABELS[type] : 'Creator';
  });
  protected readonly descriptionLength = toSignal(
    this.form.controls.description.valueChanges.pipe(
      startWith(''),
      map((value) => trimWhitespace(value).length),
    ),
    { initialValue: 0 },
  );

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly failure = signal<FormFailure | null>(null);

  /** Message for a field, once the user has left it or tried to save. */
  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted()) ? firstErrorMessage(control.errors) : null;
  }

  protected save(existing: CatalogEntry | null): void {
    this.submitted.set(true);
    this.failure.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.failure.set({ message: 'Please correct the highlighted fields.', check: null });
      this.focusFirstInvalidField();
      return;
    }

    const input = toEntryInput(this.form.getRawValue());
    const request = existing ? this.api.update(existing.id, input) : this.api.create(input);
    this.saving.set(true);
    request.subscribe({
      next: (saved) =>
        void this.notices.navigateAndShow(
          `/entries/${saved.id}`,
          existing ? 'Saved changes.' : `Added “${saved.title}”.`,
        ),
      error: (error: unknown) => this.showSaveFailure(error, existing),
    });
  }

  /** Keeps every entered value; never retries on its own. */
  private showSaveFailure(error: unknown, existing: CatalogEntry | null): void {
    const problem = describeError(error);
    this.saving.set(false);

    if (isUncertainOutcome(problem)) {
      this.failure.set(
        existing
          ? {
              message:
                'We could not confirm whether your changes were saved. Check the entry before saving ' +
                'again. Your edits are still here.',
              check: { url: `/entries/${existing.id}`, label: 'Open this entry in a new tab' },
            }
          : {
              message:
                'We could not confirm whether the entry was saved. Check the catalog before saving again, ' +
                'so you do not create a duplicate. Your input is still here.',
              check: { url: '/entries', label: 'Open the catalog in a new tab' },
            },
      );
      return;
    }

    // Definite failures: nothing was saved.
    for (const [field, message] of Object.entries(problem.fieldErrors)) {
      const control = this.form.get(field);
      control?.setErrors({ server: message });
      control?.markAsTouched();
    }
    if (existing && problem.status === 404) {
      this.failure.set({
        message: 'This entry no longer exists, so the changes could not be saved. It may have been deleted.',
        check: null,
      });
    } else {
      const prefix = existing ? 'Changes were not saved.' : 'The entry was not saved.';
      this.failure.set({ message: `${prefix} ${problem.message}`, check: null });
    }
    this.focusFirstInvalidField();
  }

  private focusFirstInvalidField(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}

function toFormValue(entry: CatalogEntry): EntryFormValue {
  return {
    type: entry.type,
    title: entry.title,
    creator: entry.creator,
    releaseYear: entry.releaseYear === null ? '' : String(entry.releaseYear),
    description: entry.description ?? '',
  };
}

/** Only called once the form is valid, so `type` is a real media type. */
function toEntryInput(value: EntryFormValue): EntryInput {
  return {
    type: value.type as MediaType,
    title: trimWhitespace(value.title),
    creator: trimWhitespace(value.creator),
    releaseYear: parseReleaseYear(value.releaseYear),
    description: trimToNull(value.description),
  };
}
