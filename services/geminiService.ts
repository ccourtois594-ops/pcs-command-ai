import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SensitiveSite, Intervener } from '../types';

// Récupération centralisée de la clé injectée par Vite
const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
    console.warn("⚠️ Gemini API Key manquante ! Vérifiez votre fichier .env ou la configuration Vite.");
}

// Initialize client
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper pour gérer le timeout des requêtes IA
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Délai d'attente dépassé (${ms/1000}s). Le modèle met trop de temps à répondre.`)), ms)
        )
    ]);
};

export const analyzeRisk = async (site: SensitiveSite): Promise<string> => {
  if (!API_KEY) return "Clé API manquante. Impossible d'analyser.";

  try {
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyse les risques pour le site suivant :
      Nom: ${site.name}
      Type: ${site.hazards?.join(', ') || 'Non spécifié'}
      Population: ${site.population} personnes`,
      config: {
        systemInstruction: `Tu es un expert en gestion de crise et sécurité civile.
        Donne une réponse concise en 3 points :
        1. Scénario de crise potentiel majeur.
        2. Mesures préventives prioritaires.
        3. Ressources nécessaires en cas d'urgence.
        Formatte la réponse en Markdown simple.`
      }
    }), 30000);

    return response.text || "Aucune analyse générée.";
  } catch (error: any) {
    console.error("Gemini Risk Analysis Error:", error);
    return `Erreur d'analyse : ${error.message}`;
  }
};

export const generateCrisisPlan = async (scenario: string, availableInterveners: Intervener[]): Promise<string> => {
    if (!API_KEY) return "Clé API manquante.";

    const intervenersList = availableInterveners
        .filter(i => i.available)
        .map(i => `- ${i.name} (${i.role} - ${i.organization})`)
        .join('\n');

    try {
        const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `SCENARIO: ${scenario}
            
            RESSOURCES HUMAINES DISPONIBLES:
            ${intervenersList}`,
            config: {
                systemInstruction: `CONTEXTE: Gestion de crise communale.
                TÂCHE: Génère un plan d'action immédiat (Checklist opérationnelle) pour la première heure de crise.
                Assigne des tâches spécifiques aux rôles disponibles.`
            }
        }), 60000);

        return response.text || "Plan non généré.";
    } catch (error: any) {
        console.error("Gemini Plan Error:", error);
        return `Erreur de génération : ${error.message}`;
    }
};

export const generateImmediateActionSheet = async (
    crisisType: string, 
    address: string, 
    radius: number, 
    impactedSites: SensitiveSite[]
): Promise<string> => {
    if (!API_KEY) throw new Error("Service IA indisponible (Clé API manquante).");

    // SECURISATION: Valeurs par défaut pour éviter les crashs sur manipulation de string (toUpperCase)
    const safeType = crisisType || "INCIDENT INDÉTERMINÉ";
    const safeAddress = address || "Lieu non précisé";
    const safeRadius = radius || 500;

    const sitesDescription = impactedSites && impactedSites.length > 0 
        ? impactedSites.map(s => `- ${s.name} (${s.riskLevel}, ${s.population} pers., Risques: ${s.hazards?.join(', ') || 'N/A'})`).join('\n')
        : "Aucun site sensible majeur recensé dans la zone immédiate.";

    try {
        console.log(`Début génération fiche réflexe Gemini pour : ${safeType}`);
        
        const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `URGENCE: ${safeType}
            LIEU: ${safeAddress} (Rayon impact: ${safeRadius}m)
            
            SITES SENSIBLES IMPACTÉS DANS LA ZONE:
            ${sitesDescription}`,
            config: {
                systemInstruction: `RÔLE: Tu es le Directeur des Opérations de Secours (DOS) virtuel.
                OBJECTIF: Génère une FICHE RÉFLEXE OPÉRATIONNELLE immédiate.
                
                FORMAT ATTENDU (Structure stricte, Markdown):
                
                # FICHE RÉFLEXE: ${safeType.toUpperCase()}
                **Date:** ${new Date().toLocaleDateString()} | **Zone:** ${safeRadius}m
                
                ## 1. ACTIONS IMMÉDIATES (T0 à T+30min)
                * [ ] Action 1
                * [ ] Action 2...

                ## 2. ANALYSE DES CONSÉQUENCES SPÉCIFIQUES
                (Analyse l'impact sur les sites listés et propose des mesures d'atténuation)

                ## 3. MOYENS LOGISTIQUES À ENGAGER
                (Matériel et Salles recommandés)

                ## 4. MESSAGE D'ALERTE POPULATION (Modèle)
                (Court message pour SMS/Réseaux sociaux)`,
                temperature: 0.4,
            }
        }), 60000); 

        if (!response.text) {
            throw new Error("Réponse vide de l'IA (Filtre de sécurité probable).");
        }

        return response.text;
    } catch (error: any) {
        console.error("Gemini Action Sheet Error:", error);
        throw new Error(error.message || "Erreur inconnue lors de la génération.");
    }
};