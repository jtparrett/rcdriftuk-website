import { styled } from "~/styled-system/jsx";

export const Spinner = styled("div", {
  base: {
    w: 5,
    h: 5,
    rounded: "full",
    borderWidth: 2,
    borderColor: "gray.800",
    borderTopColor: "brand.500",
    animation: "spin 1s linear infinite",
  },
});
