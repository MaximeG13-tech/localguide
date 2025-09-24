import { GoogleGenAI } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

export const generateLocalGuide = async (
  userInfo: UserBusinessInfo
): Promise<LocalGuide> => {
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Step 1: Construct the prompt for finding businesses
    const prompt = `
    Contexte : Mon entreprise s'appelle "${userInfo.name}" et notre activité est : "${userInfo.description}". Je souhaite créer un guide local pour trouver des partenaires et des rapporteurs d'affaires.

    Tâche : Trouve ${userInfo.linkCount} entreprises partenaires potentielles pour moi. L'objectif est de trouver des entreprises **complémentaires** à mon activité, pas des concurrents. Elles doivent être situées dans un rayon de ${userInfo.partnerSearchRadius} km autour de "${userInfo.partnerSearchAddress}".

    Règles d'exclusion strictes :
    1.  **INTERDICTION DE CONCURRENCE** : C'est la règle la plus importante. Les entreprises que tu listes ne doivent **ABSOLUMENT PAS** être des concurrents directs ou indirects de mon activité, qui est : "${userInfo.description}". L'objectif est de trouver des partenaires, pas des rivaux.
    2.  **Secteur Public** : Ne PAS inclure toute forme d'institution publique, de collectivité locale (mairie, département, région), de service public, ou d'administration publique.
    3.  **Grandes Entreprises** : Exclure les grands groupes privés, les entreprises du CAC 40, les sociétés multinationales, les ETI (Entreprises de Taille Intermédiaire) et les GE (Grandes Entreprises). Tu dois te concentrer EXCLUSIVEMENT sur les TPE/PME, les artisans, et les commerces locaux.

    Pour chaque entreprise (TPE/PME/artisan) trouvée, tu dois impérativement trouver son adresse complète et exacte, ainsi qu'un numéro de téléphone vérifié. Fournis les informations suivantes en français :
    - name: Le nom complet de l'entreprise.
    - address: L'adresse postale complète et exacte que tu as trouvée.
    - phone: Le numéro de téléphone vérifié.
    - city: Le secteur, formaté ainsi : "[Ville] ([Code Postal]) [préposition] [Département]". La préposition doit être choisie en fonction du département, en suivant IMPÉRATIVEMENT les règles grammaticales françaises suivantes :
        - en Île-de-France
        - dans l'Ain
        - dans l'Aisne
        - dans l’Allier
        - dans les Alpes-de-Haute-Provence
        - dans les Hautes-Alpes
        - dans les Alpes-Maritimes
        - dans l’Ardèche
        - dans les Ardennes
        - dans l’Ariège
        - dans l’Aube
        - dans l’Aude
        - dans l’Aveyron
        - dans les Bouches-du-Rhône
        - dans le Calvados
        - dans le Cantal
        - dans la Charente
        - dans la Charente-Maritime
        - dans le Cher
        - en Corrèze
        - dans la Corse-du-Sud
        - en Haute-Corse
        - dans la Côte-d’Or
        - dans les Côtes-d’Armor
        - dans la Creuse
        - en Dordogne
        - dans le Doubs
        - dans la Drôme
        - dans l’Eure
        - dans l’Eure-et-Loir
        - dans le Finistère
        - dans le Gard
        - dans la Haute-Garonne
        - dans le Gers
        - dans la Gironde
        - dans le Jura
        - dans les Landes
        - dans le Loir-et-Cher
        - dans la Loire
        - dans la Haute-Loire
        - dans la Loire-Atlantique
        - dans le Loiret
        - dans le Lot
        - dans le Lot-et-Garonne
        - dans la Lozère
        - dans le Maine-et-Loire
        - dans la Manche
        - dans la Marne
        - dans la Haute-Marne
        - dans la Mayenne
        - dans la Meurthe-et-Moselle
        - dans la Meuse
        - dans le Morbihan
        - dans la Moselle
        - dans la Nièvre
        - dans le Nord
        - dans l’Oise
        - dans l’Orne
        - dans le Pas-de-Calais
        - dans le Puy-de-Dôme
        - dans les Pyrénées-Atlantiques
        - dans les Hautes-Pyrénées
        - dans les Pyrénées-Orientales
        - dans le Bas-Rhin
        - dans le Haut-Rhin
        - dans le Rhône
        - dans la Haute-Saône
        - dans la Saône-et-Loire
        - dans la Sarthe
        - en Savoie
        - en Haute-Savoie
        - dans Paris
        - dans la Seine-Maritime
        - dans la Seine-et-Marne
        - dans les Yvelines
        - dans les Deux-Sèvres
        - dans la Somme
        - dans le Tarn
        - dans le Tarn-et-Garonne
        - dans le Var
        - dans le Vaucluse
        - dans la Vendée
        - dans la Vienne
        - dans la Haute-Vienne
        - dans les Vosges
        - dans l’Yonne
        - dans le Territoire de Belfort
        - dans l’Essonne
        - dans les Hauts-de-Seine
        - dans la Seine-Saint-Denis
        - dans le Val-de-Marne
        - dans le Val-d’Oise
        - en Guadeloupe
        - en Martinique
        - en Guyane
        - à La Réunion
        - à Mayotte
        Exemples de format attendu : "Besançon (25000) dans le Doubs" ou "Annecy (74000) en Haute-Savoie". Cette information doit être déduite de l'adresse complète.
    - activity: Une phrase courte décrivant l'activité principale et la spécialité.
    - extract: Un résumé de 2-3 phrases (environ 160 caractères), pour une méta-description.
    - description: Une description détaillée (2-3 paragraphes) au format HTML, utilisant des balises <p>.

    Format de sortie : Tu dois retourner UNIQUEMENT un tableau JSON valide. Le tableau ne doit contenir que les objets des entreprises, sans aucun autre texte, explication ou formatage. Chaque objet doit avoir les clés suivantes : "name", "address", "phone", "city", "activity", "extract", "description".
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
        throw new Error("La réponse de l'API Gemini est vide.");
    }
    
    try {
        // The response might be wrapped in ```json ... ```, so we need to extract it.
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        const parsableString = jsonMatch ? jsonMatch[1] : jsonString;

        const generatedGuide: LocalGuide = JSON.parse(parsableString);

        if (!Array.isArray(generatedGuide)) {
            throw new Error(`La réponse de l'IA n'est pas un tableau JSON valide. Reçu: ${typeof generatedGuide}`);
        }
        
        if (generatedGuide.length > 0) {
            const firstItem = generatedGuide[0];
            const requiredKeys: (keyof GeneratedBusinessInfo)[] = ["name", "address", "city", "activity", "extract", "description", "phone"];
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