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
          "brand.50": {
            value: "#fef5f8",
          },
          "brand.100": {
            value: "#fcd7e1",
          },
          "brand.200": {
            value: "#f9b2c6",
          },
          "brand.300": {
            value: "#f582a2",
          },
          "brand.400": {
            value: "#f2638b",
          },
          "brand.500": {
            value: brandColor,
          },
          "brand.600": {
            value: "#ce164a",
          },
          "brand.700": {
            value: "#a7123c",
          },
          "brand.800": {
            value: "#8e0f33",
          },
          "brand.900": {
            value: "#680c26",
          },
          "brand.950": {
            value: "#7a0f2c",
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
