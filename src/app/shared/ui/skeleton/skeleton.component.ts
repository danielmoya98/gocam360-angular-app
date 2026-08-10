import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse rounded-xl bg-muted/60 dark:bg-muted/40"
      [class]="userClass"
    ></div>
  `,
})
export class SkeletonComponent {
  userClass = '';
}
