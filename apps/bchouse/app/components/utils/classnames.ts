import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function classnames(...classList: ClassValue[]) {
  return twMerge(clsx(...classList))
}
