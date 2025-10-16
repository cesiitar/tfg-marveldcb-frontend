export interface Card {
  name: string
  clase: 'aggression' | 'basic' | 'campaign' | 'encounter' | 'hero' | 'justice' | 'leadership' | 'pool' | 'protection'
  type: 'ally' | 'alter_ego' | 'attachment' | 'environment' | 'event' | 'hero' | 'minion' | 'obligation' | 'player_side_scheme' | 'resource' | 'side_scheme' | 'support' | 'treachery' | 'upgrade' | 'villain' | 'main_scheme' | 'evidence'
  cost: number
  set: string
  quantity?: number  // Número de copias que se añaden automáticamente
  max_quantity?: number  // Límite máximo de copias permitidas en un mazo
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
  card_set?: string
  quantity: number
}

export interface Deck {
  id?: number
  name: string
  hero_name: string
  aspect?: 'aggression' | 'justice' | 'leadership' | 'protection'
  cards: DeckCard[]
  creator_name?: string
  created_at?: string
  updated_at?: string
}
