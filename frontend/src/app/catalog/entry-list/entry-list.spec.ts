import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of } from 'rxjs';

import { CatalogApi } from '../catalog-api';
import { DemoDataApi } from '../../demo/demo-data-api';
import { EntryList } from './entry-list';

/** Longer than the 300 ms search debounce. */
const AFTER_DEBOUNCE_MS = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('EntryList search and URL coordination', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'entries', component: EntryList }]),
        provideLocationMocks(),
        { provide: CatalogApi, useValue: { list: () => of([]) } },
        { provide: DemoDataApi, useValue: { resets: NEVER } },
      ],
    });
    router = TestBed.inject(Router);
    // Normally done by the app's initial navigation: lets Back/Forward reach the router.
    router.setUpLocationChangeListener();
    harness = await RouterTestingHarness.create('/entries');
  });

  const searchInput = () => harness.routeNativeElement!.querySelector<HTMLInputElement>('#catalog-search')!;
  const typeSelect = () => harness.routeNativeElement!.querySelector<HTMLSelectElement>('#catalog-type')!;

  async function typeQuery(text: string): Promise<void> {
    searchInput().value = text;
    searchInput().dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }

  async function chooseType(value: string): Promise<void> {
    typeSelect().value = value;
    typeSelect().dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
  }

  async function clickClear(): Promise<void> {
    const clear = [...harness.routeNativeElement!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Clear',
    )!;
    expect(clear.disabled).toBe(false);
    clear.click();
    await harness.fixture.whenStable();
  }

  /** The router handles Back/Forward on a later task, as in a browser. */
  async function goBack(): Promise<void> {
    TestBed.inject(Location).back();
    await wait(20);
    await harness.fixture.whenStable();
  }

  async function goForward(): Promise<void> {
    TestBed.inject(Location).forward();
    await wait(20);
    await harness.fixture.whenStable();
  }

  async function afterDebounce(): Promise<void> {
    await wait(AFTER_DEBOUNCE_MS);
    await harness.fixture.whenStable();
  }

  it('Clear cancels a search that is still waiting to be applied', async () => {
    await typeQuery('dune');
    await afterDebounce();
    expect(router.url).toBe('/entries?q=dune');

    await typeQuery('dunes');
    await clickClear();
    await afterDebounce();

    expect(router.url).toBe('/entries');
    expect(searchInput().value).toBe('');
  });

  it('searches for the same query again after Clear', async () => {
    await typeQuery('dune');
    await afterDebounce();
    await clickClear();
    expect(router.url).toBe('/entries');

    await typeQuery('dune');
    await afterDebounce();

    expect(router.url).toBe('/entries?q=dune');
  });

  it('lets Back win over typing that is still pending', async () => {
    await chooseType('FILM');
    expect(router.url).toBe('/entries?type=FILM');

    await typeQuery('dune');
    await goBack();
    await afterDebounce();

    expect(router.url).toBe('/entries');
    expect(searchInput().value).toBe('');
    expect(typeSelect().value).toBe('');
  });

  it('lets Forward win over pending typing and shows the restored query', async () => {
    await typeQuery('dune');
    await afterDebounce();
    await chooseType('FILM');
    await goBack();
    expect(router.url).toBe('/entries?q=dune');

    await typeQuery('dune messiah');
    await goForward();
    await afterDebounce();

    expect(router.url).toBe('/entries?q=dune&type=FILM');
    expect(searchInput().value).toBe('dune');
  });

  it('Back restores the query even when the type filter is unchanged', async () => {
    await typeQuery('dune');
    await afterDebounce();
    await clickClear();
    expect(router.url).toBe('/entries');

    await goBack();

    expect(router.url).toBe('/entries?q=dune');
    expect(searchInput().value).toBe('dune');
  });

  it('choosing a type keeps the query typed so far', async () => {
    await typeQuery('dune');
    await chooseType('FILM');
    await afterDebounce();

    expect(router.url).toBe('/entries?q=dune&type=FILM');
    expect(searchInput().value).toBe('dune');
  });
});
