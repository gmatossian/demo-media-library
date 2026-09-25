import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h1>Page not found</h1>
    <p>There is no page at this address.</p>
    <p><a routerLink="/entries">Go to the catalog</a></p>
  `,
})
export class NotFound {}
