

import { GoogleGenAI } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

// IMPORTANT: Clé d'API pour les services Google Maps (Geocoding & Places).
// Pour des raisons de sécurité, dans une application de production, cette clé devrait être
// stockée dans une variable d'environnement et non directement dans le code.
const GOOGLE_MAPS_API_KEY = 'AIzaSyDdKwnuHNK0kBd5huGBtRtE_lBBHYEM16s';

// Source: https://developers.google.com/maps/documentation/places/web-service/place-types (TABLE 1)
// This set contains ONLY the types that are valid for SEARCH requests in the Places API v1.
// Types like 'general_contractor' or 'architectural_designer_office' are NOT searchable.
const VALID_SEARCHABLE_PLACE_TYPES = new Set([
    'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery', 'atm',
    'bakery', 'bank', 'bar', 'beauty_salon', 'bicycle_store', 'book_store',
    'bowling_alley', 'bus_station', 'cafe', 'campground', 'car_dealer',
    'car_rental', 'car_repair', 'car_wash', 'casino', 'cemetery', 'church',
    'city_hall', 'clothing_store', 'convenience_store', 'courthouse', 'dentist',
    'department_store', 'doctor', 'drugstore', 'electrician', 'electronics_store',
    'embassy', 'fire_station', 'florist', 'funeral_home', 'furniture_store',
    'gas_station', 'gym', 'hair_care', 'hardware_store', 'hindu_temple',
    'home_goods_store', 'hospital', 'insurance_agency', 'jewelry_store',
    'laundry', 'lawyer', 'library', 'light_rail_station', 'liquor_store',
    'local_government_office', 'locksmith', 'lodging', 'meal_delivery',
    'meal_takeaway', 'mosque', 'movie_rental', 'movie_theater', 'moving_company',
    'museum', 'night_club', 'painter', 'park', 'parking', 'pet_store',
    'pharmacy', 'physiotherapist', 'plumber', 'police', 'post_office',
    'primary_school', 'real_estate_agency', 'restaurant', 'rv_park', 'school',
    'secondary_school', 'shoe_store', 'shopping_mall', 'spa', 'stadium',
    'storage', 'store', 'subway_station', 'supermarket', 'synagogue',
    'taxi_stand', 'tourist_attraction', 'train_station', 'transit_station',
    'travel_agency', 'university', 'veterinary_care', 'zoo'
]);


