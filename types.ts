// FIX: Removed incorrect import from './App' which was causing a circular dependency and declaration merging errors for 'AppStep'.
// The 'AppStep' enum is defined in this file and should be the single source of truth.
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
  website?: string;
  googleMapsUri?: string; // URI direct vers Google Maps
  rating?: number;        // Note Google (ex: 4.5)
  userRatingCount?: number; // Nombre d'avis
  managerPhone?: string;
  siret?: string;
}

export type LocalGuide = GeneratedBusinessInfo[];