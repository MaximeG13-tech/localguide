import { GoogleGenAI, Type } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const businessInfoSchema = {
    type: Type.OBJECT,
    properties: {
        activity: { type: Type.STRING, description: "Activité principale et spécificité de l'entreprise (ex: 'Plomberie et chauffage', 'Boulangerie artisanale'). En français." },
        name: { type: Type.STRING, description: "Nom commercial complet de l'entreprise. En français." },
        address: { type: Type.STRING, description: "Adresse postale complète (numéro, rue, code postal, ville). En français." },
        city: { type: Type.STRING, description: "Ville ou secteur géographique principal. En français." },
        extract: { type: Type.STRING, description: "Un extrait court et accrocheur de 20-30 mots pour un annuaire. En français." },
        description: { type: Type.STRING, description: "Une description détaillée et optimisée pour le SEO (environ 100-150 mots). DOIT être formatée en HTML avec des balises <p> pour les paragraphes. En français." },
        phone: { type: Type.STRING, description: "Numéro de téléphone public principal de l'entreprise." },
        website: { type: Type.STRING, description: "URL complète du site web de l'entreprise (https://...). Si non trouvé, laisser une chaîne vide." },
        googleMapsUri: { type: Type.STRING, description: "L'URL complète et directe (ex: 'https://www.google.com/maps/place/...') vers la fiche Google Maps. Si non trouvé, laisser une chaîne vide." },
        rating: { type: Type.NUMBER, description: "Note moyenne sur Google (ex: 4.5). Si non trouvé, ne pas inclure ou mettre à null." },
        userRatingCount: { type: Type.INTEGER, description: "Nombre total d'avis sur Google. Si non trouvé, ne pas inclure ou mettre à null." },
        managerPhone: { type: Type.STRING, description: "Numéro de téléphone potentiel du gérant/décideur, si trouvable. Sinon, laisser une chaîne vide." },
        siret: { type: Type.STRING, description: "Numéro de SIRET de l'entreprise, si trouvable. Sinon, laisser une chaîne vide." },
    },
    required: ["activity", "name", "address", "city", "extract", "description", "phone"]
};

/**
 * AGENT #1: Trouve une URL Google Maps valide pour une catégorie donnée en respectant un périmètre GPS strict.
 */
