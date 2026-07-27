"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Building2,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Flower2,
  Glasses,
  Headphones,
  Home,
  Image as ImageIcon,
  Keyboard,
  Laptop,
  Monitor,
  Package,
  ParkingSquare,
  Plane,
  Shirt,
  Ship,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Ticket,
  Trophy,
  Utensils,
  Watch,
  Waves,
  Wine,
} from "lucide-react";

import type { GameItem } from "@/features/game/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  bike: Bike,
  building: Building2,
  camera: Camera,
  car: Car,
  coffee: Coffee,
  dumbbell: Dumbbell,
  flower: Flower2,
  glasses: Glasses,
  headphones: Headphones,
  home: Home,
  image: ImageIcon,
  keyboard: Keyboard,
  laptop: Laptop,
  monitor: Monitor,
  package: Package,
  parking: ParkingSquare,
  plane: Plane,
  shirt: Shirt,
  ship: Ship,
  "shopping-bag": ShoppingBag,
  smartphone: Smartphone,
  sparkles: Sparkles,
  ticket: Ticket,
  trophy: Trophy,
  utensils: Utensils,
  watch: Watch,
  waves: Waves,
  wine: Wine,
};

const RARITY_CLASS: Record<string, string> = {
  common: "text-muted-foreground",
  uncommon: "text-emerald-600 dark:text-emerald-400",
  rare: "text-sky-600 dark:text-sky-400",
  epic: "text-violet-600 dark:text-violet-400",
  legendary: "text-amber-600 dark:text-amber-400",
};

export function GameItemIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? Package;
  return <Icon className={cn("size-5", className)} />;
}

export function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium uppercase tracking-wide",
        RARITY_CLASS[rarity] ?? RARITY_CLASS.common,
      )}
    >
      {rarity}
    </span>
  );
}

export function sellBackPrice(item: GameItem): number {
  return Math.round(item.shopPrice * item.sellBackRate * 100) / 100;
}
