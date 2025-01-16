import { styled } from "~/styled-system/jsx";

export const ImageContainer = styled("div", {
  base: {
    width: "full",
    maxW: "800px",
    mx: "auto",
    my: 8,
    p: 2,
    borderWidth: "1px",
    borderColor: "gray.800",
    rounded: "xl",
    bgColor: "gray.950",
    shadow: "0 0 0 6px rgba(255, 255, 255, 0.04)",
    overflow: "hidden",
    "& img": {
      rounded: "lg",
    },
  },
});
