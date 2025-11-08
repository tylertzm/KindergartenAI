if (!process.env.RUNWARE_API_KEY) {
    throw new Error("RUNWARE_API_KEY environment variable not set");
}

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;
const RUNWARE_API_URL = 'https://api.runware.ai/v1';

interface RunwareTask {
    taskType: string;
    taskUUID: string;
    [key: string]: any;
}

interface RunwareResponse {
    data?: Array<{
        imageURL?: string;
        imageBase64?: string;
        base64Data?: string;
        dataURI?: string;
        taskUUID?: string;
        guideImageBase64Data?: string; // For controlnet preprocessing
        imageBase64Data?: string; // For image inference
    }>;
    error?: string;
    errors?: Array<{
        code?: string;
        message?: string;
        parameter?: string;
    }>;
}

/**
 * Generate a UUIDv4 string
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Preprocess an image using OpenPose to extract pose information
 */
export const preprocessWithOpenPose = async (imageBase64: string): Promise<string> => {
    // Ensure the image has the proper data URL prefix
    const imageDataUrl = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

    const task = [
        {
            taskType: "imageControlNetPreProcess",
            taskUUID: generateUUID(),
            inputImage: imageDataUrl,
            preProcessorType: "openpose",
            height: 1024,
            width: 768,
            outputType: "base64Data", // Must be string: 'base64Data', 'dataURI', or 'URL'
            outputFormat: "WEBP",
            includeCost: true,
            includeHandsAndFaceOpenPose: true
        }
    ];

    console.log("Sending OpenPose request to Runware API...");
    console.log("Request payload:", JSON.stringify({
        taskType: task[0].taskType,
        preProcessorType: task[0].preProcessorType,
        imageSize: `${task[0].width}x${task[0].height}`,
        imageLength: imageDataUrl.length
    }));

    try {
        const response = await fetch(RUNWARE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RUNWARE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });

        // Get the response text to see the actual error
        const responseText = await response.text();
        
        console.log("Runware API response status:", response.status);
        console.log("Runware API response:", responseText.substring(0, 500)); // Log first 500 chars
        
        if (!response.ok) {
            console.error("Full Runware API error response:", responseText);
            throw new Error(`Runware API error: ${response.status} - ${responseText}`);
        }

        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse response:", responseText);
            throw new Error(`Invalid JSON response from Runware API: ${responseText}`);
        }
        
        console.log("Parsed result:", result);
        
        // Handle array response
        if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];
            // Check for various possible field names
            if (firstResult.guideImageBase64Data) {
                return firstResult.guideImageBase64Data;
            }
            if (firstResult.imageBase64Data) {
                return firstResult.imageBase64Data;
            }
            if (firstResult.base64Data) {
                return firstResult.base64Data;
            }
            if (firstResult.imageBase64) {
                return firstResult.imageBase64;
            }
            if (firstResult.error) {
                throw new Error(`Runware API error: ${firstResult.error}`);
            }
        }
        
        // Handle object response with data array
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const data = result.data[0];
            if (data.guideImageBase64Data) {
                return data.guideImageBase64Data;
            }
            if (data.imageBase64Data) {
                return data.imageBase64Data;
            }
            if (data.base64Data) {
                return data.base64Data;
            }
            if (data.imageBase64) {
                return data.imageBase64;
            }
        }
        
        console.error("Unexpected response format:", result);
        throw new Error(`Unexpected response format from Runware API: ${JSON.stringify(result).substring(0, 500)}`);
        
    } catch (error: any) {
        console.error("Error in preprocessWithOpenPose:", error);
        throw error;
    }
};

/**
 * Generate story beat image using Runware model (runware:108@22)
 * Uses OpenPose image as input and character image as reference
 */
