import { createClient } from "@/lib/supabase/server";

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

function mapItem(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  shop_price: number | string;
  sell_back_rate: number | string;
  icon: string;
  sort_order: number;
}): GameItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category as GameCategory,
    rarity: row.rarity,
    shopPrice: Number(row.shop_price),
    sellBackRate: Number(row.sell_back_rate),
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export async function getShopCatalog(): Promise<GameItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_items")
    .select(
      "id, slug, name, description, category, rarity, shop_price, sell_back_rate, icon, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map(mapItem);
}

export async function getCashBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bank_accounts")
    .select("balance")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function getUserInventory(userId: string): Promise<InventoryRow[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("user_inventory")
    .select("id, item_id, quantity, purchase_price, acquired_at")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false });

  if (!rows?.length) return [];

  const itemIds = [...new Set(rows.map((row) => row.item_id))];
  const { data: items } = await supabase
    .from("game_items")
    .select(
      "id, slug, name, description, category, rarity, shop_price, sell_back_rate, icon, sort_order",
    )
    .in("id", itemIds);

  const itemMap = new Map((items ?? []).map((item) => [item.id, mapItem(item)]));

  return rows
    .map((row) => {
      const item = itemMap.get(row.item_id);
      if (!item) return null;
      return {
        id: row.id,
        itemId: row.item_id,
        quantity: Number(row.quantity),
        purchasePrice: Number(row.purchase_price),
        acquiredAt: row.acquired_at,
        item,
      } satisfies InventoryRow;
    })
    .filter((row): row is InventoryRow => row !== null);
}

export async function getMarketplaceListings(
  userId: string,
): Promise<MarketplaceListing[]> {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("item_listings")
    .select("id, seller_id, item_id, quantity, price, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!listings?.length) return [];

  const itemIds = [...new Set(listings.map((row) => row.item_id))];
  const sellerIds = [...new Set(listings.map((row) => row.seller_id))];

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase
      .from("game_items")
      .select(
        "id, slug, name, description, category, rarity, shop_price, sell_back_rate, icon, sort_order",
      )
      .in("id", itemIds),
    supabase.from("profiles").select("id, username").in("id", sellerIds),
  ]);

  const itemMap = new Map((items ?? []).map((item) => [item.id, mapItem(item)]));
  const usernameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.username]),
  );

  return listings
    .map((row) => {
      const item = itemMap.get(row.item_id);
      if (!item) return null;
      return {
        id: row.id,
        sellerId: row.seller_id,
        sellerUsername: usernameById.get(row.seller_id) ?? "player",
        itemId: row.item_id,
        quantity: Number(row.quantity),
        price: Number(row.price),
        createdAt: row.created_at,
        item,
        isMine: row.seller_id === userId,
      } satisfies MarketplaceListing;
    })
    .filter((row): row is MarketplaceListing => row !== null);
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  vehicle: "Vehicles",
  property: "Homes",
  gadget: "Gadgets",
  collectible: "Collectibles",
  lifestyle: "Lifestyle",
};
