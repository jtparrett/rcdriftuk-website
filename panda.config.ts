import { defineConfig } from "@pandacss/dev";
import { getTheme } from "~/utils/theme";

const theme = getTheme();

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
            value: '"SF Pro Display", sans-serif',
          },
        },
        colors: {
          white: {
            value: "#f7f5ed",
          },
          black: {
            value: "#0c0c0c",
          },
          // Brand colors generated from theme.brandColor using CSS color-mix()
          "brand.50": {
            value: `color-mix(in oklch, ${theme.brandColor} 10%, white)`,
          },
          "brand.100": {
            value: `color-mix(in oklch, ${theme.brandColor} 20%, white)`,
          },
          "brand.200": {
            value: `color-mix(in oklch, ${theme.brandColor} 35%, white)`,
          },
          "brand.300": {
            value: `color-mix(in oklch, ${theme.brandColor} 50%, white)`,
          },
          "brand.400": {
            value: `color-mix(in oklch, ${theme.brandColor} 75%, white)`,
          },
          "brand.500": {
            value: theme.brandColor,
          },
          "brand.600": {
            value: `color-mix(in oklch, ${theme.brandColor} 85%, black)`,
          },
          "brand.700": {
            value: `color-mix(in oklch, ${theme.brandColor} 70%, black)`,
          },
          "brand.800": {
            value: `color-mix(in oklch, ${theme.brandColor} 55%, black)`,
          },
          "brand.900": {
            value: `color-mix(in oklch, ${theme.brandColor} 40%, black)`,
          },
          "brand.950": {
            value: `color-mix(in oklch, ${theme.brandColor} 25%, black)`,
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
            value: "#9f9fa8",
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
          "bronze.500": {
            value: "#cd7f32",
          },
          "bronze.800": {
            value: "#8b4513",
          },
          "bronze.900": {
            value: "#63310d",
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
        bounce: {
          "50%": {
            transform: "translateY(-8px)",
          },
        },
        logo: {
          "100%": {
            strokeDashoffset: "-200px",
          },
        },
        flash: {
          "100%": {
            opacity: 0,
          },
        },
        progressBar: {
          "0%": {
            width: "0%",
          },
          "100%": {
            width: "100%",
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
      minH: "100dvh",
      overflowScrolling: "touch",
      WebkitFontSmoothing: "antialiased",
      fontSmoothing: "antialiased",
      textRendering: "optimizeLegibility",
    },
  },
});