export const generateImageWithQwenEditPlus = async (
    prompt: string,
    openPoseImageBase64: string,
    characterImageBase64: string
): Promise<string> => {
    // Ensure images have proper data URL prefix
    const openPoseDataUrl = openPoseImageBase64.startsWith('data:') 
        ? openPoseImageBase64 
        : `data:image/webp;base64,${openPoseImageBase64}`;
    
    const characterDataUrl = characterImageBase64.startsWith('data:') 
        ? characterImageBase64 
        : `data:image/jpeg;base64,${characterImageBase64}`;

    const task = [
        {
            taskType: "imageInference",
            taskUUID: generateUUID(),
            model: "runware:108@22",
            positivePrompt: prompt,
            numberResults: 1,
            height: 1024,
            width: 768,
            outputType: "base64Data",
            outputFormat: "JPEG",
            includeCost: true,
            checkNSFW: true,
            CFGScale: 4,
            scheduler: "Default",
            acceleration: "medium",
            // Use OpenPose and character images as references (must be an array)
            referenceImages: [openPoseDataUrl, characterDataUrl]
        }
    ];

    console.log("Sending image generation request to Runware API...");
    console.log("Request details:", {
        model: task[0].model,
        taskType: task[0].taskType,
        promptLength: prompt.length,
        hasOpenPose: !!openPoseDataUrl,
        hasCharacter: !!characterDataUrl
    });

    try {
        const response = await fetch(RUNWARE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RUNWARE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task),
        });

        const responseText = await response.text();
        
        console.log("Runware image generation response status:", response.status);
        console.log("Runware image generation response:", responseText.substring(0, 500));
        
        if (!response.ok) {
            console.error("Full Runware API error response:", responseText);
            throw new Error(`Runware API error: ${response.status} - ${responseText}`);
        }

        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse response:", responseText);
            throw new Error(`Invalid JSON response from Runware API: ${responseText}`);
        }
        
        console.log("Parsed image generation result:", result);
        
        // Handle array response
        if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];
            // Check for various possible field names
            if (firstResult.imageBase64Data) {
                return firstResult.imageBase64Data;
            }
            if (firstResult.guideImageBase64Data) {
                return firstResult.guideImageBase64Data;
            }
            if (firstResult.base64Data) {
                return firstResult.base64Data;
            }
            if (firstResult.imageBase64) {
                return firstResult.imageBase64;
            }
            if (firstResult.error) {
                throw new Error(`Runware API error: ${firstResult.error}`);
            }
        }
        
        // Handle object response with data array
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const data = result.data[0];
            if (data.imageBase64Data) {
                return data.imageBase64Data;
            }
            if (data.guideImageBase64Data) {
                return data.guideImageBase64Data;
            }
            if (data.base64Data) {
                return data.base64Data;
            }
            if (data.imageBase64) {
                return data.imageBase64;
            }
        }
        
        console.error("Unexpected response format:", result);
        throw new Error(`Unexpected response format from Runware API: ${JSON.stringify(result).substring(0, 500)}`);
        
    } catch (error: any) {
        console.error("Error in image generation:", error);
        throw error;
    }
};

export interface DebugImageData {
    openPoseImage: string;
    finalImage: string;
}

/**
 * Combined workflow: preprocess with OpenPose, then generate with Qwen edit plus
 */
export const generateStoryBeatImage = async (
    prompt: string,
    userImageBase64: string,
    characterImageBase64: string,
    debugMode: boolean = false
): Promise<string | DebugImageData> => {
    // Step 1: Preprocess the user image with OpenPose
    console.log("Preprocessing image with OpenPose...");
    const openPoseImage = await preprocessWithOpenPose(userImageBase64);
    
    // Step 2: Generate the final image using Runware
    console.log("Generating final image with Runware...");
    const finalImage = await generateImageWithQwenEditPlus(
        prompt,
        openPoseImage,
        characterImageBase64
    );
    
    // Return debug data if in debug mode
    if (debugMode) {
        return {
            openPoseImage,
            finalImage
        };
    }
    
    return finalImage;
};

