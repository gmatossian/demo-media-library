import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * One-off confirmations ("Deleted …") shown by the app shell. A notice is set
 * after navigating to the view it describes and cleared by the next navigation.
 */
@Injectable({ providedIn: 'root' })
export class Notices {
  private readonly router = inject(Router);
  readonly message = signal<string | null>(null);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.message.set(null));
  }

  async navigateAndShow(url: string, message: string): Promise<void> {
    await this.router.navigateByUrl(url);
    this.message.set(message);
  }

  dismiss(): void {
    this.message.set(null);
  }
}
