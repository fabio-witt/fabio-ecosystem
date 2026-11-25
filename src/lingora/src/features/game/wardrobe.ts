/** Items for Fabio, bought with gems. Hats and glasses sit on top of the drawing. */
export type WardrobeSlot = 'hat' | 'glasses' | 'scarf';
export type WardrobeItem = { id: string; slot: WardrobeSlot; icon: string; name: string; price: number; color?: string; plus?: boolean; level?: number };

export const wardrobe: WardrobeItem[] = [
  { id: 'scarf-red', slot: 'scarf', icon: '🧣', name: 'Red scarf', price: 40, color: '#D1495B' },
  { id: 'scarf-green', slot: 'scarf', icon: '🧣', name: 'Green scarf', price: 40, color: '#2E7D32' },
  { id: 'scarf-gold', slot: 'scarf', icon: '🧣', name: 'Golden scarf', price: 90, color: '#E0A800' },
  { id: 'hat-cap', slot: 'hat', icon: '🧢', name: 'Cap', price: 60 },
  { id: 'hat-bow', slot: 'hat', icon: '🎀', name: 'Bow', price: 60 },
  { id: 'hat-top', slot: 'hat', icon: '🎩', name: 'Top hat', price: 120 },
  { id: 'hat-grad', slot: 'hat', icon: '🎓', name: 'Graduation cap', price: 150 },
  { id: 'hat-crown', slot: 'hat', icon: '👑', name: 'Crown', price: 300 },
  { id: 'glasses-sun', slot: 'glasses', icon: '🕶️', name: 'Sunglasses', price: 100 },
  // Unlocked by reaching a player level (free).
  { id: 'hat-phones', slot: 'hat', icon: '🎧', name: 'Headphones', price: 0, level: 5 },
  { id: 'hat-flower', slot: 'hat', icon: '🌸', name: 'Flower', price: 0, level: 10 },
  { id: 'scarf-rainbow', slot: 'scarf', icon: '🧣', name: 'Rainbow scarf', price: 0, color: '#8E44AD', level: 15 },
  { id: 'glasses-goggles', slot: 'glasses', icon: '🥽', name: 'Explorer goggles', price: 0, level: 20 },
  { id: 'hat-star', slot: 'hat', icon: '⭐', name: 'Star', price: 0, level: 30 },
  // Free for Lingora Plus members.
  { id: 'hat-sun', slot: 'hat', icon: '👒', name: 'Sun hat', price: 0, plus: true },
  { id: 'hat-helmet', slot: 'hat', icon: '⛑️', name: 'Rescue helmet', price: 0, plus: true },
  { id: 'glasses-read', slot: 'glasses', icon: '👓', name: 'Reading glasses', price: 0, plus: true },
];

export function wardrobeItem(id?: string) {
  return id ? wardrobe.find((item) => item.id === id) : undefined;
}
