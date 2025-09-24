import { GoogleGenAI, Type } from "@google/genai";
import { UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from '../types';

type ProgressUpdateCallback = (update: { message: string, progress: number }) => void;

export const generateLocalGuide = async (
  userInfo: UserBusinessInfo,
  csvData: string,
  onProgressUpdate: ProgressUpdateCallback
): Promise<LocalGuide> => {
    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Step 1: Parse CSV data with intelligent column detection
    onProgressUpdate({ message: "Analyse du fichier CSV...", progress: 5 });
    
    const lines = csvData.trim().split('\n');
    
    const partners = lines
        .slice(1) // Skip header row
        .map(line => {
            if (!line.trim() || !line.startsWith('"')) return null; // Skip empty or malformed lines

            // Robust CSV parsing for format where all fields are quoted
            const values = line.substring(1, line.length - 1).split('","');
            
            const name = values[1]?.trim();
            if (!name) return null;

            let address = '';
            // Heuristic: search for address in columns from index 4 onwards
            // This accommodates for variations in scraped data layout
            for (let i = 4; i < values.length && i < 10; i++) { // Check a reasonable number of columns
                const field = values[i].trim();

                // Skip obviously non-address fields
                if (!field || field === '·' || field.toLowerCase().startsWith('ouvert') || field.toLowerCase().startsWith('fermé')) {
                    continue;
                }
                
                // A plausible address contains a street keyword OR (contains a number AND some letters).
                // This avoids matching phone numbers (mostly digits/spaces) or ratings.
                const hasStreetKeyword = /\b(rue|chemin|impasse|route|avenue|allée|av|rte|chem|imp|all|bis)\b/i.test(field);
                const hasLetterAndDigit = /[a-zA-Z]/.test(field) && /\d/.test(field);
                const isReviewCount = /^\(\d+\)$/.test(field); // e.g. (85)
                const isRating = /^\d,\d$/.test(field); // e.g. 4,9

                if (!isReviewCount && !isRating && (hasStreetKeyword || hasLetterAndDigit)) {
                    address = field;
                    break;
                }
            }

            if (!address) {
                console.warn(`Could not find a valid address for: ${name}`);
                return null;
            }

            return { name, address };
        })
        .filter((p): p is { name: string; address: string } => p !== null && !!p.name && !!p.address)
        .slice(0, userInfo.linkCount);

    if (partners.length === 0) {
        throw new Error("Aucune entreprise avec un nom et une adresse plausible n'a été trouvée dans le CSV. Vérifiez le format du fichier ou le nombre d'entreprises à traiter.");
    }

    onProgressUpdate({ message: `Préparation de la génération pour ${partners.length} entreprises...`, progress: 10 });

    // Step 2: Construct the prompt
    const prompt = `
    Contexte : Mon entreprise s'appelle "${userInfo.name}" et notre activité est : "${userInfo.description}". Je souhaite créer des fiches descriptives pour un guide local mettant en avant mes partenaires.

    Tâche : Pour chaque entreprise partenaire dans la liste ci-dessous, rédige les informations demandées en français. Les descriptions doivent être uniques, engageantes et optimisées pour le référencement local (SEO). Si pertinent, crée un lien subtil avec mon activité.

    Important pour l'adresse : Trouve l'adresse COMPLÈTE et EXACTE pour chaque entreprise en te basant sur le nom et le fragment d'adresse fourni. Puis, à partir de l'adresse complète, formate le champ "city" de la manière suivante : "[Ville] ([Code Postal]) en [Département]".
    Par exemple, si l'adresse fournie est "45 Rte de Bessières", tu dois chercher et trouver "45 Rte de Bessières, 31240 L'Union". Le champ "city" sera alors "L'Union (31240) en Haute-Garonne".

    Liste des partenaires :
    ${partners.map(p => `- ${p.name}, situé à ${p.address}`).join('\n')}

    Pour chaque partenaire, fournis les champs suivants :
    - name: Le nom complet de l'entreprise, tel que fourni.
    - address: L'adresse postale complète et exacte que tu as trouvée.
    - city: Le secteur formaté comme demandé : "[Ville] ([Code Postal]) en [Département]".
    - activity: Une phrase courte et percutante décrivant l'activité principale et la spécialité.
    - extract: Un résumé de 2-3 phrases (environ 160 caractères), parfait pour une méta-description. Il doit être concis et donner envie.
    - description: Une description détaillée et bien structurée (2-3 paragraphes) au format HTML. Utilise des balises <p> pour les paragraphes. Mets en valeur les points forts, les produits/services clés et l'intérêt pour un habitant ou un visiteur local. La description doit être professionnelle et informative.

    Format de sortie : Tu dois retourner UNIQUEMENT un tableau JSON. Chaque élément du tableau doit être un objet représentant un partenaire, avec les champs listés ci-dessus.
    `;

    // Step 3: Define the response schema
    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            activity: { type: Type.STRING, description: "Activité et spécificité de l'entreprise." },
            name: { type: Type.STRING, description: "Nom / Société." },
            address: { type: Type.STRING, description: "Adresse postale complète et exacte." },
            city: { type: Type.STRING, description: "Secteur / Ville formaté : [Ville] ([Code Postal]) en [Département]." },
            extract: { type: Type.STRING, description: "Extrait court (160 caractères) pour méta-description." },
            description: { type: Type.STRING, description: "Description détaillée au format HTML (<p>)." },
          },
        },
      };

    // Step 4: Call Gemini API
    onProgressUpdate({ message: "Génération par l'IA en cours...", progress: 20 });
    
    let jsonString: string;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        jsonString = response.text;
    } catch(error) {
        console.error("Erreur de l'API Gemini:", error);
        throw new Error(`Une erreur est survenue lors de la communication avec l'API Gemini. Détails : ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 5: Parse and return the response
    onProgressUpdate({ message: "Finalisation du guide...", progress: 95 });

    if (!jsonString || jsonString.trim() === '') {
        throw new Error("La réponse de l'API Gemini est vide.");
    }
    
    try {
        const generatedGuide: LocalGuide = JSON.parse(jsonString);

        if (!Array.isArray(generatedGuide)) {
            throw new Error(`La réponse de l'IA n'est pas un tableau JSON valide. Reçu: ${typeof generatedGuide}`);
        }
        
        if (generatedGuide.length > 0) {
            const firstItem = generatedGuide[0];
            const requiredKeys: (keyof GeneratedBusinessInfo)[] = ["name", "address", "city", "activity", "extract", "description"];
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