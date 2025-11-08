import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryStructure } from "../types";
import { generateStoryBeatImage } from "./runwareService";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Prompt Templates from scene_extraction.py ---
const getSceneExtractionPrompt = (numScenes: number) => `
You are an expert in visual storytelling and children's media. Please read the fairy tale below and extract ${numScenes} key scenes that are ideal for illustration, animation, or video adaptation.

Each scene should reflect:
- A major turning point in the plot or transformation in the character's journey
- Strong emotional tone (joy, surprise, foolishness, misfortune, freedom)
- A visualizable situation with physical comedy, magical realism, or exaggerated contrast
- Use of concrete setting, props, or dialogue that would translate well to illustration
- A moral or thematic significance (e.g. simplicity vs. greed, letting go, perspective)

Return each scene as JSON with the following fields:
- scene_id
- original_text: excerpt of the scene
- who: main character(s) involved
- where: setting of the scene
- emotion: dominant tone or moral idea
- quotes: key dialogue or narration from the scene
- visual_cues: visual elements like characters, props, animals, gestures


Language: English
Genre: Children's fairytale with moral twist
Tone: Lighthearted, ironic, simple
Focus on making each scene useful for visual adaptation.

Fairy tale content:
`;

const ILLUSTRATION_PROMPT_TEMPLATE = `
Create a colorful storybook illustration for the following scene:
Scene discription: {original_text}
Main Characters: {who}
Location: {where}
Mood: {emotion}
Visual Details: {visual_cues}

requirements:
Style: hand-drawn watercolor, children's storybook, high contrast, simple shapes, soft lighting
Framing: wide shot capturing full characters and environment,16:9 aspect ratio
Audience: children aged 4-8
Do not include text in the image. Emphasize emotion and character interaction.
`;

// --- Scene Extraction Types ---
export interface ExtractedScene {
    scene_id: number;
    original_text: string;
    who: string;
    where: string;
    emotion: string;
    quotes: string;
    visual_cues: string;
    drama_score: number;
    emotion_score: number;
    visual_score: number;
    compressibility: number;
    score?: number;
}

export const generateCharacterImage = async (description: string, userImageBase64: string): Promise<string> => {
    const prompt = `**Crucially, you must edit the input image of a person.** Transform the person into a new character based on this description: '${description}'. You MUST retain the person's exact facial expression and body pose from the input image. Place the final character on a neutral grey background. The final image must be a cinematic, high-detail, 16:9 aspect ratio shot that clearly defines the character's appearance.`;

    const userImagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: userImageBase64,
        },
    };

    const textPart = {
        text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [userImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    // FIX: Iterate through parts to find the image data, which is safer than assuming the first part is the image.
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error("No character image was generated.");
}

// --- Scene Extraction Function ---
export const extractTaleKeyScenes = async (chapterText: string, numScenes: number = 10): Promise<ExtractedScene[]> => {
    const sceneExtractionPrompt = getSceneExtractionPrompt(numScenes);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: sceneExtractionPrompt + "\ntale content below:\n" + chapterText,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        scene_id: { type: Type.NUMBER },
                        original_text: { type: Type.STRING },
                        who: { type: Type.STRING },
                        where: { type: Type.STRING },
                        emotion: { type: Type.STRING },
                        quotes: { type: Type.STRING },
                        visual_cues: { type: Type.STRING },
                        drama_score: { type: Type.NUMBER },
                        emotion_score: { type: Type.NUMBER },
                        visual_score: { type: Type.NUMBER },
                        compressibility: { type: Type.NUMBER }
                    },
                    required: ["scene_id", "original_text", "who", "where", "emotion", "quotes", "visual_cues", "drama_score", "emotion_score", "visual_score", "compressibility"]
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const scenes = JSON.parse(jsonText);
        
        // Debug logging
        console.log('=== SCENE EXTRACTION DEBUG ===');
        console.log('Number of scenes extracted:', scenes.length);
        console.log('Extracted scenes:', JSON.stringify(scenes, null, 2));
        
        return Array.isArray(scenes) ? scenes : [];
    } catch (e) {
        console.error("Failed to parse extracted scenes JSON:", response.text);
        return [];
    }
};

// // --- Scoring Function ---
// const computeCompositeScore = (scene: ExtractedScene): number => {
//     /**
//      * Calculate a composite score for a fairytale scene.
//      * Emphasizes visual richness and plot turning value.
//      */
//     // Normalize scores
//     const visual = scene.visual_score || 0;
//     const drama = scene.drama_score || 0;
//     const emotion = scene.emotion_score || 0;
//     const compress = scene.compressibility || 0;

