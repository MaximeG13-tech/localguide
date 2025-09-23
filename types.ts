export enum AppStep {
  USER_INFO,
  DISPLAY_GUIDE,
}

export interface UserBusinessInfo {
  url: string;
  name: string;
  description: string;
  address: string;
  linkCount: number;
}

export interface GeneratedBusinessInfo {
  activity: string;          // Activité et spécificité
  city: string;       // Secteur / Ville
  name: string;           // Nom / Société
  address: string;        // Adresse postale complète
  extract: string;        // Extrait
  description: string;   // Description
}

export type LocalGuide = GeneratedBusinessInfo[];