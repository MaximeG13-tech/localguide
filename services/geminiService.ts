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


// --- START: UNIFIED AI AGENT ---

/**
 * AGENT DE GÉNÉRATION ET VÉRIFICATION UNIFIÉ
 * Mission : Trouver des entreprises réelles, vérifier leurs informations et générer
 * tout le contenu nécessaire en une seule passe en utilisant Google Search.
 */
const generateVerifiedBusinessesForCategory = async (
    category: string,
    info: UserBusinessInfo,
    usedNames: Set<string>,
    radius: number,
    signal: AbortSignal,
    limit: number
): Promise<GeneratedBusinessInfo[]> => {
    const prompt = `
    Tu es un expert en SEO local et un analyste de données méticuleux. Ta mission est de trouver des entreprises françaises **réelles, existantes et actuellement en activité** qui correspondent parfaitement aux critères ci-dessous. Tu dois utiliser EXCLUSIVEMENT l'outil Google Search pour toutes tes recherches. N'invente AUCUNE information.

    **CRITÈRES DE RECHERCHE :**
    1.  **Catégorie d'entreprise :** "${category}"
    2.  **Zone de recherche :** Dans un rayon de ${radius} km autour de "${info.partnerSearchAddress}".
    3.  **Nombre de résultats :** Trouve jusqu'à ${limit} entreprises uniques.
    4.  **Exclusions :** Ne pas inclure les entreprises déjà traitées portant les noms suivants : ${[...usedNames].join(', ') || 'Aucun'}.

    **PROCESSUS OBLIGATOIRE :**
    Pour chaque entreprise trouvée, tu dois collecter et VÉRIFIER les informations suivantes. Si une information est introuvable ou invalide (ex: site web cassé), tu dois la mettre à \`null\`.

    **FORMAT DE DONNÉES À RETOURNER (JSON) :**
    Pour chaque entreprise, fournis un objet JSON avec les champs suivants :
    -   \`name\`: Le nom officiel et complet de l'entreprise.
    -   \`activity\`: La catégorie demandée. Ici, ce sera toujours "${category}".
    -   \`address\`: L'adresse postale complète et valide.
    -   \`city\`: La ville extraite de l'adresse.
    -   \`phone\`: Le numéro de téléphone principal. Doit être un numéro français valide.
    -   \`website\`: L'URL **fonctionnelle** du site web officiel. Doit commencer par http ou https. Si non trouvé ou cassé, utilise \`null\`.
    -   \`googleMapsUri\`: L'URL **valide** de la fiche Google Maps. Si non trouvée, utilise \`null\`.
    -   \`siret\`: Le numéro SIRET à 14 chiffres, sans espaces. Si non trouvé, utilise \`null\`.
    -   \`rating\`: La note moyenne sur Google (ex: 4.5). Si non disponible, utilise \`null\`.
    -   \`userRatingCount\`: Le nombre total d'avis sur Google. Si non disponible, utilise \`null\`.
    -   \`extract\`: Un résumé court et accrocheur (20-30 mots) basé sur les informations VRAIES trouvées sur leur site ou fiche Google.
    -   \`description\`: Une description détaillée (100-150 mots) optimisée pour le SEO local, formatée en HTML simple (paragraphes \`<p>\`). Le contenu doit être basé sur des informations réelles, pas inventé.
    -   \`source\`: Remplis ce champ avec la valeur "Google Search via Gemini API".

    **FORMAT DE SORTIE FINAL :**
    Réponds UNIQUEMENT avec un tableau JSON contenant les objets des entreprises trouvées. Si aucune entreprise valide n'est trouvée, réponds avec un tableau vide : \`[]\`. Ne fournis aucun texte, explication ou formatage markdown en dehors du JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            activity: { type: Type.STRING },
                            address: { type: Type.STRING },
                            city: { type: Type.STRING },
                            phone: { type: Type.STRING },
                            website: { type: Type.STRING },
                            googleMapsUri: { type: Type.STRING },
                            siret: { type: Type.STRING },
                            rating: { type: Type.NUMBER },
                            userRatingCount: { type: Type.INTEGER },
                            extract: { type: Type.STRING },
                            description: { type: Type.STRING },
                            source: { type: Type.STRING },
                        },
                        required: ['name', 'activity', 'address', 'city', 'phone', 'extract', 'description', 'source']
                    }
                }
            }
        });
        
        if (signal.aborted) throw new Error('AbortError');
        
        const results = safeParseJson<GeneratedBusinessInfo[]>(response.text, []);
        // Post-filter to ensure nulls are handled correctly, as schema doesn't enforce nullability
        return results.map(biz => ({
            ...biz,
            website: biz.website || undefined,
            googleMapsUri: biz.googleMapsUri || undefined,
            siret: biz.siret || undefined,
            rating: biz.rating === 0 ? 0 : (biz.rating || undefined),
            userRatingCount: biz.userRatingCount === 0 ? 0 : (biz.userRatingCount || undefined)
        }));

    } catch (error) {
        console.error(`Unified generation agent failed for category ${category}:`, error);
        if (signal.aborted) throw new Error('AbortError');
        throw error; // Re-throw to be caught by the main generator function
    }
};

// --- END: UNIFIED AI AGENT ---

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
    
    const checkSignal = () => { if (signal.aborted) throw new Error('AbortError'); };

    let categories: string[] = options.initialCategories || [];
    if (categories.length === 0) {
        throw new Error("Aucune catégorie de partenaire n'a été générée ou fournie.");
    }
    
    const finalGuide: LocalGuide = [];
    const usedNames = new Set<string>();
    let currentRadius = info.partnerSearchRadius;
    const MAX_RADIUS = 50;

    while (finalGuide.length < info.linkCount && currentRadius <= MAX_RADIUS) {
        checkSignal();

        if (currentRadius > info.partnerSearchRadius) {
            progressCallback({ message: `Aucun résultat. Recherche étendue à ${currentRadius} km...`, percentage: 15 });
        }

        for (let i = 0; i < categories.length; i++) {
            if (finalGuide.length >= info.linkCount) break;

            const category = categories[i];
            const progressPercentage = 15 + ((i + 1) / categories.length) * 80;
            
            progressCallback({ 
                message: `Recherche pour : "${category}" (${finalGuide.length}/${info.linkCount})`,
                percentage: progressPercentage
            });

            const cacheKey = `v4-${JSON.stringify({ category, address: info.partnerSearchAddress, radius: currentRadius })}`;
            let businesses: GeneratedBusinessInfo[] = [];
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData) {
                businesses = JSON.parse(cachedData);
            } else {
                const businessesToFind = info.linkCount - finalGuide.length;
                businesses = await generateVerifiedBusinessesForCategory(category, info, usedNames, currentRadius, signal, businessesToFind);
                if (businesses.length > 0) {
                    sessionStorage.setItem(cacheKey, JSON.stringify(businesses));
                }
                // Add a delay to respect API rate limits and prevent quota errors.
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            checkSignal();

            for (const business of businesses) {
                if (finalGuide.length < info.linkCount && business.name && !usedNames.has(business.name.toLowerCase())) {
                    onBusinessVerified(business);
                    finalGuide.push(business);
                    usedNames.add(business.name.toLowerCase());
                }
            }
        }

        if (finalGuide.length >= info.linkCount) break;
        currentRadius *= 2;
    }

    if (finalGuide.length === 0) {
       progressCallback({ message: "Aucun partenaire vérifié trouvé.", percentage: 100 });
       throw new Error(`Aucune entreprise n'a pu être trouvée et vérifiée, même après avoir étendu la recherche à ${currentRadius/2} km. Essayez une autre zone ou d'autres catégories.`);
    }

    return { guide: finalGuide, categoriesUsed: categories };
};


export const generateInitialCategorySuggestions = async (description: string, count: number): Promise<string[]> => {
    const prompt = `
    Analyse la description d'activité suivante et identifie ${count} catégories de partenaires B2B qui seraient de **bons rapporteurs d'affaires** pour cette entreprise.
    Pense en termes de 'qui peut leur envoyer des clients ?'. Sois spécifique et pertinent.

    **Description de l'entreprise cliente :** "${description}"

    **RÈGLE STRICTE :** Ne suggère JAMAIS des entreprises qui sont des concurrents directs ou dans le même secteur d'activité principal. Cherche des partenaires **complémentaires** qui ciblent la même clientèle mais n'offrent pas le même service.
    Par exemple, si l'entreprise vend des camping-cars, ne suggère PAS 'vendeurs de caravanes' ou 'concessionnaires de véhicules de loisirs'. Suggère plutôt 'Aires de service pour camping-cars', 'Magasins d’accessoires de plein air', ou 'Agences de location de véhicules de tourisme'.

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
        throw error;
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