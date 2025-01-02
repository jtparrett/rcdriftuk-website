import { styled } from "~/styled-system/jsx";

export const Select = styled("select", {
  base: {
    py: 2,
    px: 4,
    bgColor: "gray.800",
    rounded: "md",
    color: "white",
    w: "full",
    minH: "40px",
    outline: "none",
    appearance: "none",
    backgroundImage: "url('/arrow.svg')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
  },
});
