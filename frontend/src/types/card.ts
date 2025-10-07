export interface Card {
  name: string
  clase: 'aggression' | 'basic' | 'campaign' | 'hero' | 'justice' | 'leadership' | 'pool' | 'protection'
  type: 'ally' | 'alter_ego' | 'attachment' | 'environment' | 'event' | 'hero' | 'minion' | 'obligation' | 'player_side_scheme' | 'resource' | 'side_scheme' | 'support' | 'treachery' | 'upgrade'
  cost: number
  set: string
}

export interface CardSet {
  id: number
  name: string
  cardCount: number
}
