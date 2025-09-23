import { GoogleGenAI, Type } from "@google/genai";
import { UserBusinessInfo, LocalGuide } from '../types';

if (!process.env.API_KEY) {
    throw new Error("Missing API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts a JSON string from a larger text block.
 * @param text The text to parse.
 * @returns The extracted JSON string, or null if not found.
 */
const extractJson = (text: string): string | null => {
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        const potentialJson = markdownMatch[1].trim();
        if (potentialJson.startsWith('[') && potentialJson.endsWith(']')) {
            return potentialJson;
        }
    }

    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return text.substring(startIndex, endIndex + 1);
    }
    
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
        return text.trim();
    }

    return null;
};

/**
 * Uses an AI agent to enrich CSV data by extracting city and postal code from addresses.
 * @returns A CSV string with added 'city' and 'postal_code' columns.
 */
async function enrichCsvDataWithAI(csvData: string, onProgressUpdate: (message: string) => void): Promise<string> {
    onProgressUpdate("Étape 1/3 : L'agent IA enrichit les adresses...");

    const lines = csvData.trim().split('\n');
    const header = lines.shift();
    if (!header) {
        throw new Error("Le fichier CSV est vide ou n'a pas d'en-tête.");
    }
    const dataRows = lines.join('\n');

    const prompt = `
    ROLE: Tu es un agent IA expert en traitement de données géographiques et en nettoyage de données CSV.

    OBJECTIF: Analyser le fichier CSV ci-dessous, identifier la colonne contenant l'adresse postale, et pour chaque ligne, extraire la ville et le code postal pour les ajouter dans de nouvelles colonnes.

    FICHIER CSV EN ENTRÉE:
    \`\`\`csv
    ${header}
    ${dataRows}
    \`\`\`

    INSTRUCTIONS DÉTAILLÉES:
    1.  **Identification des colonnes**: Identifie automatiquement la colonne contenant l'adresse postale. Elle peut avoir des noms variés comme 'address', 'adresse', 'location', etc.
    2.  **Extraction des Données**: Pour chaque ligne du CSV :
        a. Lis la valeur de la colonne d'adresse.
        b. Extrais avec précision la **ville** (ex: "Paris", "Marseille").
        c. Extrais avec précision le **code postal** (ex: "75017", "13008").
    3.  **Création de Nouvelles Colonnes**: Ajoute deux nouvelles colonnes à la fin de l'en-tête : "city" et "postal_code".
    4.  **Remplissage**: Peuple ces nouvelles colonnes avec les données extraites. Si la ville ou le code postal ne peuvent pas être déterminés à partir de l'adresse, laisse la cellule correspondante vide.
    5.  **Conservation**: Conserve TOUTES les colonnes et TOUTES les lignes originales du CSV d'entrée, en y ajoutant simplement les deux nouvelles colonnes. L'ordre des lignes et des colonnes originales doit être préservé.

    FORMAT DE SORTIE ATTENDU:
    - Tu dois retourner le résultat sous forme de texte brut au format CSV.
    - La première ligne de ta réponse DOIT être la ligne d'en-tête, incluant les nouvelles colonnes "city" et "postal_code".
    - Ne retourne RIEN d'autre : pas d'explication, pas de résumé, pas de formatage markdown, juste le contenu du CSV complet et enrichi.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const responseText = response.text.trim();
        const headerCols = header.split(',');
        if (!responseText.includes(headerCols[0]) || !responseText.includes('postal_code')) {
            console.error("L'enrichissement IA a retourné un format inattendu:", responseText);
            throw new Error("L'agent IA d'enrichissement d'adresses a retourné une réponse inattendue. Le format ne semble pas être un CSV valide.");
        }
        return responseText;
    } catch(error) {
        console.error("Erreur lors de l'étape d'enrichissement par l'agent IA:", error);
        if (error instanceof Error && error.message.includes("inattendue")) {
             throw error;
        }
        throw new Error("L'agent IA n'a pas pu enrichir la liste. L'API a peut-être rencontré un problème.");
    }
}


/**
 * Uses an AI agent to filter a CSV list of companies based on strict criteria.
 * @returns A CSV string containing only the validated companies.
 */
async function filterCompaniesWithAIAgent(userBusinessInfo: UserBusinessInfo, csvData: string, onProgressUpdate: (message: string) => void): Promise<string> {
    onProgressUpdate("Étape 2/3 : L'agent IA analyse les partenaires...");

    const lines = csvData.trim().split('\n');
    const header = lines.shift();
    if (!header) {
        throw new Error("Le fichier CSV est vide ou n'a pas d'en-tête.");
    }
    const dataRows = lines.join('\n');

    const clientInfoLines = [
        `- Nom : ${userBusinessInfo.name}`,
        `- Activité : ${userBusinessInfo.description}`
    ];
    if (userBusinessInfo.address) {
        clientInfoLines.push(`- Adresse : ${userBusinessInfo.address}`);
    }

    const prompt = `
    ROLE: Tu es un agent IA expert en analyse de données B2B et en SEO local. Ton rôle est de filtrer une liste de partenaires potentiels pour une entreprise cliente.

    OBJECTIF: Analyser le fichier CSV ci-dessous, qui a déjà été enrichi avec des colonnes 'city' et 'postal_code', et ne retourner que les lignes (y compris l'en-tête) qui correspondent STRICTEMENT aux critères de validation suivants.

    ENTREPRISE CLIENTE:
    ${clientInfoLines.join('\n    ')}

    LISTE DES PARTENAIRES POTENTIELS (Format CSV):
    \`\`\`csv
    ${header}
    ${dataRows}
    \`\`\`

    CRITÈRES DE VALIDATION IMPÉRATIFS (une entreprise doit remplir TOUTES les conditions pour être sélectionnée):
    1.  **Présence d'un site web**: La ligne DOIT contenir une URL de site web valide dans une colonne (généralement nommée 'website', 'url', ou similaire). Si la cellule est vide ou ne contient pas une URL, l'entreprise est rejetée.
    2.  **Adresse Valide**: Les colonnes 'city' et 'postal_code' DOIVENT contenir des valeurs non vides et valides. Si l'une de ces cellules est vide, l'entreprise est rejetée.
    3.  **Pertinence Commerciale**: L'activité de l'entreprise (déduite de son nom, de sa catégorie, etc.) DOIT être pertinente et complémentaire à celle de l'ENTREPRISE CLIENTE. Elle doit représenter un apporteur d'affaires potentiel. Par exemple, si le client vend des camping-cars, un partenaire pertinent pourrait être un camping, un site touristique, un garage spécialisé, mais PAS un concurrent direct (un autre vendeur de camping-cars) ou une activité sans rapport (une boulangerie, un coiffeur). Fais preuve de jugement commercial.

    FORMAT DE SORTIE ATTENDU:
    - Tu dois retourner le résultat sous forme de texte brut au format CSV.
    - La première ligne de ta réponse DOIT être la ligne d'en-tête originale du CSV fourni.
    - Les lignes suivantes doivent être les lignes de données COMPLÈTES et INCHANGÉES des entreprises qui ont passé la validation.
    - Ne retourne RIEN d'autre: pas d'explication, pas de résumé, pas de formatage markdown, juste le contenu du CSV filtré. Si aucune entreprise ne correspond, retourne uniquement la ligne d'en-tête.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text.trim();
    } catch(error) {
        console.error("Erreur lors de l'étape de filtrage par l'agent IA:", error);
        throw new Error("L'agent IA n'a pas pu filtrer la liste. L'API a peut-être rencontré un problème.");
    }
}

export const generateLocalGuide = async (userBusinessInfo: UserBusinessInfo, csvData: string, onProgressUpdate: (message: string) => void): Promise<LocalGuide> => {
    
    if (!csvData) {
        throw new Error("Le fichier CSV est vide ou n'a pas pu être lu.");
    }
    
    // Étape 1: Enrichir les adresses avec l'agent IA
    const enrichedCsvData = await enrichCsvDataWithAI(csvData, onProgressUpdate);

    // Étape 2: Filtrer les entreprises avec l'agent IA
    const filteredCsvData = await filterCompaniesWithAIAgent(userBusinessInfo, enrichedCsvData, onProgressUpdate);

    const filteredLines = filteredCsvData.trim().split('\n');
    const header = filteredLines.shift(); // Remove header

    if (!header || filteredLines.length === 0) {
        throw new Error("L'agent IA n'a trouvé aucune entreprise partenaire correspondant aux critères de qualité (site web, adresse complète, pertinence). Veuillez vérifier votre fichier CSV.");
    }

    onProgressUpdate("Étape 3/3 : Rédaction des fiches détaillées...");
    
    // Étape 3: Utiliser les entreprises filtrées pour la génération
    const dataRows = filteredLines.slice(0, userBusinessInfo.linkCount);
    if (dataRows.length === 0) {
         throw new Error("Aucune entreprise n'a été sélectionnée pour la génération après le filtrage par l'IA.");
    }
    const processedCsvData = [header, ...dataRows].join('\n');

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Nom de l'entreprise partenaire, préfixé par '- '." },
                activity: { type: Type.STRING, description: "Titre SEO décrivant le service, se terminant par ' à'." },
                city: { type: Type.STRING, description: "Localisation au format 'Ville (Code Postal) en/dans le Département'." },
                address: { type: Type.STRING, description: "Adresse postale complète du partenaire, extraite de la colonne 'address' du CSV." },
                extract: { type: Type.STRING, description: "Méta-description de 155 caractères maximum." },
                description: { type: Type.STRING, description: "Description structurée en HTML avec des balises <p> et <strong>." },
            },
            required: ["name", "activity", "city", "address", "extract", "description"]
        }
    };

    const clientInfoLines = [
      `- Nom : ${userBusinessInfo.name}`
    ];
    if (userBusinessInfo.url) {
        clientInfoLines.push(`- Site Web : ${userBusinessInfo.url}`);
    }
    if (userBusinessInfo.address) {
        clientInfoLines.push(`- Adresse Postale : ${userBusinessInfo.address}`);
    }
    clientInfoLines.push(`- Description de l'activité : ${userBusinessInfo.description}`);

    const prompt = `
    ROLE: Tu es un expert en SEO local.

    OBJECTIF: Utiliser la liste d'entreprises **pré-filtrée et validée** fournie pour créer un guide local. Pour chaque entreprise, tu dois rédiger un contenu pertinent en lien avec l'entreprise cliente décrite ci-dessous.

    ENTREPRISE CLIENTE:
    ${clientInfoLines.join('\n    ')}

    LISTE DES ENTREPRISES PARTENAIRES VALIDÉES (Format CSV):
    \`\`\`csv
    ${processedCsvData}
    \`\`\`

    INSTRUCTIONS DÉTAILLÉES:
    1.  **Contexte**: La liste CSV fournie a déjà été validée par un agent IA pour garantir la pertinence, la présence d'un site web et une adresse valide. Tu dois donc faire confiance à ces données.
    2.  **Règle Impérative - Traitement Exhaustif**: Le CSV fourni contient ${dataRows.length} entreprises (sans compter l'en-tête). Tu DOIS impérativement générer un objet JSON pour CHACUNE de ces ${dataRows.length} entreprises. Le tableau JSON final doit contenir exactement ${dataRows.length} objets. C'est une règle absolue, il ne doit y en avoir ni plus, ni moins. Ne saute AUCUNE entreprise.
    3.  **Rédaction du Contenu**: Pour chaque ligne du CSV, génère les valeurs pour les champs JSON demandés en suivant scrupuleusement les règles de contenu ci-dessous.

    RÈGLES DE CONTENU POUR CHAQUE CHAMP:
    - "name": Doit commencer par "- " (un tiret suivi d'un espace), suivi de la valeur de la colonne 'name' du CSV. Exemple: "- La Bonne Pâtisserie".
    - "activity": Un titre SEO décrivant le service, qui doit se terminer par la préposition " à" (avec un espace). N'inclus PAS la ville dans ce champ. Tu dois déduire l'activité à partir du nom et de la catégorie de l'entreprise si une colonne 'category' est fournie. Exemple: "Vente de gâteaux et chocolats artisanaux à".
    - "city": La localisation au format "Ville (Code Postal) en/dans le Département", basée sur la colonne 'address' du CSV. Tu dois extraire et formater cette information. Exemple 1: Marseille (13008) dans les Bouches-du-Rhône. Exemple 2: Paris (75017) en Île-de-France. Si l'adresse est invalide ou incomplète, laisse ce champ vide.
    - "address": L'adresse postale complète et exacte du partenaire, telle qu'extraite de la colonne 'address' du CSV. N'inclus PAS cette information dans le champ "description". Si l'adresse est invalide ou manquante, ce champ doit être une chaîne vide.
    - "extract": Une méta-description unique et accrocheuse de 155 caractères MAXIMUM. Elle doit être différente du début de la description.
    - "description": Un texte au format HTML contenu dans une seule chaîne de caractères. Utilise des balises <p> pour chaque paragraphe et <strong> pour le texte en gras. Le ton doit être à la troisième personne du pluriel. La structure DOIT être la suivante :
<p>Un paragraphe présentant le partenaire, ses services et son emplacement (ville/secteur). Le nom du partenaire doit être en gras (ex: <strong>La Bonne Pâtisserie</strong>).</p>
<p>Un paragraphe expliquant la complémentarité entre le partenaire et l'entreprise cliente. Le nom de l'entreprise cliente, <strong>${userBusinessInfo.name}</strong>, doit être mentionné et mis en gras.</p>
<p>La phrase exacte et inchangée : "Si vous êtes intéressés pour visiter la région, et cet établissement :"</p>
<p>Numéro de téléphone : <strong>[Numéro de téléphone du partenaire extrait du CSV, si disponible]</strong></p>
<p>Mail : <strong>[Email du partenaire extrait du CSV, si disponible]</strong></p>
N'INCLUS PAS L'ADRESSE ICI. Si une information (téléphone, mail) n'est pas disponible ou est invalide, omettez simplement la balise <p> correspondante.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const rawText = response.text;
        if (!rawText || rawText.trim() === '') {
            throw new Error("La réponse de l'IA était vide. Cela peut être dû à des filtres de sécurité. Essayez de reformuler votre demande.");
        }

        const jsonString = extractJson(rawText);

        if (!jsonString) {
             console.error("Impossible d'extraire le JSON de la réponse de l'IA:", rawText);
             const userMessage = `La réponse de l'IA n'a pas retourné le format JSON attendu. Elle a commencé par : "${rawText.substring(0, 150)}...". Veuillez réessayer, éventuellement avec un fichier CSV plus simple ou une description plus précise.`;
             throw new Error(userMessage);
        }

        try {
            const guideData: LocalGuide = JSON.parse(jsonString);
            const sanitizedGuideData = guideData.map(item => ({
                activity: item.activity || '',
                city: item.city || '',
                name: item.name || '',
                address: item.address || '',
                extract: item.extract || '',
                description: item.description || '',
            }));
            return sanitizedGuideData;
        } catch (jsonParseError) {
            console.error("Erreur lors de l'analyse du JSON extrait:", jsonString);
            console.error("Erreur d'origine:", jsonParseError);
            throw new Error("L'IA a retourné un format qui ressemble à du JSON mais qui contient une erreur de syntaxe. Veuillez réessayer.");
        }


    } catch (error) {
        console.error("Erreur de l'API Gemini ou de l'analyse:", error);
        if (error instanceof Error) {
            if (error.message.startsWith("La réponse de l'IA")) {
                throw error;
            }
             if (error.message.includes("sécurité")) {
                throw new Error("Votre demande a été bloquée par les filtres de sécurité de l'IA. Essayez de reformuler votre description d'activité.");
            }
        }
        throw new Error("La génération du guide a échoué. L'API a peut-être refusé la demande ou le format de la réponse était incorrect. Veuillez réessayer.");
    }
};