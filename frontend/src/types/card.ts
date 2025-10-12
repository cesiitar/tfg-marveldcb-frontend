export interface Card {
  name: string
  clase: 'aggression' | 'basic' | 'campaign' | 'hero' | 'justice' | 'leadership' | 'pool' | 'protection'
  type: 'ally' | 'alter_ego' | 'attachment' | 'environment' | 'event' | 'hero' | 'minion' | 'obligation' | 'player_side_scheme' | 'resource' | 'side_scheme' | 'support' | 'treachery' | 'upgrade'
  cost: number
  set: string
  quantity?: number  // Número de copias que se añaden automáticamente
}

export interface CardSet {
  id: number
  name: string
  cardCount: number
}

export interface Hero {
  name: string
  pack_name: string
}

export interface DeckCard {
  card_name: string
  quantity: number
}

export interface Deck {
  id?: number
  name: string
  hero_name: string
  cards: DeckCard[]
  created_at?: string
  updated_at?: string
}
