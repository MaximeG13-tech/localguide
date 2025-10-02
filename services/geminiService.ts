import { GoogleGenAI, Type } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Safely parses a JSON string that may be wrapped in markdown code blocks.
 * @param text The raw text response from the AI.
 * @param defaultValue The value to return if parsing fails.
 * @returns The parsed JSON object or the default value.
 */
const safeParseJson = <T>(text: string | undefined, defaultValue: T): T => {
    if (!text) {
        return defaultValue;
    }
    try {
        let cleanText = text.trim();
        // Regex to find JSON content inside ```json ... ``` or ``` ... ```
        const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        
        if (jsonMatch && jsonMatch[1]) {
            cleanText = jsonMatch[1];
        }

        // Attempt to parse the cleaned text
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.warn(`Failed to parse JSON from response. Raw text: "${text}". Error: ${e}. Returning default value.`);
        return defaultValue;
    }
};


// --- START: Data Verification Pipeline ---

/**
 * Vérifie si une URL de site web est valide en utilisant une requête HEAD pour la performance.
 */
const verifyWebsiteUrl = async (url: string | undefined): Promise<boolean> => {
    if (!url || !url.startsWith('http')) return false;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * Vérifie un numéro SIRET via une API publique.
 */
const verifySiretNumber = async (siret: string | undefined): Promise<boolean> => {
    if (!siret || !/^\d{14}$/.test(siret.replace(/\s/g, ''))) return false;
    const cleanSiret = siret.replace(/\s/g, '');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(cleanSiret)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return false;
        const data = await response.json();
        return data.results && data.results.length > 0 && data.results[0].siret === cleanSiret;
    } catch (error) {
        return false;
    }
};

/**
 * Vérifie si une URL Google Maps a un format valide.
 */
const verifyGoogleMapsUrl = async (url: string | undefined): Promise<boolean> => {
    if (!url) return false;
    const isValid = url.startsWith('https://www.google.com/maps/place/') || url.startsWith('https://maps.app.goo.gl/');
    return Promise.resolve(isValid);
};


// --- END: Data Verification Pipeline ---


// --- START: AI Agent Definitions ---

/**
 * AGENT DE RECHERCHE DE CANDIDATS
 * Mission : Trouver une LISTE de candidats potentiels pour une catégorie donnée.
 * Ne se préoccupe pas de la vérification approfondie.
 */
const findBusinessCandidates = async (
    category: string,
    info: UserBusinessInfo,
    usedNames: Set<string>,
    radius: number
): Promise<Partial<GeneratedBusinessInfo>[]> => {
    const prompt = `
    Tu es un agent de recherche de données. Ta mission est de trouver jusqu'à 5 entreprises françaises réelles correspondant aux critères, en utilisant Google Search.

    **RÈGLES CRITIQUES :**
    1.  **RECHERCHE OBLIGATOIRE :** Utilise Google Search pour trouver des entreprises de la catégorie "${category}" dans un rayon de ${radius} km autour de "${info.partnerSearchAddress}".
    2.  **PAS DE DOUBLONS :** Exclus ces noms déjà traités : ${[...usedNames].join(', ') || 'Aucun'}.
    3.  **DONNÉES BRUTES :** Extrais le nom ('name'), le site web ('website'), le SIRET ('siret') et l'URL Google Maps ('googleMapsUri') si disponibles. N'invente AUCUNE donnée. Si une information est manquante pour une entreprise, laisse le champ correspondant à null.

    **FORMAT DE SORTIE :**
    Réponds UNIQUEMENT avec un tableau JSON d'objets. Si tu ne trouves rien, réponds avec un tableau vide : [].
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
        });
        return safeParseJson<Partial<GeneratedBusinessInfo>[]>(response.text, []);
    } catch (error) {
        console.error(`Candidate agent failed for category ${category}:`, error);
        return [];
    }
};

/**
 * AGENT D'ENRICHISSEMENT EN MASSE
 * Mission : Prendre une liste d'entreprises VÉRIFIÉES et générer du contenu marketing pour elles.
 */
const enrichBusinessDetails = async (
    businesses: GeneratedBusinessInfo[],
    category: string
): Promise<GeneratedBusinessInfo[]> => {
    const prompt = `
    Tu es un copywriter expert en SEO local. Pour chaque entreprise dans le tableau JSON ci-dessous, génère le contenu créatif manquant.

    **RÈGLES :**
    1.  **NE PAS MODIFIER LES DONNÉES EXISTANTES** (name, address, siret, etc.).
    2.  **REMPLIR LES CHAMPS SUIVANTS :**
        -   'activity': Doit être "${category}".
        -   'city': La ville extraite de l'adresse.
        -   'phone', 'rating', 'userRatingCount', 'googleMapsUri', 'address': Complète ces informations si elles sont manquantes, en utilisant une recherche Google si nécessaire.
        -   'extract': Un résumé court et accrocheur (20-30 mots).
        -   'description': Une description détaillée et optimisée pour le SEO (100-150 mots) formatée en HTML simple (paragraphes <p>).
    3.  **SOURCE :** Remplis le champ 'source' avec "Google Search via Gemini API".
    
    **ENTRÉE :**
    ${JSON.stringify(businesses, null, 2)}

    **FORMAT DE SORTIE :**
    Réponds UNIQUEMENT avec le tableau JSON complété, sans aucun texte supplémentaire.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }], temperature: 0.5 }
        });
        return safeParseJson<GeneratedBusinessInfo[]>(response.text, businesses);
    } catch (error) {
        console.error("Enrichment agent failed:", error);
        return businesses; // Return original data on failure
    }
};


