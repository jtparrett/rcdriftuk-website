import { defineConfig } from "@pandacss/dev";

const brandColor = "#ec1a55";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  jsxFramework: "react",

  // The extension for the emitted JavaScript files
  outExtension: "js",

  // Where to look for your css declarations
  include: [
    "./app/routes/**/*.{ts,tsx,js,jsx}",
    "./app/components/**/*.{ts,tsx,js,jsx}",
  ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        radii: {
          "3xl": {
            value: "1.3rem",
          },
        },
        fonts: {
          body: {
            value: '"Inter", sans-serif',
          },
        },
        colors: {
          black: {
            value: "#0c0c0c",
          },
          "brand.500": {
            value: brandColor,
          },
          "brand.700": {
            value: "#a6143c",
          },
          "gray.50": {
            value: "#fafafa",
          },
          "gray.100": {
            value: "#f4f4f5",
          },
          "gray.200": {
            value: "#e4e4e7",
          },
          "gray.300": {
            value: "#d4d4d8",
          },
          "gray.400": {
            value: "#a1a1aa",
          },
          "gray.500": {
            value: "#71717a",
          },
          "gray.600": {
            value: "#52525b",
          },
          "gray.700": {
            value: "#3f3f46",
          },
          "gray.800": {
            value: "#27272a",
          },
          "gray.900": {
            value: "#18181b",
          },
          "gray.950": {
            value: "#09090b",
          },
          // Rank colors
          "blue.800": {
            value: "#1e40af",
          },
          "blue.900": {
            value: "#1e3a8a",
          },
          "yellow.800": {
            value: "#854d0e",
          },
          "yellow.900": {
            value: "#713f12",
          },
          "orange.800": {
            value: "#9a3412",
          },
          "orange.900": {
            value: "#7c2d12",
          },
          "whiteAlpha.100": {
            value: "rgba(255, 255, 255, 0.06)",
          },
          "whiteAlpha.200": {
            value: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
      keyframes: {
        spin: {
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        badge: {
          "100%": {
            transform: "rotateY(360deg)",
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "app/styled-system",

  globalCss: {
    html: {
      color: "white",
      backgroundColor: "black",
      fontFamily: "body",
      scrollBehavior: "smooth",
    },
  },
});
