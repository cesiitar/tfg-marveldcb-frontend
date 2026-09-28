export type CardClass = 'basic' | 'aggression' | 'justice' | 'leadership' | 'protection' | 'hero' | 'encounter' | 'campaign' | 'pool'

export function getClassColor(cls?: string): string {
  const c = (cls || '').toLowerCase() as CardClass
  switch (c) {
    case 'aggression':
      return 'bg-red-500'
    case 'justice':
      return 'bg-amber-500'
    case 'leadership':
      return 'bg-sky-500'
    case 'protection':
      return 'bg-green-600'
    case 'hero':
      return 'bg-purple-600'
    case 'encounter':
      return 'bg-red-900'
    case 'campaign':
      return 'bg-indigo-600'
    case 'pool':
      return 'bg-teal-500'
    case 'basic':
    default:
      return 'bg-gray-400'
  }
}

export function getClassPillClasses(cls?: string): string {
  const c = (cls || '').toLowerCase() as CardClass
  switch (c) {
    case 'aggression':
      return 'bg-red-50 text-red-700 border border-red-200'
    case 'justice':
      return 'bg-amber-50 text-amber-800 border border-amber-200'
    case 'leadership':
      return 'bg-sky-50 text-sky-700 border border-sky-200'
    case 'protection':
      return 'bg-green-50 text-green-700 border border-green-200'
    case 'hero':
      return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'encounter':
      return 'bg-red-50 text-red-900 border border-red-300'
    case 'campaign':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    case 'pool':
      return 'bg-teal-50 text-teal-700 border border-teal-200'
    case 'basic':
    default:
      return 'bg-white text-slate-700 border border-slate-200'
  }
}

export function getClassGradientClasses(cls?: string): string {
  const c = (cls || '').toLowerCase() as CardClass
  switch (c) {
    case 'aggression':
      return 'from-red-100 to-red-200 border-red-300'
    case 'justice':
      return 'from-amber-100 to-amber-200 border-amber-300'
    case 'leadership':
      return 'from-sky-100 to-sky-200 border-sky-300'
    case 'protection':
      return 'from-green-100 to-green-200 border-green-300'
    case 'hero':
      return 'from-purple-100 to-purple-200 border-purple-300'
    case 'encounter':
      return 'from-red-200 to-red-300 border-red-400'
    case 'campaign':
      return 'from-indigo-100 to-indigo-200 border-indigo-300'
    case 'pool':
      return 'from-teal-100 to-teal-200 border-teal-300'
    case 'basic':
    default:
      return 'from-gray-100 to-gray-200 border-gray-300'
  }
}

export function getClassBadgeStyle(cls?: string): string {
  const c = (cls || '').toLowerCase() as CardClass
  switch (c) {
    case 'aggression':
      return 'text-red-800 bg-red-200'
    case 'justice':
      return 'text-amber-800 bg-amber-200'
    case 'leadership':
      return 'text-sky-800 bg-sky-200'
    case 'protection':
      return 'text-green-800 bg-green-200'
    case 'hero':
      return 'text-purple-800 bg-purple-200'
    case 'encounter':
      return 'text-red-900 bg-red-300'
    case 'campaign':
      return 'text-indigo-800 bg-indigo-200'
    case 'pool':
      return 'text-teal-800 bg-teal-200'
    case 'basic':
    default:
      return 'text-gray-800 bg-gray-200'
  }
}

export function getAspectHeaderGradient(aspect?: string): string {
  const a = (aspect || '').toLowerCase()
  switch (a) {
    case 'aggression':
      return 'from-red-600 to-red-700'
    case 'justice':
      return 'from-amber-600 to-amber-700'
    case 'leadership':
      return 'from-sky-600 to-sky-700'
    case 'protection':
      return 'from-green-600 to-green-700'
    case 'pool':
      return 'from-teal-600 to-teal-700'
    default:
      return 'from-slate-600 to-slate-700'
  }
}


