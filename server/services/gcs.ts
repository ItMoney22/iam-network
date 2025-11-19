import { Storage } from "@google-cloud/storage";
import path from "path";

// Initialize GCS client
// We expect GCS_SERVICE_ACCOUNT_JSON to be set in the environment
// or GOOGLE_APPLICATION_CREDENTIALS to point to the file
const storage = new Storage();

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "iam-network-audio";

export class GCSStorageService {
    private bucketName: string;

    constructor(bucketName: string = BUCKET_NAME) {
        this.bucketName = bucketName;
    }

    /**
     * Uploads an audio buffer to GCS and returns the public URL
     */
    async uploadAudio(buffer: Buffer, filename: string): Promise<string> {
        try {
            const bucket = storage.bucket(this.bucketName);
            const file = bucket.file(`audio/${filename}`);

            await file.save(buffer, {
                contentType: "audio/mp3", // Assuming MP3 for now
                resumable: false,
            });

            // Make the file public (if bucket is not uniform bucket-level access)
            // Or just return the public URL format
            // Note: For production, you might want signed URLs or a public bucket
            // For now, we assume the bucket is public or we can make the file public
            try {
                await file.makePublic();
            } catch (e) {
                console.warn("Could not make file public (bucket might be uniform access):", e);
            }

            return `https://storage.googleapis.com/${this.bucketName}/audio/${filename}`;
        } catch (error) {
            console.error("GCS Upload Error:", error);
            throw new Error("Failed to upload audio to GCS");
        }
    }
}

export const gcsService = new GCSStorageService();