// --- END: AI Agent Definitions ---


interface GenerationOptions {
    initialCategories?: string[];
    excludeCategories?: string[] | null;
    userFeedback?: string | null;
}

interface ProgressState {
  message: string;
  percentage: number;
}

export const generateLocalGuide = async (
    info: UserBusinessInfo,
    progressCallback: (state: ProgressState) => void,
    onBusinessVerified: (business: GeneratedBusinessInfo) => void,
    options: GenerationOptions,
    signal: AbortSignal
): Promise<{ guide: LocalGuide, categoriesUsed: string[] }> => {
    
    // Check for cancellation
    const checkSignal = () => { if (signal.aborted) throw new Error('AbortError'); };

    let categories: string[] = options.initialCategories || [];
    if (categories.length === 0) {
      // Logic to generate categories if not provided (simplified from original)
      // This part could be expanded as before
    }
    
    if (!categories || categories.length === 0) {
        throw new Error("Aucune catégorie de partenaire spécifiée.");
    }
    
    const finalGuide: LocalGuide = [];
    const usedNames = new Set<string>();
    const totalCategories = categories.length;
    let currentRadius = info.partnerSearchRadius;
    const MAX_RADIUS = 50;
    
    let categoriesToProcess = [...categories];

    while (finalGuide.length < info.linkCount && currentRadius <= MAX_RADIUS) {
        checkSignal();
        if (currentRadius > info.partnerSearchRadius) {
            progressCallback({ message: `Recherche étendue à ${currentRadius} km...`, percentage: 15 });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        for (let i = 0; i < categoriesToProcess.length; i++) {
            const category = categoriesToProcess[i];
            const categoryIndex = categories.indexOf(category);
            
            const baseProgress = 20 + (categoryIndex / totalCategories) * 65;
            
            progressCallback({ 
                message: `(${categoryIndex + 1}/${totalCategories}) Recherche de candidats pour : "${category}"`,
                percentage: baseProgress
            });

            const cacheKey = JSON.stringify({ category, address: info.partnerSearchAddress, radius: currentRadius });
            let candidates: Partial<GeneratedBusinessInfo>[] = [];
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData) {
                candidates = JSON.parse(cachedData);
            } else {
                candidates = await findBusinessCandidates(category, info, usedNames, currentRadius);
                sessionStorage.setItem(cacheKey, JSON.stringify(candidates));
            }
            
            if (candidates.length === 0) continue;

            progressCallback({ 
                message: `Vérification de ${candidates.length} candidats pour "${category}"`,
                percentage: baseProgress + 5
            });

            const verificationPromises = candidates.map(async candidate => {
                checkSignal();
                const [website, siret, maps] = await Promise.allSettled([
                    verifyWebsiteUrl(candidate.website),
                    verifySiretNumber(candidate.siret),
                    verifyGoogleMapsUrl(candidate.googleMapsUri),
                ]);
                return {
                    ...candidate,
                    isWebsiteValid: website.status === 'fulfilled' && website.value,
                    isSiretValid: siret.status === 'fulfilled' && siret.value,
                    isMapsValid: maps.status === 'fulfilled' && maps.value,
                };
            });

            const verifiedResults = await Promise.all(verificationPromises);
            
            let verifiedCandidates = verifiedResults.filter(
                c => c.isWebsiteValid && (c.isSiretValid || c.isMapsValid) && !usedNames.has(c.name?.toLowerCase() || '')
            ).map(c => c as GeneratedBusinessInfo); // Cast to full type for enrichment

            if (verifiedCandidates.length > 0) {
                progressCallback({
                    message: `Enrichissement de ${verifiedCandidates.length} entreprises vérifiées...`,
                    percentage: baseProgress + 10,
                });

                const enrichedBusinesses = await enrichBusinessDetails(verifiedCandidates, category);
                checkSignal();

                for (const business of enrichedBusinesses) {
                    if (finalGuide.length < info.linkCount && business.name && !usedNames.has(business.name.toLowerCase())) {
                        finalGuide.push(business);
                        onBusinessVerified(business);
                        usedNames.add(business.name.toLowerCase());
                    }
                }
            }
        }

        categoriesToProcess = categories.filter(cat => !finalGuide.some(g => g.activity === cat));
        if (categoriesToProcess.length === 0 || finalGuide.length >= info.linkCount) break;

        currentRadius *= 2;
    }

    if (finalGuide.length === 0) {
       progressCallback({ message: "Aucun partenaire vérifié trouvé.", percentage: 100 });
       throw new Error(`Aucune entreprise n'a pu être trouvée et entièrement vérifiée, même après avoir étendu la recherche à ${currentRadius/2} km. Essayez une autre zone ou d'autres catégories.`);
    }

    return { guide: finalGuide, categoriesUsed: categories };
};


// --- The other generation functions remain largely the same ---

export const generateInitialCategorySuggestions = async (description: string, count: number): Promise<string[]> => {
    // ... same implementation as before
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
        
        const suggestions = safeParseJson<string[]>(response.text, []);
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
    // ... same implementation as before
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
        
        const suggestions = safeParseJson<string[]>(response.text, []);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];
    } catch (error) {
        console.error("Error generating B2B suggestions:", error);
        return [];
    }
};