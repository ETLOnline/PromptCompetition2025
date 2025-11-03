import express from "express";
import multer from "multer";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import path from "path";

const router = express.Router();

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.CONTAINER_NAME || "clues";

if (!accountName) {
  console.warn("AZURE_STORAGE_ACCOUNT_NAME is not set. Uploads will fail without it.");
}

// Initialize BlobServiceClient with DefaultAzureCredential
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);

// const connectionString = "UseDevelopmentStorage=true";
// const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists on module load
(async () => {
  try {
    const res = await containerClient.createIfNotExists();
    if (res.succeeded) {
      console.log(`Azure container '${containerName}' created.`);
    } else {
      console.log(`Azure container '${containerName}' exists or was not created.`);
    }
  } catch (err) {
    console.error("Failed to ensure Azure container exists:", err);
  }
})();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Allowed types and limits
const IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const AUDIO_MIMES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
  "audio/m4a",
];

// Helper to validate file by type (no size restrictions)
function validateFile(file, type) {
  if (!file) return { ok: false, reason: "No file provided" };
  const mime = file.mimetype;

  if (type === "image") {
    if (!IMAGE_MIMES.includes(mime)) return { ok: false, reason: "Invalid image type" };
  } else if (type === "voice") {
    if (!AUDIO_MIMES.includes(mime)) return { ok: false, reason: "Invalid audio type" };
  } else {
    return { ok: false, reason: "Invalid type parameter" };
  }

  return { ok: true };
}

router.post("/", upload.single("file"), async (req: express.Request, res: express.Response) => {
  try {
    const file = req.file;
    const type = (req.body.type || "image").toLowerCase();

    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const validation = validateFile(file, type);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.reason });
    }

    const timestamp = Date.now();
    const safeName = path.basename(file.originalname).replace(/\s+/g, "-");
    const blobName = `${type}/${timestamp}-${safeName}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const url = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

    console.log(`Upload succeeded: ${blobName} (${file.size} bytes)`);

    return res.json({ success: true, url, blobName, size: file.size });
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).json({ success: false, error: (error && error.message) || "Upload failed" });
  }
});

export default router;