/**
 * Géocode une adresse postale en coordonnées latitude/longitude.
 * @param address L'adresse à géocoder.
 * @returns Une promesse résolue avec un objet { lat, lng }.
 */
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      const errorMessage = `Erreur de géocodage - ${data.status}:\n${data.error_message || 'Aucun détail supplémentaire.'} \nLa requête à l'API Google Geocoding a été refusée. Cela est généralement dû à un problème de configuration de la clé d'API. Veuillez vérifier les points suivants dans votre console Google Cloud : 1) L'API "Geocoding API" est bien activée. 2) La facturation est bien activée pour votre projet. 3) La clé d'API n'a pas de restrictions (IP, domaine) qui bloqueraient la requête.`;
      throw new Error(errorMessage);
    }
    return data.results[0].geometry.location;
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Geocoding:", error);
    throw new Error(`L'adresse fournie n'a pas pu être localisée. Veuillez la vérifier. Détails: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Extracts a JSON string from a text that might be wrapped in markdown code blocks.
 * @param text The raw text from the AI model.
 * @returns A clean JSON string.
 */
const extractJson = (text: string): string => {
    const trimmedText = text.trim();
    
    // Attempt to find JSON within markdown code blocks (```json ... ``` or ``` ... ```)
    const match = trimmedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }

    // If no markdown block is found, assume the whole string is the JSON.
    if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
        return trimmedText;
    }

    // If we can't find a clear JSON structure, we can't proceed.
    console.error("Réponse de l'IA non conforme (JSON non trouvé):", text);
    throw new Error("Impossible d'extraire une chaîne JSON valide de la réponse de l'IA.");
};


/**
 * Generates B2B category suggestions based on user's business description.
 * @param businessDescription The user's business description.
 * @returns A promise resolving to an array of string suggestions.
 */
export const generateB2BCategorySuggestions = async (businessDescription: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Basé sur la description de cette activité : "${businessDescription}", suggère 5 types de partenaires commerciaux B2B pertinents et non-concurrents.
      Pense à des métiers qui pourraient être des apporteurs d'affaires.
      Par exemple, pour un vendeur de camping-cars, des suggestions comme "Campings", "Aires de service", "Garages spécialisés" seraient pertinentes.
      
      Retourne UNIQUEMENT un tableau JSON valide contenant 5 chaînes de caractères.
      Exemple de format de sortie: ["Architectes", "Plombiers", "Électriciens", "Agences immobilières", "Paysagistes"]
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const jsonString = extractJson(response.text);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Erreur lors de la génération des suggestions de catégories B2B:", error);
        return []; // Return empty array on failure
    }
};


export const generateLocalGuide = async (
  userInfo: UserBusinessInfo,
  onProgress: (message: string) => void,
  excludeCategories: string[] | null = null,
  // FIX: The userFeedback parameter type was corrected from `string[] | null` to `string | null` to align with the actual data type being passed from the calling functions in `App.tsx`.
  userFeedback: string | null = null
): Promise<{ guide: LocalGuide; categoriesUsed: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // --- Étape 1: Géocodage de l'adresse ---
  onProgress("Localisation de l'adresse de recherche...");
  console.log("Étape 1: Géocodage de l'adresse...");
  const location = await geocodeAddress(userInfo.partnerSearchAddress);
  console.log(`Coordonnées obtenues:`, location);
  onProgress("Analyse de votre activité pour définir une stratégie...");

  // --- Boucle de recherche principale pour garantir le nombre de résultats ---
  const finalQualifiedProspects: LocalGuide = [];
  const allUsedCategories = new Set<string>(excludeCategories || []);
  const addedBusinessIdentifiers = new Set<string>(); // For deduplication
  const MAX_ATTEMPTS = 5; // Limite de sécurité pour éviter les boucles infinies
  let currentAttempt = 0;

  while(finalQualifiedProspects.length < userInfo.linkCount && currentAttempt < MAX_ATTEMPTS) {
    currentAttempt++;
    console.log(`--- DÉBUT DE LA TENTATIVE DE RECHERCHE N°${currentAttempt} ---`);
    onProgress(`Recherche de partenaires... (Essai ${currentAttempt}/${MAX_ATTEMPTS})`);

    // --- Étape 2: L'IA définit une stratégie de recherche ---
     onProgress(`Demande à l'IA de choisir les catégories de partenaires les plus pertinentes...`);
    const getCategoriesPrompt = `
      **MISSION:** Tu es un stratège en marketing local. Ton objectif est d'identifier les meilleures catégories d'entreprises partenaires pour mon activité, à utiliser avec l'API Google Places.
      
      **CONTEXTE DE MON ENTREPRISE:**
      - Nom: "${userInfo.name}"
      - Activité: "${userInfo.description}"
      
      **TACHES:**
      1. Analyse mon activité et identifie des types de partenaires commerciaux complémentaires, non-concurrents.
      2. Choisis entre 3 et 5 catégories pertinentes dans la liste fournie pour maximiser les chances de trouver des résultats variés.

      **RÈGLES CRITIQUES :**
      1. Tu dois **OBLIGATOIREMENT et EXCLUSIVEMENT** choisir des catégories dans la liste des types valides fournie ci-dessous.
      2. Ne retourne **AUCUNE** catégorie qui n'est pas textuellement présente dans cette liste. N'invente rien.
      3. Si une catégorie idéale (comme "architecte" ou "paysagiste") n'est pas dans la liste, tu dois choisir la catégorie valide la plus proche ou la plus pertinente (ex: "home_goods_store", "store", "florist").
      ${allUsedCategories.size > 0 ? `4. **EXCLUSION :** La liste suivante contient des catégories déjà utilisées. NE CHOISIS AUCUNE de ces catégories : ${JSON.stringify(Array.from(allUsedCategories))}` : ''}
      ${userFeedback ? `5. **PRIORITÉ ABSOLUE - FEEDBACK UTILISATEUR :** Le retour suivant est crucial: \`"${userFeedback}"\`. Ta tâche principale est de traduire les activités suggérées (ex: 'Cliniques Vétérinaires', 'Éleveurs Canins') en catégories de la \`LISTE DES CATÉGORIES VALIDES AUTORISÉES\`. Ta sélection DOIT refléter cette demande en priorité.` : ''}

      **LISTE DES CATÉGORIES VALIDES AUTORISÉES :**
      ${JSON.stringify(Array.from(VALID_SEARCHABLE_PLACE_TYPES))}
      
      **FORMAT DE SORTIE ATTENDU:**
      Retourne UNIQUEMENT un tableau JSON valide contenant les chaînes de caractères choisies. Exemple: ["plumber", "electrician", "hardware_store"]`;

    let newCategories: string[];
    try {
      const categoryResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: getCategoriesPrompt
      });
      const parsableCategoryString = extractJson(categoryResponse.text);
      const suggestedCategories: string[] = JSON.parse(parsableCategoryString);
      console.log(`(Essai ${currentAttempt}) Catégories suggérées par l'IA:`, suggestedCategories);
      
      newCategories = suggestedCategories.filter(category => VALID_SEARCHABLE_PLACE_TYPES.has(category) && !allUsedCategories.has(category));

      if (newCategories.length === 0) {
          console.warn(`(Essai ${currentAttempt}) L'IA n'a pas réussi à identifier de NOUVELLES catégories de recherche valides.`);
          break; // Sortir de la boucle si on ne trouve plus de nouvelles catégories
      }
      newCategories.forEach(cat => allUsedCategories.add(cat));

    } catch (error) {
      console.error(`(Essai ${currentAttempt}) Erreur lors de l'analyse des catégories JSON de l'IA:`, error);
      throw new Error(`L'IA n'a pas retourné un format de catégorie valide. ${error instanceof Error ? error.message : ''}`);
    }
    console.log(`(Essai ${currentAttempt}) Catégories valides et filtrées utilisées pour cette recherche:`, newCategories);
     onProgress(`Catégories reçues: ${newCategories.join(', ')}. Lancement de la recherche...`);

    // --- Étape 3: Recherche des entreprises à proximité via l'API Google Places ---
    onProgress(`Contact de l'API Google Places pour trouver des entreprises locales...`);
    const placesUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    const placesResponse = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount'
      },
      body: JSON.stringify({
        includedTypes: newCategories,
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: location.lat, longitude: location.lng }, radius: userInfo.partnerSearchRadius * 1000 },
        },
        languageCode: "fr",
        rankPreference: "DISTANCE"
      }),
    });
    
    if (!placesResponse.ok) {
       const errorBody = await placesResponse.json();
       const errorMessage = `Erreur de recherche Google Places - ${errorBody.error.message || 'Erreur inconnue'}. Veuillez vérifier que l'API "Places API" est activée dans votre console Google Cloud et que votre clé est valide.`;
       throw new Error(errorMessage);
    }
    const placesData = await placesResponse.json();
    console.log(`(Essai ${currentAttempt}) ${placesData.places?.length || 0} entreprises trouvées par Google Places.`);
     onProgress(`${placesData.places?.length || 0} lieux trouvés. Filtrage initial...`);

    if (!placesData.places || placesData.places.length === 0) {
      console.log(`(Essai ${currentAttempt}) Aucune entreprise trouvée pour ces catégories, on continue avec d'autres.`);
      continue; // Passe à l'itération suivante pour essayer d'autres catégories
    }

    const userBusinessNameLower = userInfo.name.toLowerCase();
    
    const foundPartners: Partial<GeneratedBusinessInfo>[] = placesData.places
    .filter((place: any) => {
        // --- FILTRE D'AUTO-EXCLUSION ---
        const placeNameLower = place.displayName?.text?.toLowerCase();
        return placeNameLower !== userBusinessNameLower;
    })
    .map((place: any) => ({
      name: place.displayName?.text,
      address: place.formattedAddress,
      phone: place.internationalPhoneNumber,
      website: place.websiteUri,
      googleMapsUri: place.googleMapsUri,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
    })).filter(Boolean);


    if (foundPartners.length === 0) {
        console.log(`(Essai ${currentAttempt}) Aucune entreprise restante après le filtre d'auto-exclusion.`);
        continue;
    }

    // --- Étape 4: Enrichir et filtrer en masse les entreprises trouvées avec un second appel IA ---
    onProgress(`Enrichissement de ${foundPartners.length} entreprises via l'IA... (${finalQualifiedProspects.length}/${userInfo.linkCount} validés)`);
    const businessesToEnrich = foundPartners.map(p => ({
      name: p.name,
      address: p.address,
      phone: p.phone || 'Non fourni',
      website: p.website || 'Non fourni',
    }));

    const batchEnrichmentPrompt = `
      **MISSION :** Tu es un assistant de rédaction et un analyste commercial. Ta mission est d'enrichir une liste d'entreprises et de les présenter de manière neutre et professionnelle.
      **CONTEXTE DE MON ENTREPRISE (POUR INFORMATION UNIQUEMENT) :** "${userInfo.description}". Ce contexte t'aide à comprendre le type de partenaires recherchés, mais tu ne dois **JAMAIS** mentionner mon entreprise ou mon activité dans les textes que tu génères pour les partenaires.

      **DONNÉES (Source: Google Places API) - Liste JSON en entrée :**
      ${JSON.stringify(businessesToEnrich, null, 2)}

      **TACHES À ACCOMPLIR :**
      Pour CHAQUE entreprise de la liste, tu dois accomplir les tâches suivantes :
      1.  **NOM DE L'ENTREPRISE :** Utilise **EXACTEMENT** le nom fourni en entrée. Ne le modifie jamais.
      2.  **ÉVALUATION COMMERCIALE (CRITIQUE) :** Ajoute une clé booléenne \`isProspectable\`. Mets la valeur à \`false\` si l'entreprise est clairement un grand groupe, une chaîne nationale/internationale, une franchise, une banque, une assurance, une grande surface ou une administration publique (ex: 'Société Générale', 'Carrefour', 'AXA', 'La Poste'). Mets \`true\` pour toutes les autres (artisans, TPE, PME, commerces indépendants, professions libérales).
      3.  **RECHERCHE SIRET :** Trouve le numéro de SIRET à 14 chiffres. Si introuvable, retourne une chaîne vide "". **NE JAMAIS INVENTER UN SIRET.**
      4.  **RÉDACTION (uniquement si \`isProspectable\` est \`true\`) :**
          - **activity:** Une phrase complète, directe et fluide décrivant l'activité. **RÈGLES STRICTES :** 1) Commence directement par le type d'activité (ex: 'Garage automobile...', 'Boulangerie artisanale...'). Utilise des formulations comme 'spécialisé dans'. 2) La phrase ne doit contenir **AUCUNE ponctuation** (pas de virgules, points, tirets, etc.). 3) La phrase doit **OBLIGATOIREMENT** se terminer par la préposition " à". **Exemple de style souhaité :** 'Garage automobile local spécialisé dans la réparation et entretien de véhicules toutes marques à'. **Exemple à ne pas suivre :** 'Un garage automobile local offrant des services...'.
          - **city:** Le secteur, formaté ainsi : "[Ville] ([Code Postal]) dans le/la/les [Département]". Trouve le code postal et le département.
          - **extract:** Un résumé de 2-3 phrases (environ 160 caractères), optimisé pour le SEO local. **RÈGLES STRICTES :** Utilise **TOUJOURS** la troisième personne du pluriel pour présenter l'entreprise (ex: "Ils proposent...", "Leur équipe..."). Ne fais **JAMAIS** référence à mon entreprise.
          - **description:** Une description détaillée (2-3 paragraphes) au format HTML (<p>). **RÈGLES STRICTES :** 1) Utilise **TOUJOURS** la troisième personne du pluriel ("Ils se spécialisent dans...", "Leurs services incluent..."). 2) Ne fais **JAMAIS** référence à mon entreprise. 3) La description doit être complète et ne PAS se terminer par ' à'. 4) Termine **TOUJOURS** par un paragraphe final d'appel à l'action. **RÈGLE CRUCIALE :** Cette phrase d'accroche doit être **naturelle et adaptée au type d'activité**. Évite la répétition. N'utilise "demander un devis" que si c'est pertinent (artisans, services...). Sois créatif. Intègre TOUJOURS le téléphone et l'adresse complète. **Exemples pour t'inspirer :** Pour un restaurant : "<p>Pour réserver une table et savourer leur cuisine, contactez-les au [Numéro de Téléphone] ou rendez-vous directement à l'adresse : [Adresse Complète].</p>" Pour une boutique : "<p>N'hésitez pas à leur rendre visite à l'adresse suivante : [Adresse Complète] pour explorer leur sélection, ou appelez-les au [Numéro de Téléphone] pour toute question.</p>" Pour une agence immobilière : "<p>Pour discuter de votre projet immobilier ou organiser une visite, vous pouvez les joindre au [Numéro de Téléphone] ou vous rendre à leur agence située au [Adresse Complète].</p>"
      5.  **INFO CONTACT (Optionnel) :** Trouve le numéro direct du gérant, si trouvable publiquement. Sinon, chaîne vide "".

      **FORMAT DE SORTIE FINAL :** Tu dois retourner UNIQUEMENT un tableau JSON valide. Chaque objet du tableau doit correspondre à une entreprise de la liste d'entrée et contenir les clés : \`isProspectable\`, \`siret\`, \`activity\`, \`city\`, \`extract\`, \`description\`, \`managerPhone\`. L'ordre des objets dans ton tableau de sortie doit CORRESPONDRE EXACTEMENT à l'ordre des entreprises dans la liste d'entrée. N'ajoute aucun commentaire.
      `;
      
      let enrichedDataArray: any[] = [];
      try {
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: batchEnrichmentPrompt,
              config: { tools: [{ googleSearch: {} }] }
          });
          onProgress(`Données enrichies reçues. Fusion et filtrage des prospects non qualifiés...`);
          const parsableString = extractJson(response.text);
          enrichedDataArray = JSON.parse(parsableString);
      } catch (error) {
          console.error(`(Essai ${currentAttempt}) Erreur d'enrichissement IA, on ignore ce lot:`, error);
          continue; // Si l'enrichissement échoue, on passe à l'essai suivant
      }

    // --- Étape 5: Fusionner les données ---
    const qualifiedProspectsFromBatch: LocalGuide = foundPartners.map((partner, index) => {
      const enrichedData = enrichedDataArray[index];
      if (!enrichedData || enrichedData.isProspectable === false) {
          return null;
      }
      return {
          name: `- ${partner.name || 'Nom non trouvé'}`,
          address: partner.address || 'Adresse non trouvée',
          phone: partner.phone || '',
          website: partner.website || undefined,
          googleMapsUri: partner.googleMapsUri || undefined,
          rating: partner.rating || undefined,
          userRatingCount: partner.userRatingCount || undefined,
          activity: enrichedData.activity || '',
          city: enrichedData.city || '',
          extract: enrichedData.extract || '',
          description: enrichedData.description || '<p>Description non disponible.</p>',
          siret: enrichedData.siret || undefined,
          managerPhone: enrichedData.managerPhone || undefined,
      };
    }).filter(item => item !== null) as LocalGuide;

    // --- DEDUPLICATION ---
    const uniqueProspectsInBatch = qualifiedProspectsFromBatch.filter(prospect => {
        if (!prospect.name || !prospect.address) return false;
        const identifier = `${prospect.name.toLowerCase().trim()}|${prospect.address.toLowerCase().trim()}`;
        if (addedBusinessIdentifiers.has(identifier)) {
            console.log(`(Essai ${currentAttempt}) Doublon trouvé et ignoré: ${prospect.name}`);
            return false;
        }
        addedBusinessIdentifiers.add(identifier);
        return true;
    });
    
    finalQualifiedProspects.push(...uniqueProspectsInBatch);
    console.log(`(Essai ${currentAttempt}) ${uniqueProspectsInBatch.length} prospects qualifiés UNIQUES ajoutés. Total actuel: ${finalQualifiedProspects.length}/${userInfo.linkCount}.`);
  }

  // --- Finalisation après la boucle ---
  onProgress("Finalisation du guide...");
  console.log("Finalisation du guide...");
  
  if (finalQualifiedProspects.length < userInfo.linkCount) {
    console.warn(`Avertissement: Impossible de trouver le nombre de prospects demandés (${userInfo.linkCount}). ${finalQualifiedProspects.length} trouvés après ${currentAttempt} essais.`);
    if (finalQualifiedProspects.length === 0) {
       throw new Error(`Aucun prospect qualifié n'a pu être trouvé après ${currentAttempt} tentatives. Essayez d'élargir considérablement le rayon de recherche ou de reformuler la description de votre activité.`);
    }
  }

  const finalGuide = finalQualifiedProspects.slice(0, userInfo.linkCount);

  return { guide: finalGuide, categoriesUsed: Array.from(allUsedCategories) };
};
