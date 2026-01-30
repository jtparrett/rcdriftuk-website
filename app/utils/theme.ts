const themes = {
  rcdio: {
    key: "rcdio",
    name: "RCDrift.io",
    logoUrl: "/rcdriftio.svg",
    footerLogoUrl: "/rcdriftio-light.svg",
    ogImageUrl: "https://rcdrift.io/og-image.jpg",
    brandColor: "#F20C4E",
    showMenu: true,
  },
  sdc: {
    key: "sdc",
    name: "SDC 2026",
    logoUrl:
      "https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png",
    footerLogoUrl:
      "https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png",
    ogImageUrl: "https://rcdrift.io/og-image.jpg",
    brandColor: "#ea2125",
    showMenu: false,
  },
} as const;

export const getTheme = () => {
  // Server-side (Node.js) - check process exists before accessing
  if (typeof process !== "undefined" && process.env?.VITE_THEME) {
    return (
      themes[process.env.VITE_THEME as keyof typeof themes] ?? themes.rcdio
    );
  }

  // Client-side - Vite statically replaces import.meta.env at build time
  const themeKey = import.meta.env?.VITE_THEME as
    | keyof typeof themes
    | undefined;
  return themes[themeKey ?? "rcdio"] ?? themes.rcdio;
};

export const useTheme = () => {
  return getTheme();
};
