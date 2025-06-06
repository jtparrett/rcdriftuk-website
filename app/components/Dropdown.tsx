import { styled } from "~/styled-system/jsx";
import { Button } from "./Button";

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

export const Option = styled(Button, {
  base: {
    px: 2,
    py: 1,
    bgColor: "transparent",
    borderWidth: 0,
    w: "full",
    justifyContent: "flex-start",
    rounded: "none",
    textAlign: "left",
  },
});
