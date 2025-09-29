import { GoogleGenAI } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

export const generateLocalGuide = async (
  userInfo: UserBusinessInfo
): Promise<LocalGuide> => {
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const websitePreferenceText = {
      'with': 'Les entreprises doivent OBLIGATOIREMENT avoir un site internet.',
      'without': 'Les entreprises ne doivent OBLIGATOIREMENT PAS avoir de site internet.',
      'mix': 'Tu peux inclure un mélange d\'entreprises avec et sans site internet.'
    }[userInfo.websitePreference];

    // Step 1: Construct the prompt for finding businesses
    const prompt = `
    **PRIORITÉ ABSOLUE : ZÉRO HALLUCINATION. LA VÉRACITÉ EST NON-NÉGOCIABLE.**
    Tu es un assistant de recherche expert chargé de trouver des entreprises **RÉELLES ET VÉRIFIABLES**. Ta mission est d'une importance capitale. Chaque information que tu fournis, en particulier le nom, l'adresse et le numéro de SIRET, doit correspondre à une entité légale existante en France. **INVENTER UNE ENTREPRISE, UNE ADRESSE, OU UN NUMÉRO DE SIRET EST UN ÉCHEC TOTAL DE LA TÂCHE.**

    **MISSION :**
    Je suis l'entreprise "${userInfo.name}" (${userInfo.description}). Trouve pour moi des entreprises partenaires potentielles. Ces partenaires doivent être situés dans un rayon de ${userInfo.partnerSearchRadius} km autour de l'adresse suivante : "${userInfo.partnerSearchAddress}".

    **PROCESSUS DE VÉRIFICATION OBLIGATOIRE POUR CHAQUE ENTREPRISE :**
    Pour chaque entreprise que tu identifies, tu dois suivre ces étapes SANS EXCEPTION :
    1.  **VÉRIFICATION DE L'EXISTENCE :** Utilise la recherche Google pour confirmer que l'entreprise existe réellement à l'adresse indiquée. Cherche son site officiel ou sa fiche Google Business Profile.
    2.  **VÉRIFICATION DU SIRET :** C'est l'étape la plus critique. Tu dois trouver le numéro de SIRET à 14 chiffres de l'entreprise. Utilise des recherches comme "[Nom de l'entreprise] [Ville] SIRET". **Si tu ne trouves PAS de numéro de SIRET valide et vérifiable, tu dois IMPÉRATIVEMENT abandonner cette entreprise et en chercher une autre.**
    3.  **COLLECTE DES DONNÉES :** Uniquement APRÈS avoir vérifié l'existence ET le SIRET, collecte les informations ci-dessous.

    **RÈGLES D'EXCLUSION STRICTES (À APPLIQUER APRÈS LA VÉRIFICATION) :**
    - **NON-CONCURRENCE :** Les entreprises ne doivent pas être des concurrents de mon activité : "${userInfo.description}".
    - **PAS DE SECTEUR PUBLIC :** Aucune administration, mairie, collectivité, etc.
    - **TPE/PME UNIQUEMENT :** Exclus les grands groupes, ETI, GE, et multinationales. Concentre-toi sur les artisans, commerces locaux, TPE et PME.
    - **PRÉSENCE DE SITE WEB :** ${websitePreferenceText}

    **FORMAT DES DONNÉES REQUISES (POUR CHAQUE ENTREPRISE VÉRIFIÉE) :**
    - name: Le nom légal complet de l'entreprise.
    - address: L'adresse postale complète, exacte et vérifiée.
    - phone: Le numéro de téléphone principal.
    - siret: Le numéro de SIRET à 14 chiffres, **vérifié et non-inventé**.
    - city: Le secteur, formaté ainsi : "[Ville] ([Code Postal]) [préposition] [Département]". La préposition doit être choisie en fonction du département, en suivant IMPÉRATIVEMENT les règles grammaticales françaises suivantes :
        - en Île-de-France, en Corrèze, en Dordogne, en Savoie, en Haute-Savoie, en Guadeloupe, en Martinique, en Guyane
        - à La Réunion, à Mayotte
        - dans l'Ain, dans l'Aisne, dans l’Allier, etc. (la majorité des cas)
        - dans les Alpes-de-Haute-Provence, dans les Hautes-Alpes, etc. (pour les pluriels)
        Exemples de format attendu : "Besançon (25000) dans le Doubs" ou "Annecy (74000) en Haute-Savoie". Cette information doit être déduite de l'adresse complète.
    - activity: Une phrase courte décrivant l'activité principale et la spécialité.
    - extract: Un résumé de 2-3 phrases (environ 160 caractères), pour une méta-description.
    - description: Une description détaillée (2-3 paragraphes) au format HTML, utilisant des balises <p>.
    - website: L'URL complète du site internet de l'entreprise. Si elle n'en a pas, retourne une chaîne vide "".
    - googleBusinessProfileLink: Le lien direct vers la fiche d'établissement Google (Google Business Profile). Si non trouvé, retourne une chaîne vide "".
    - managerPhone: Le numéro de téléphone direct du gérant, si trouvable publiquement. Sinon, retourne une chaîne vide "".

    **QUANTITÉ ET QUALITÉ : UN REQUIS ABSOLU :**
    Tu DOIS trouver **exactement ${userInfo.linkCount}** entreprises. Ce nombre n'est pas une suggestion, c'est un impératif.
    Chacune de ces ${userInfo.linkCount} entreprises doit passer le processus de vérification strict (existence réelle + SIRET valide). Il n'y a aucune exception.
    Si tu as des difficultés à trouver le nombre requis d'entreprises qui satisfont aux critères, tu dois persévérer, étendre ta recherche, ou essayer des requêtes différentes. Ne retourne JAMAIS une liste incomplète. Ne retourne JAMAIS une entreprise non vérifiée pour atteindre le quota. Ta mission est de fournir une liste complète ET 100% fiable.

    **FORMAT DE SORTIE FINAL :** Tu dois retourner UNIQUEMENT un tableau JSON valide. Le tableau ne doit contenir que les objets des entreprises, sans aucun autre texte, explication ou formatage.
    `;

    // Step 2: Call Gemini API with Google Search grounding
    let jsonString: string;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        jsonString = response.text;
    } catch(error) {
        console.error("Erreur de l'API Gemini:", error);
        throw new Error(`Une erreur est survenue lors de la communication avec l'API Gemini. Détails : ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 3: Parse and return the response
    if (!jsonString || jsonString.trim() === '') {
        throw new Error("La réponse de l'API Gemini est vide. Il est possible qu'aucune entreprise vérifiable correspondant à vos critères n'ait été trouvée.");
    }
    
    try {
        // The response might be wrapped in ```json ... ```, so we need to extract it.
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        const parsableString = jsonMatch ? jsonMatch[1] : jsonString;

        const generatedGuide: LocalGuide = JSON.parse(parsableString);

        if (!Array.isArray(generatedGuide)) {
            throw new Error(`La réponse de l'IA n'est pas un tableau JSON valide. Reçu: ${typeof generatedGuide}`);
        }
        
        // This validation is less critical now due to the strict prompt, but good to keep.
        if (generatedGuide.length > 0) {
            const firstItem = generatedGuide[0];
            const requiredKeys: (keyof GeneratedBusinessInfo)[] = ["name", "address", "city", "activity", "extract", "description", "phone", "website", "googleBusinessProfileLink", "managerPhone", "siret"];
            for (const key of requiredKeys) {
                if (!(key in firstItem)) {
                    throw new Error(`La réponse de l'IA est malformée. La clé '${key}' est manquante dans le premier objet.`);
                }
            }
        }
        
        return generatedGuide;
    } catch (e) {
        console.error("Erreur de parsing JSON:", e);
        console.error("Réponse brute de l'IA:", jsonString);
        throw new Error("La réponse de l'IA n'a pas pu être traitée. Le format JSON est peut-être incorrect. Consultez la console pour plus de détails.");
    }
};