//     // Composite formula with weights
//     const score = (
//         0.35 * visual +       // visual richness is most important
//         0.30 * drama +        // key transformation / twist
//         0.15 * emotion +      // emotional tone (simple)
//         0.20 * compress       // short-form friendliness
//     );
//     return Math.round(score * 100) / 100;
// };


export const generateStyleParagraph = async (theme: string): Promise<string> => {
    const prompt = `You are an art director for a Pixar-style animated film about '${theme}'. Create a VERY SHORT style guide (2-3 sentences max) that describes the visual style.
    
    Focus on Pixar-style elements:
    - Color palette (vibrant, warm, saturated, or muted tones)
    - Lighting mood (soft, dramatic, playful, warm glow)
    - Visual texture (smooth, painterly, stylized)
    - Overall atmosphere (whimsical, adventurous, cozy, magical)
    
    The result should evoke Pixar's signature emotional and visually appealing animation style.
    
    Example: "Warm, saturated color palette with golden lighting and soft shadows. Painterly textures with slightly exaggerated proportions. Cozy, whimsical atmosphere with attention to emotional details."`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};

export const generateStyleImage = async (theme: string): Promise<string> => {
    const prompt = `Create a Pixar-style concept art piece that defines the visual style for a story about '${theme}'. The image should establish the color palette, lighting, texture, and overall mood in Pixar's signature style - vibrant, warm, emotionally appealing, with soft lighting and painterly textures. Do not include any characters or text. High detail, 16:9 aspect ratio.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    // FIX: Iterate through parts to find the image data, which is safer than assuming the first part is the image.
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error("No style image was generated.");
};

export const generateStoryStructure = async (theme: string, numBeats: number, characterDescription: string): Promise<StoryStructure[]> => {
    // Combined prompt that extracts scenes AND generates story structure in one call
    const combinedPrompt = `
You are an expert in visual storytelling and children's media. Please read the fairy tale below and extract ${numBeats} key scenes that are ideal for illustration, animation, or video adaptation.

Each scene should reflect:
- A major turning point in the plot or transformation in the character's journey
- Strong emotional tone (joy, surprise, foolishness, misfortune, freedom)
- A visualizable situation with physical comedy, magical realism, or exaggerated contrast
- Use of concrete setting, props, or dialogue that would translate well to illustration
- A moral or thematic significance (e.g. simplicity vs. greed, letting go, perspective)

For each scene, provide:
1. actingDirection: A short direction for an actor to perform (use key dialogue or narration from the scene plus a descriptio on what pose to strike)
2. imagePrompt: Generate a short prompt for AI image generation. Do not describe the character as we are using an input image for that.
   

3. storyText: The original text excerpt from the scene to be read aloud as narrative

Language: English
Genre: Children's fairytale with moral twist
Tone: Lighthearted, ironic, simple
Focus on making each scene useful for visual adaptation and acting performance.

Fairy tale content:
${theme}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: combinedPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        actingDirection: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                        storyText: { type: Type.STRING }
                    },
                    required: ["actingDirection", "imagePrompt", "storyText"]
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const structures = JSON.parse(jsonText);
        
        // Debug logging
        console.log('=== COMBINED STORY STRUCTURE DEBUG ===');
        console.log('Number of structures:', structures.length);
        console.log('Story structures:', JSON.stringify(structures, null, 2));
        
        if (Array.isArray(structures)) {
            return structures;
        }
        throw new Error("Invalid format for story structure.");
    } catch (e) {
        console.error("Failed to parse story structure JSON:", response.text);
        throw new Error("Could not understand the AI's response for story structure.");
    }
};

export const generateImageForBeat = async (
    imagePrompt: string, 
    userImageBase64: string, 
    styleImageBase64: string, 
    characterImageBase64: string,
    debugMode: boolean = false,
    styleParagraph?: string
): Promise<any> => {
    // Append style paragraph to the image prompt if provided
    const fullPrompt = styleParagraph 
        ? `${imagePrompt}\n\n${styleParagraph}`
        : imagePrompt;
    
    // Use Runware workflow: OpenPose preprocessing + Qwen edit plus model
    // The styleImageBase64 is not used in the new workflow, but kept for API compatibility
    return await generateStoryBeatImage(fullPrompt, userImageBase64, characterImageBase64, debugMode);
};


export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read the following story with a clear, narrative voice: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // A nice narrative voice
                },
            },
        },
    });

    // FIX: Iterate through parts to find the audio data, which is safer than assuming the first part is the audio.
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
            return part.inlineData.data;
        }
    }

    throw new Error("Failed to generate speech from text.");
};
