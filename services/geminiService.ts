import { GoogleGenAI, Type } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

// FIX: Initialize the GoogleGenAI client according to guidelines.
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
        googleMapsUri: { type: Type.STRING, description: "L'URI directe vers la fiche Google Maps de l'entreprise. Si non trouvé, laisser une chaîne vide." },
        rating: { type: Type.NUMBER, description: "Note moyenne sur Google (ex: 4.5). Si non trouvé, ne pas inclure ou mettre à null." },
        userRatingCount: { type: Type.INTEGER, description: "Nombre total d'avis sur Google. Si non trouvé, ne pas inclure ou mettre à null." },
        managerPhone: { type: Type.STRING, description: "Numéro de téléphone potentiel du gérant/décideur, si trouvable. Sinon, laisser une chaîne vide." },
        siret: { type: Type.STRING, description: "Numéro de SIRET de l'entreprise, si trouvable. Sinon, laisser une chaîne vide." },
    },
    required: ["activity", "name", "address", "city", "extract", "description", "phone"]
};


const generateSingleBusinessProfile = async (
    prompt: string,
    useGoogleSearch: boolean = false
): Promise<GeneratedBusinessInfo> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
            config: {
                responseMimeType: 'application/json',
                responseSchema: businessInfoSchema,
                temperature: 0.7,
            }
        });
        
        // FIX: Directly access the 'text' property as per guidelines.
        const responseText = response.text;
        
        let parsedResponse = JSON.parse(responseText);

        // Robustness fix: If the AI returns a single object instead of an array of one object.
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
            return parsedResponse[0];
        }
        if (typeof parsedResponse === 'object' && !Array.isArray(parsedResponse) && parsedResponse !== null) {
            return parsedResponse as GeneratedBusinessInfo;
        }

        throw new Error("La réponse de l'IA n'est pas dans le format attendu (objet unique).");

    } catch (error) {
        console.error("Error generating business profile:", error);
        if (error instanceof Error) {
            // Check for parsing error to give a more specific message
            if (error.message.includes("Unexpected token")) {
                 throw new Error(`Erreur de l'IA : Le format JSON retourné est invalide.`);
            }
            throw new Error(`Erreur de l'IA lors de la génération d'un profil : ${error.message}`);
        }
        throw new Error("Une erreur inconnue est survenue lors de la communication avec l'IA.");
    }
};

export const generateLocalGuide = async (
    info: UserBusinessInfo,
    progressCallback: (message: string) => void,
    excludeCategories: string[] | null,
    userFeedback: string | null
): Promise<{ guide: LocalGuide, categoriesUsed: string[] }> => {

    progressCallback("Identification des catégories de partenaires B2B...");

    const categoryPrompt = `
    Je suis en train de créer un guide local pour mon client.
    Mon client est : "${info.name}", qui se décrit comme suit : "${info.description}".
    
    Identifie ${info.linkCount} catégories de partenaires B2B **distinctes et pertinentes** en France.
    Ces partenaires doivent être des entreprises qui pourraient collaborer avec, fournir des services à, ou être des clients de mon client.
    
    ${excludeCategories ? `**Très important :** Exclus les catégories suivantes qui ont déjà été utilisées : ${JSON.stringify(excludeCategories)}.` : ''}
    ${userFeedback ? `**Prends en compte ce feedback utilisateur pour orienter ton choix :** "${userFeedback}".` : ''}

    Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Chaque chaîne doit être un nom de catégorie concis en français.
    Exemple de réponse : ["Plombiers chauffagistes", "Électriciens du bâtiment", "Entreprises de couverture"]
    `;

    const categoryResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: categoryPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    // FIX: Directly access the 'text' property as per guidelines.
    const categories: string[] = JSON.parse(categoryResponse.text);

    if (!categories || categories.length === 0) {
        throw new Error("L'IA n'a pas pu identifier de catégories de partenaires pertinentes.");
    }
    
    const guide: LocalGuide = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        progressCallback(`(${i + 1}/${categories.length}) Recherche d'une entreprise pour : "${category}"...`);

        const businessSearchPrompt = `
        Ton rôle est d'agir comme un analyste commercial local pour trouver des entreprises partenaires.

        **Contexte du client :**
        - Nom : "${info.name}"
        - Description : "${info.description}"
        - Localisation de recherche : Près de "${info.partnerSearchAddress}", dans un rayon de ${info.partnerSearchRadius} km.

        **Ta mission actuelle :**
        1.  Trouve UNE SEULE entreprise **réelle et existante** qui correspond à la catégorie : "${category}".
        2.  L'entreprise doit être située dans la zone de recherche spécifiée.
        3.  **TRÈS IMPORTANT :** Ne propose JAMAIS une entreprise qui a déjà été listée : ${[...usedNames].join(', ')}.
        4.  Génère un profil complet pour cette entreprise en suivant le format JSON demandé.
        5.  Rédige la description en HTML (<p> tags) et l'extrait de manière engageante et optimisée pour le SEO.
        
        Réponds UNIQUEMENT avec un seul objet JSON. Tous les textes doivent être en français.
        `;

        try {
            const businessInfo = await generateSingleBusinessProfile(businessSearchPrompt, true);
        
            if (businessInfo && businessInfo.name && !usedNames.has(businessInfo.name.toLowerCase())) {
                guide.push(businessInfo);
                usedNames.add(businessInfo.name.toLowerCase());
            } else {
                 progressCallback(`(${i + 1}/${categories.length}) Doublon détecté ou erreur pour "${category}", je passe.`);
            }
        } catch (e) {
            console.warn(`Could not generate a profile for category "${category}". Skipping.`, e);
            progressCallback(`(${i + 1}/${categories.length}) Erreur pour "${category}", je passe.`);
        }
    }

    if (guide.length === 0) {
        throw new Error("L'IA n'a pas réussi à générer de fiches d'entreprise. Veuillez réessayer avec des critères différents.");
    }

    return { guide, categoriesUsed: categories };
};


export const generateB2BCategorySuggestions = async (description: string): Promise<string[]> => {
    const prompt = `
    En te basant sur la description d'activité suivante, suggère 5 catégories de partenaires B2B pertinentes et variées.
    Ces suggestions serviront à affiner une recherche future. Elles doivent être concises.

    **Description de l'activité :** "${description}"

    Réponds UNIQUEMENT avec un tableau JSON contenant 5 chaînes de caractères. Les catégories doivent être en français.
    Exemple pour un vendeur de voitures : ["Services de detailing auto", "Agences d'assurance auto", "Sociétés de marketing local", "Magasins de pneus", "Fournisseurs de pièces détachées"]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        
        // FIX: Directly access the 'text' property as per guidelines.
        const suggestions = JSON.parse(response.text);

        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        console.warn("IA returned non-string array for suggestions", suggestions);
        return [];
    } catch (error) {
        console.error("Error generating B2B suggestions:", error);
        return []; // Return empty array on error to not break the UI
    }
};