export interface Branch {
  id: string;
  name: string;
  address: string;
  city?: string; // e.g. القاهرة، الجيزة، الإسكندرية
  phone?: string;
  mapsUrl?: string;
  notes?: string;
  addedAt?: string;
}

export interface SupermarketChain {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  hotline: string;
  anniversaryDate: string; // e.g. "15 أكتوبر" or "2002-10-15"
  anniversaryDay?: number;
  anniversaryMonth?: number;
  description?: string;
  foundedYear?: string;
  branches: Branch[];
}

export interface CustomSubButton {
  id: string;
  label: string;
  icon?: string;
  type: 'filter' | 'link' | 'note' | 'custom';
  content?: string; // URL or note content or filter query
}

export interface CustomSidebarSection {
  id: string;
  title: string;
  icon?: string;
  description?: string;
  buttons: CustomSubButton[];
}

export interface AppSettings {
  websiteName: string;
  timelineCoverUrl: string;
  customSections: CustomSidebarSection[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
