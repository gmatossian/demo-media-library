import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DemoDataApi {
  private readonly http = inject(HttpClient);
  private readonly resetsSubject = new Subject<void>();

  /** Emits after a successful reset so open views can reload. */
  readonly resets: Observable<void> = this.resetsSubject.asObservable();

  /** Replaces every catalog entry with the sample catalog. */
  reset(): Observable<void> {
    return this.http
      .post<void>('/api/demo/reset', null)
      .pipe(tap(() => this.resetsSubject.next()));
  }
}
