export type CardClass = 'basic' | 'aggression' | 'justice' | 'leadership' | 'protection' | 'hero' | 'encounter' | 'campaign'

export function getClassColor(cls?: string): string {
  const c = (cls || '').toLowerCase() as CardClass
  switch (c) {
    case 'aggression':
      return 'bg-red-500'
    case 'justice':
      return 'bg-amber-500'
    case 'leadership':
      return 'bg-blue-500'
    case 'protection':
      return 'bg-green-600'
    case 'hero':
      return 'bg-violet-500'
    case 'encounter':
      return 'bg-red-900'
    case 'campaign':
      return 'bg-indigo-600'
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
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'protection':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'hero':
      return 'bg-violet-50 text-violet-700 border border-violet-200'
    case 'encounter':
      return 'bg-red-50 text-red-900 border border-red-300'
    case 'campaign':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
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
      return 'from-blue-100 to-blue-200 border-blue-300'
    case 'protection':
      return 'from-emerald-100 to-emerald-200 border-emerald-300'
    case 'hero':
      return 'from-violet-100 to-violet-200 border-violet-300'
    case 'encounter':
      return 'from-red-200 to-red-300 border-red-400'
    case 'campaign':
      return 'from-indigo-100 to-indigo-200 border-indigo-300'
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
      return 'text-blue-800 bg-blue-200'
    case 'protection':
      return 'text-emerald-800 bg-emerald-200'
    case 'hero':
      return 'text-violet-800 bg-violet-200'
    case 'encounter':
      return 'text-red-900 bg-red-300'
    case 'campaign':
      return 'text-indigo-800 bg-indigo-200'
    case 'basic':
    default:
      return 'text-gray-800 bg-gray-200'
  }
}


