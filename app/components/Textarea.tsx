import { styled } from "~/styled-system/jsx";
import TextareaAutosize from "react-textarea-autosize";

export const Textarea = styled(TextareaAutosize, {
  base: {
    py: 2,
    px: 4,
    borderWidth: 1,
    borderColor: "gray.800",
    bgColor: "gray.800",
    rounded: "lg",
    color: "white",
    w: "full",
    outline: "none",
    display: "block",
    resize: "none",
    maxHeight: 280,
  },
});
