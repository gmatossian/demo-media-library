import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CatalogEntry, CatalogFilters, EntryInput } from './catalog-entry';
import { trimWhitespace } from './text-rules';

/** HTTP access to /api/entries. Filtering and ordering happen on the server. */
@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/entries';

  list(filters: CatalogFilters): Observable<CatalogEntry[]> {
    let params = new HttpParams();
    const q = trimWhitespace(filters.q);
    if (q) {
      params = params.set('q', q);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    return this.http.get<CatalogEntry[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<CatalogEntry> {
    return this.http.get<CatalogEntry>(`${this.baseUrl}/${id}`);
  }

  create(input: EntryInput): Observable<CatalogEntry> {
    return this.http.post<CatalogEntry>(this.baseUrl, input);
  }

  update(id: number, input: EntryInput): Observable<CatalogEntry> {
    return this.http.put<CatalogEntry>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