const findValidGoogleMapsUrl = async (
    category: string,
    info: UserBusinessInfo,
    usedNames: Set<string>
): Promise<string | null> => {
    const prompt = `
    Objectif : Trouver UNE seule URL de fiche d'établissement Google Maps (GMB) pour une entreprise.

    **PRIORITÉ ABSOLUE : RESPECT DE LA ZONE GÉOGRAPHIQUE.** C'est le critère le plus important. Il est préférable de ne rien trouver que de retourner une entreprise hors zone.
    
    PROCESSUS STRICT ET OBLIGATOIRE :
    1.  **Géolocalisation Précise :** D'abord, convertis l'adresse "${info.partnerSearchAddress}" en coordonnées GPS exactes (latitude, longitude). C'est ton point de référence.
    2.  **Recherche Ciblée :** Cherche une entreprise de la catégorie "${category}" qui se trouve **UNIQUEMENT** dans un rayon de ${info.partnerSearchRadius} km autour de ces coordonnées GPS.
    3.  **Exclusions :** L'entreprise ne doit PAS être une de celles déjà trouvées : ${[...usedNames].join(', ') || 'Aucune'}.
    4.  **Vérification Finale :** Avant de retourner une URL, vérifie que l'adresse de l'entreprise correspondante est bien dans la zone géographique définie. Si ce n'est pas le cas, rejette-la et continue à chercher.
    
    TA TÂCHE FINALE : Retourner l'URL de la fiche GMB.
    FORMAT DE L'URL : Utilise le format complet et standard (ex: "https://www.google.com/maps/place/..."). Ce format est plus fiable. N'utilise PAS le format court "maps.app.goo.gl".
    
    **RÈGLE CRITIQUE :** L'URL que tu fournis doit être réelle, fonctionnelle et pointer vers une véritable entreprise. Inventer une URL est un échec.
    
    Réponds UNIQUEMENT avec la chaîne de caractères de l'URL complète. Si, après une recherche sérieuse, tu ne trouves aucune entreprise qui respecte **TOUS** ces critères (surtout la localisation), réponds "AUCUN".
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            tools: [{ googleSearch: {} }],
        });

        const url = response.text.trim();
        
        // Validation du format de l'URL (plus flexible pour les URL complètes)
        if (url && url !== "AUCUN" && url.includes('google.') && url.includes('/maps/')) {
            return url;
        }
        return null;
    } catch (error) {
        console.error("Agent #1 (URL Finder) failed:", error);
        return null;
    }
};

/**
 * AGENT #2: Extrait les informations d'une URL Google Maps validée.
 */
const extractBusinessInfoFromUrl = async (
    googleMapsUrl: string,
    category: string,
    info: UserBusinessInfo
): Promise<GeneratedBusinessInfo | null> => {
    const prompt = `
    Tu es un assistant d'extraction de données dont la seule mission est la **PRÉCISION ABSOLUE**. Tu n'inventes JAMAIS d'information.

    **SOURCE DE VÉRITÉ UNIQUE ET INTRANSIGEANTE :**
    Utilise **EXCLUSIVEMENT** le contenu de la page Google Maps pointée par cette URL : ${googleMapsUrl}

    **PROCESSUS DE CONFIANCE EN 2 ÉTAPES :**

    **ÉTAPE 1 : Extraction depuis la source unique**
    Tu es **FORMELLEMENT INTERDIT** d'utiliser Google Search pour cette étape. Analyse la page GMB et extrais UNIQUEMENT les informations suivantes si elles sont PRÉSENTES sur la page :
    - Nom commercial (name)
    - Adresse complète (address)
    - Numéro de téléphone principal (phone)
    - Site Web (website)
    - Note moyenne (rating)
    - Nombre d'avis (userRatingCount)
    
    **RÈGLE D'OR :** Si une de ces informations n'est pas sur la page, le champ correspondant dans le JSON DOIT rester vide ou null. Ne cherche PAS ailleurs. Si la page ne semble pas être une fiche d'entreprise valide, arrête-toi.

    **ÉTAPE 2 : Enrichissement contrôlé (Après extraction)**
    SEULEMENT APRÈS avoir validé et extrait les données de l'étape 1 :
    - **SIRET :** Utilise le nom et l'adresse maintenant **vérifiés** pour faire une recherche Google ciblée (Societe.com, Pappers.fr, etc.) et trouver le numéro de SIRET à 14 chiffres. Si tu ne trouves pas un SIRET valide, laisse le champ vide.
    - **Rédaction :** Rédige un 'extract' (20-30 mots) et une 'description' (100-150 mots, formatée en HTML avec des balises <p>) en te basant sur les informations **vérifiées** de la fiche. Sois créatif mais factuel.
    - **Champs fixes :** Le champ 'activity' doit être "${category}". Le champ 'googleMapsUri' DOIT être l'URL fournie : "${googleMapsUrl}".

    Réponds UNIQUEMENT avec un seul objet JSON. Tous les textes doivent être en français. Ne retourne rien si l'URL ne pointe pas vers une entreprise valide.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            tools: [{ googleSearch: {} }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: businessInfoSchema,
                temperature: 0.5,
            }
        });

        const responseText = response.text;
        const parsedResponse = JSON.parse(responseText);
        
        if (typeof parsedResponse === 'object' && !Array.isArray(parsedResponse) && parsedResponse !== null) {
            return parsedResponse as GeneratedBusinessInfo;
        }
        return null;

    } catch (error) {
        console.error(`Agent #2 (Extractor) failed for URL ${googleMapsUrl}:`, error);
        return null;
    }
};

interface GenerationOptions {
    initialCategories?: string[];
    excludeCategories?: string[] | null;
    userFeedback?: string | null;
}

