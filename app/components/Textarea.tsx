import { styled } from "~/styled-system/jsx";

export const Textarea = styled("textarea", {
  base: {
    py: 2,
    px: 4,
    borderWidth: 1,
    borderColor: "gray.800",
    bgColor: "gray.800",
    rounded: "lg",
    color: "white",
    w: "full",
    minH: "100px",
    resize: "vertical",
    outline: "none",
    maxH: "240px",
  },
});
