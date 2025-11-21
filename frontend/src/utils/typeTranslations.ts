// Formatea tipos de carta (type) del backend en inglés con capitalización apropiada
export function translateCardType(type: string | undefined | null): string {
  if (!type) return 'Unknown'
  
  const typeLabels: { [key: string]: string } = {
    hero: 'Hero',
    ally: 'Ally',
    event: 'Event',
    upgrade: 'Upgrade',
    support: 'Support',
    resource: 'Resource',
    attachment: 'Attachment',
    environment: 'Environment',
    minion: 'Minion',
    obligation: 'Obligation',
    side_scheme: 'Side Scheme',
    treachery: 'Treachery',
    villain: 'Villain',
    main_scheme: 'Main Scheme',
    evidence: 'Evidence',
    player_side_scheme: 'Player Side Scheme',
    alter_ego: 'Alter Ego'
  }
  
  const normalizedType = type.toLowerCase().trim()
  return typeLabels[normalizedType] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