export const generateLocalGuide = async (
    info: UserBusinessInfo,
    progressCallback: (message: string) => void,
    options: GenerationOptions
): Promise<{ guide: LocalGuide, categoriesUsed: string[] }> => {
    
    let categories: string[] = [];

    if (options.initialCategories && options.initialCategories.length > 0) {
        progressCallback("Utilisation des catégories sélectionnées...");
        categories = options.initialCategories;
    } else {
        progressCallback("Identification des catégories de partenaires B2B...");
        const categoryPrompt = `
        Je suis en train de créer un guide local pour mon client.
        Mon client est : "${info.name}", qui se décrit comme suit : "${info.description}".
        Identifie ${info.linkCount} catégories de partenaires B2B **distinctes et pertinentes** en France.
        ${options.excludeCategories ? `**Exclus ces catégories déjà utilisées :** ${JSON.stringify(options.excludeCategories)}.` : ''}
        ${options.userFeedback ? `**Prends en compte ce feedback :** "${options.userFeedback}".` : ''}
        Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères.
        Exemple : ["Plombiers chauffagistes", "Électriciens du bâtiment"]
        `;

        const categoryResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: categoryPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        
        categories = JSON.parse(categoryResponse.text);
    }
    
    if (!categories || categories.length === 0) {
        throw new Error("L'IA n'a pas pu identifier de catégories de partenaires pertinentes.");
    }
    
    const guide: LocalGuide = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        progressCallback(`(${i + 1}/${categories.length}) Agent 1: Recherche d'une URL pour : "${category}"...`);

        const googleMapsUrl = await findValidGoogleMapsUrl(category, info, usedNames);

        if (!googleMapsUrl) {
            progressCallback(`(${i + 1}/${categories.length}) Agent 1: Aucune URL valide trouvée pour "${category}". Je passe.`);
            continue;
        }

        progressCallback(`(${i + 1}/${categories.length}) Agent 2: URL trouvée! Extraction des données...`);
        
        try {
            const businessInfo = await extractBusinessInfoFromUrl(googleMapsUrl, category, info);
        
            if (businessInfo && businessInfo.name && !usedNames.has(businessInfo.name.toLowerCase())) {
                guide.push(businessInfo);
                usedNames.add(businessInfo.name.toLowerCase());
                 progressCallback(`(${i + 1}/${categories.length}) Succès : "${businessInfo.name}" ajouté.`);
            } else {
                 progressCallback(`(${i + 1}/${categories.length}) Agent 2: Doublon ou erreur pour "${category}", je passe.`);
            }
        } catch (e) {
            console.warn(`Could not generate a profile for category "${category}". Skipping.`, e);
            progressCallback(`(${i + 1}/${categories.length}) Agent 2: Erreur pour "${category}", je passe.`);
        }
    }

    if (guide.length === 0) {
        throw new Error("L'IA n'a pas réussi à générer de fiches d'entreprise validées. Veuillez réessayer avec des critères différents.");
    }

    return { guide, categoriesUsed: categories };
};

export const generateInitialCategorySuggestions = async (description: string, count: number): Promise<string[]> => {
    const prompt = `
    Analyse la description d'activité suivante et identifie ${count} catégories de partenaires B2B qui seraient de **bons rapporteurs d'affaires** pour cette entreprise.
    Pense en termes de 'qui peut leur envoyer des clients ?'. Sois spécifique et pertinent.
    **Description de l'entreprise cliente :** "${description}"
    Réponds UNIQUEMENT avec un tableau JSON contenant ${count} chaînes de caractères en français. Ne rien inclure d'autre.
    Exemple de format de réponse : ["Agences immobilières", "Courtiers en prêts", "Architectes d'intérieur"]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const suggestions = JSON.parse(response.text);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];
    } catch (error) {
        console.error("Error generating initial B2B suggestions:", error);
        return [];
    }
};


export const generateB2BCategorySuggestions = async (description: string): Promise<string[]> => {
    const prompt = `
    En te basant sur la description d'activité suivante, suggère 5 catégories de partenaires B2B **différentes et variées** pour une recherche plus large. Pense à des fournisseurs, des services complémentaires ou des professions connexes.
    **Description :** "${description}"
    Réponds UNIQUEMENT avec un tableau JSON contenant 5 chaînes de caractères en français.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const suggestions = JSON.parse(response.text);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];
    } catch (error) {
        console.error("Error generating B2B suggestions:", error);
        return [];
    }
};