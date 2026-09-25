import { Routes } from '@angular/router';

import { EntryDetail } from './catalog/entry-detail/entry-detail';
import { EntryForm } from './catalog/entry-form/entry-form';
import { EntryList } from './catalog/entry-list/entry-list';
import { NotFound } from './shared/not-found/not-found';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'entries' },
  { path: 'entries', component: EntryList, title: 'Catalog · Media Library' },
  { path: 'entries/new', component: EntryForm, title: 'Add entry · Media Library' },
  { path: 'entries/:id', component: EntryDetail, title: 'Entry · Media Library' },
  { path: 'entries/:id/edit', component: EntryForm, title: 'Edit entry · Media Library' },
  { path: '**', component: NotFound, title: 'Page not found · Media Library' },
];
