import { Component, Directive, Input, computed, signal } from '@angular/core';
import { cva } from 'class-variance-authority';
import { hlm } from '../../../lib/utils';

export const inputVariants = cva(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
);

@Directive({
  selector: '[hlmInput]',
  standalone: true,
  host: {
    '[class]': '_computedClass()',
  },
})
export class HlmInputDirective {
  private readonly _userClass = signal('');

  @Input()
  set class(userClass: string) {
    this._userClass.set(userClass);
  }

  protected readonly _computedClass = computed(() =>
    hlm(inputVariants(), this._userClass())
  );
}
