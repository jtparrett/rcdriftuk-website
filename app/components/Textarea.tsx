import { styled } from "~/styled-system/jsx";

export const Textarea = styled("textarea", {
  base: {
    p: 2,
    bgColor: "gray.800",
    rounded: "md",
    color: "white",
    w: "full",
    minH: "100px",
    resize: "vertical",
  },
});
