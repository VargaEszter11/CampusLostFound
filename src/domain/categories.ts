export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Bag / backpack',
  'ID / document',
  'Keys',
  'Jewelry / watch',
  'Book / notes',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
