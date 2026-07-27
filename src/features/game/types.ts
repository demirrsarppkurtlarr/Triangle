export type GameCategory =
  | "vehicle"
  | "property"
  | "gadget"
  | "collectible"
  | "lifestyle";

export type GameItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: GameCategory;
  rarity: string;
  shopPrice: number;
  sellBackRate: number;
  icon: string;
  sortOrder: number;
};

export type InventoryRow = {
  id: string;
  itemId: string;
  quantity: number;
  purchasePrice: number;
  acquiredAt: string;
  item: GameItem;
};

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  sellerUsername: string;
  itemId: string;
  quantity: number;
  price: number;
  createdAt: string;
  item: GameItem;
  isMine: boolean;
};

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  vehicle: "Vehicles",
  property: "Homes",
  gadget: "Gadgets",
  collectible: "Collectibles",
  lifestyle: "Lifestyle",
};
