export enum AppStep {
  USER_INFO,
  DISPLAY_GUIDE,
}

export interface UserBusinessInfo {
  name: string;
  description: string;
  linkCount: number;
  partnerSearchAddress: string;
  partnerSearchRadius: number;
}

export interface GeneratedBusinessInfo {
  activity: string;          // Activité et spécificité
  name: string;           // Nom / Société
  address: string;        // Adresse postale complète
  city: string;           // Secteur / Ville
  extract: string;        // Extrait
  description: string;   // Description
  phone: string;         // Numéro de téléphone
}

export type LocalGuide = GeneratedBusinessInfo[];