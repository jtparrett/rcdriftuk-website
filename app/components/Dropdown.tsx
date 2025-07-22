import { styled } from "~/styled-system/jsx";

export const Dropdown = styled("div", {
  base: {
    pos: "absolute",
    top: "full",
    left: 0,
    w: "full",
    zIndex: 1000,
    bgColor: "gray.800",
    borderRadius: "lg",
    borderWidth: 1,
    borderColor: "gray.700",
    mt: 1,
    overflow: "auto",
    maxH: "180px",
  },
});

export const Option = styled("button", {
  base: {
    px: 2,
    py: 1,
    w: "full",
    cursor: "pointer",
    fontSize: "md",
    fontWeight: "normal",
    textAlign: "left",
    color: "gray.200",
    _hover: {
      bgColor: "gray.700",
    },
  },
});
