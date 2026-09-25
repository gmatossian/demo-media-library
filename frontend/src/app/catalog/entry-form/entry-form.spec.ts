import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { CatalogEntry } from '../catalog-entry';
import { EntryForm } from './entry-form';

@Component({ template: '' })
class Placeholder {}

const EXISTING: CatalogEntry = {
  id: 7,
  type: 'FILM',
  title: 'Glass Harbour',
  creator: 'Anouk Brevik',
  releaseYear: null,
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

type Respond = (request: TestRequest) => void;

const networkFailure: Respond = (request) => request.error(new ProgressEvent('error'));
const apiServerError: Respond = (request) =>
  request.flush(
    { title: 'Server error', status: 500, detail: 'The server could not complete the request.' },
    { status: 500, statusText: 'Internal Server Error' },
  );
const gatewayError: Respond = (request) => request.flush('', { status: 502, statusText: 'Bad Gateway' });

describe('EntryForm save failures', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'entries/new', component: EntryForm },
            { path: 'entries/:id/edit', component: EntryForm },
            { path: '**', component: Placeholder },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  const page = () => harness.routeNativeElement!;
  const field = (id: string) => page().querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
  const alertText = () => page().querySelector('[role="alert"]')?.textContent ?? '';
  const checkLink = () => page().querySelector<HTMLAnchorElement>('[role="alert"] a');

  async function openCreateForm(): Promise<void> {
    await harness.navigateByUrl('/entries/new');
    setValue('entry-type', 'BOOK', 'change');
    setValue('entry-title', 'Salt & Circuitry');
    setValue('entry-creator', 'Idris Venhale');
    setValue('entry-year', '2014');
    await harness.fixture.whenStable();
  }

  async function openEditForm(): Promise<void> {
    await harness.navigateByUrl('/entries/7/edit');
    http.expectOne('/api/entries/7').flush(EXISTING);
    await harness.fixture.whenStable();
    setValue('entry-title', 'Glass Harbour (restored)');
    await harness.fixture.whenStable();
  }

  function setValue(id: string, value: string, event = 'input'): void {
    field(id).value = value;
    field(id).dispatchEvent(new Event(event));
  }

  async function submit(): Promise<TestRequest> {
    page().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await harness.fixture.whenStable();
    return http.expectOne((request) => request.url.startsWith('/api/entries') && request.method !== 'GET');
  }

  describe.each([
    ['a network failure', networkFailure],
    ['an API 500 problem response', apiServerError],
    ['a 502 without an API body', gatewayError],
  ])('after %s', (_name, respond) => {
    it('create reports an unknown outcome, keeps the input, and does not retry', async () => {
      await openCreateForm();
      respond(await submit());
      await harness.fixture.whenStable();

      expect(alertText()).toContain('could not confirm whether the entry was saved');
      expect(checkLink()?.getAttribute('href')).toBe('/entries');
      expect(field('entry-title').value).toBe('Salt & Circuitry');
      expect(field('entry-year').value).toBe('2014');
      // afterEach: http.verify() fails if a second POST was sent.
    });

    it('edit reports an unknown outcome, keeps the edits, and does not retry', async () => {
      await openEditForm();
      respond(await submit());
      await harness.fixture.whenStable();

      expect(alertText()).toContain('could not confirm whether your changes were saved');
      expect(checkLink()?.getAttribute('href')).toBe('/entries/7');
      expect(field('entry-title').value).toBe('Glass Harbour (restored)');
    });
  });

  it('keeps validation failures definite, with field messages', async () => {
    await openEditForm();
    (await submit()).flush(
      { title: 'Invalid request', status: 400, detail: 'Some fields are invalid.', errors: { title: 'Title is taken.' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await harness.fixture.whenStable();

    expect(alertText()).toContain('Changes were not saved. Some fields are invalid.');
    expect(alertText()).not.toContain('could not confirm');
    expect(checkLink()).toBeNull();
    expect(page().querySelector('#entry-title-error')?.textContent).toContain('Title is taken.');
    expect(field('entry-title').value).toBe('Glass Harbour (restored)');
  });

  it('keeps a missing record definite', async () => {
    await openEditForm();
    (await submit()).flush(
      { title: 'Entry not found', status: 404, detail: 'No catalog entry has id 7.' },
      { status: 404, statusText: 'Not Found' },
    );
    await harness.fixture.whenStable();

    expect(alertText()).toContain('This entry no longer exists');
    expect(checkLink()).toBeNull();
  });
});
