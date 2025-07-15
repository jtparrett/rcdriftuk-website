export const fetchOgImage = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "rcdrift-app",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Find meta tag with property="og:image"
    const metaTagMatch = html.match(
      /<meta[^>]*property\s*=\s*["\']og:image["\'][^>]*>/i,
    );

    if (metaTagMatch) {
      // Extract content attribute from the matched meta tag
      const contentMatch = metaTagMatch[0].match(
        /content\s*=\s*["\']([^"\']*)["\']/i,
      );

      if (contentMatch && contentMatch[1]) {
        const ogImageUrl = contentMatch[1];

        // Handle relative URLs
        if (ogImageUrl.startsWith("/")) {
          const baseUrl = new URL(url);
          return `${baseUrl.protocol}//${baseUrl.host}${ogImageUrl}`;
        }

        // Handle protocol-relative URLs
        if (ogImageUrl.startsWith("//")) {
          const baseUrl = new URL(url);
          return `${baseUrl.protocol}${ogImageUrl}`;
        }

        return ogImageUrl;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching og:image:", error);
    return null;
  }
};
