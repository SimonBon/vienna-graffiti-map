export type GraffitiCategory = string;

export interface GraffitiSighting {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  category: GraffitiCategory;
  description: string | null;
  image_url: string | null;
  submitted_by: string | null;
}

export interface CategoryDef {
  value: string;
  label: string;
  emoji: string;
}
