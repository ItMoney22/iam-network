import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

// Minimax model ID on Replicate
// This might need adjustment based on the exact model version available
const MINIMAX_MODEL = "minimax/speech-01";

export class MinimaxTTSService {
    /**
     * Generates speech using Minimax via Replicate
     * Returns a buffer of the audio
     */
    async generateSpeech(text: string, voiceId: string): Promise<Buffer> {
        try {
            console.log(`Generating speech for voiceId: ${voiceId} with text: "${text.substring(0, 50)}..."`);

            // Note: The exact input parameters depend on the specific Replicate model version
            // We assume standard Minimax inputs here
            const output = await replicate.run(
                MINIMAX_MODEL,
                {
                    input: {
                        text: text,
                        speaker_id: voiceId, // e.g., "male-01", "female-01"
                        model_id: "speech-01-hd", // Requesting HD quality
                    }
                }
            );

            // Replicate usually returns a URL or a stream
            // If it returns a URL (common for audio models), we need to fetch it
            const result = output as any;

            if (typeof result === "string" && result.startsWith("http")) {
                const response = await fetch(result);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
            // If it returns a ReadableStream (less common for simple runs but possible)
            else if (result instanceof ReadableStream) {
                // Handle stream to buffer conversion if needed
                // For now, assume URL string as that's standard for Replicate audio outputs
                throw new Error("Unexpected output format from Replicate (Stream)");
            }

            return result as Buffer; // Fallback if it returns a buffer directly (unlikely)
        } catch (error) {
            console.error("Minimax TTS Error:", error);
            throw new Error("Failed to generate speech via Minimax");
        }
    }
}

export const ttsService = new MinimaxTTSService();
