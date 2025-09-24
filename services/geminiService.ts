import { GoogleGenAI } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

type ProgressUpdateCallback = (update: { message: string, progress: number }) => void;

export const generateLocalGuide = async (
  userInfo: UserBusinessInfo,
  onProgressUpdate: ProgressUpdateCallback
): Promise<LocalGuide> => {
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    onProgressUpdate({ message: "Recherche des partenaires locaux...", progress: 5 });

    // Step 1: Construct the prompt for finding businesses
    const prompt = `
    Contexte : Mon entreprise s'appelle "${userInfo.name}" et notre activité est : "${userInfo.description}". Je souhaite créer un guide local.

    Tâche : Trouve ${userInfo.linkCount} entreprises partenaires potentielles pour moi. Elles doivent être situées dans un rayon de ${userInfo.partnerSearchRadius} km autour de "${userInfo.partnerSearchAddress}". Pour chaque entreprise, tu dois impérativement trouver son adresse complète et exacte, ainsi qu'un numéro de téléphone vérifié.

    Pour chaque entreprise trouvée, fournis les informations suivantes en français :
    - name: Le nom complet de l'entreprise.
    - address: L'adresse postale complète et exacte que tu as trouvée.
    - phone: Le numéro de téléphone vérifié.
    - city: Le secteur, formaté ainsi : "[Ville] ([Code Postal]) en [Département]". Ceci doit être déduit de l'adresse complète.
    - activity: Une phrase courte décrivant l'activité principale et la spécialité.
    - extract: Un résumé de 2-3 phrases (environ 160 caractères), pour une méta-description.
    - description: Une description détaillée (2-3 paragraphes) au format HTML, utilisant des balises <p>.

    Format de sortie : Tu dois retourner UNIQUEMENT un tableau JSON valide. Le tableau ne doit contenir que les objets des entreprises, sans aucun autre texte, explication ou formatage. Chaque objet doit avoir les clés suivantes : "name", "address", "phone", "city", "activity", "extract", "description".
    `;

    onProgressUpdate({ message: `Préparation de la génération pour ${userInfo.linkCount} entreprises...`, progress: 10 });
    
    // Step 2: Call Gemini API with Google Search grounding
    onProgressUpdate({ message: "Génération par l'IA en cours...", progress: 20 });
    
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
    onProgressUpdate({ message: "Finalisation du guide...", progress: 95 });

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
        
        onProgressUpdate({ message: "Guide généré avec succès!", progress: 100 });
        return generatedGuide;
    } catch (e) {
        console.error("Erreur de parsing JSON:", e);
        console.error("Réponse brute de l'IA:", jsonString);
        throw new Error("La réponse de l'IA n'a pas pu être traitée. Le format JSON est peut-être incorrect. Consultez la console pour plus de détails.");
    }
};