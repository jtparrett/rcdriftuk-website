export const extractFirstUrl = (content: string): string | null => {
  if (!content) return null;

  // Regex to match URLs in markdown content (both markdown links and plain URLs)
  const urlRegex = /(?:\[([^\]]+)\]\(([^)]+)\))|(?:https?:\/\/[^\s\]]+)/g;

  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    // match[2] is the URL from markdown link [text](url)
    // match[0] is the full match (for plain URLs)
    const url = match[2] || match[0];

    // Skip internal links (starting with /)
    if (url && !url.startsWith("/")) {
      return url;
    }
  }

  return null;
};
