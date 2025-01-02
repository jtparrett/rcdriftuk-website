import { styled } from "~/styled-system/jsx";

export const Textarea = styled("textarea", {
  base: {
    py: 2,
    px: 4,
    bgColor: "gray.800",
    rounded: "md",
    color: "white",
    w: "full",
    minH: "100px",
    resize: "vertical",
  },
});
