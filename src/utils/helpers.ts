// ============================================================
// Utility Functions
// ============================================================

import { CURRENCY_SYMBOL } from './constants';
import { Quarter } from '../types';

/** Format a number as currency (€1,234.56) */
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a number as short currency (€1.2K) */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) return `${CURRENCY_SYMBOL}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${CURRENCY_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

/** Get the current quarter (1-4) */
export function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth();
  return (Math.floor(month / 3) + 1) as Quarter;
}

/** Get current year */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Get quarter from a date string */
export function getQuarterFromDate(dateStr: string): Quarter {
  const month = new Date(dateStr).getMonth();
  return (Math.floor(month / 3) + 1) as Quarter;
}

/** Format date for display (e.g., "26 Feb 2026") */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format date for display short (e.g., "26 Feb") */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/** Format date as ISO string (YYYY-MM-DD) for inputs */
export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/** Generate a UUID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Get ISO datetime string */
export function now(): string {
  return new Date().toISOString();
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Category label from snake_case */
export function categoryLabel(cat: string): string {
  return cat.split('_').map(capitalize).join(' ');
}

/** Clamp a number between min and max */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
