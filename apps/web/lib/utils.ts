import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

export function getNthBusinessDay(year: number, month: number, n: number): Date {
  const date = new Date(year, month - 1, 1)
  let businessDays = 0
  
  while (businessDays < n) {
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
    if (businessDays < n) {
      date.setDate(date.getDate() + 1)
    }
  }
  
  return date
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addDaysToString(dateString: string, days: number): string {
  const date = new Date(dateString)
  const result = addDays(date, days)
  return result.toISOString().split('T')[0]
}

export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6
}
