import { put } from "@vercel/blob";
import { fetchOgImage } from "./fetchOgImage.server";

export async function fetchAndUploadOgImage(
  url: string,
): Promise<string | null> {
  try {
    // Fetch the og:image URL
    const ogImageUrl = await fetchOgImage(url);

    if (!ogImageUrl) {
      return null;
    }

    // Fetch the actual image
    const imageResponse = await fetch(ogImageUrl, {
      headers: {
        "User-Agent": "rcdrift-app",
      },
    });

    if (!imageResponse.ok) {
      return null;
    }

    // Get the image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Extract filename from URL or use a default
    const urlPath = new URL(ogImageUrl).pathname;
    const filename = urlPath.split("/").pop() || "og-image";

    // Upload to Vercel blob storage
    const { url: uploadedUrl } = await put(filename, imageBuffer, {
      access: "public",
      addRandomSuffix: true,
    });

    return uploadedUrl;
  } catch (error) {
    console.error("Error fetching and uploading og:image:", error);
    return null;
  }
}
