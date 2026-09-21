import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export type CategoryId = 'developer' | 'everyday';

export interface Category {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  developer: { id: 'developer', label: 'Developer tools' },
  everyday: { id: 'everyday', label: 'Everyday tools' },
};

export interface ToolGroup {
  category: CategoryId;
  id: string;
  label: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  blurb: string;
  category: CategoryId;
  /** references ToolGroup.id */
  group: string;
  keywords: string[];
  icon: LucideIcon;
  status: 'ready' | 'planned';
  /** lazy-loaded only for ready tools, so heavy deps (pdf.js, wasm…) never ship upfront */
  component?: LazyExoticComponent<ComponentType>;
}
