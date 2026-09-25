import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { DemoReset } from './demo/demo-reset/demo-reset';
import { Notices } from './shared/notices';

/** App shell: header with demo label and reset, notices, and the routed view. */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, DemoReset],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly notices = inject(Notices);
}
