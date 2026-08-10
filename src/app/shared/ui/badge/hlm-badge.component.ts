import { Component, Input, computed, signal } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { hlm } from '../../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Component({
  selector: 'span[hlmBadge], a[hlmBadge]',
  standalone: true,
  host: {
    '[class]': '_computedClass()',
  },
  template: `<ng-content />`,
})
export class HlmBadgeComponent {
  private readonly _userClass = signal('');
  private readonly _variant = signal<BadgeVariants['variant']>('default');

  @Input()
  set class(userClass: string) {
    this._userClass.set(userClass);
  }

  @Input()
  set variant(variant: BadgeVariants['variant']) {
    this._variant.set(variant);
  }

  protected readonly _computedClass = computed(() =>
    hlm(badgeVariants({ variant: this._variant() }), this._userClass())
  );
}
