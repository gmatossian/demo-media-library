import { Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';

import { DemoDataApi } from '../demo-data-api';
import { describeError } from '../../shared/api-problem';
import { Notices } from '../../shared/notices';

/** Small header control that restores the sample catalog after confirmation. */
@Component({
  selector: 'app-demo-reset',
  templateUrl: './demo-reset.html',
  styleUrl: './demo-reset.css',
})
export class DemoReset {
  private readonly demoData = inject(DemoDataApi);
  private readonly notices = inject(Notices);
  private readonly injector = inject(Injector);

  protected readonly confirming = signal(false);
  protected readonly resetting = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  protected ask(): void {
    this.error.set(null);
    this.confirming.set(true);
    afterNextRender(() => this.cancelButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancel(): void {
    this.confirming.set(false);
    this.error.set(null);
  }

  protected reset(): void {
    this.resetting.set(true);
    this.error.set(null);
    this.demoData.reset().subscribe({
      next: () => {
        this.resetting.set(false);
        this.confirming.set(false);
        void this.notices.navigateAndShow('/entries', 'Demo data reset: the sample catalog has been restored.');
      },
      error: (error: unknown) => {
        this.resetting.set(false);
        this.error.set(`Reset failed; the catalog was not changed. ${describeError(error).message}`);
      },
    });
  }
}
