import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Checked In':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Waiting':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'In Consultation':
      return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse';
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'No-show':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
