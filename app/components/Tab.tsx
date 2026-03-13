import { Link } from "react-router";
import { styled } from "~/styled-system/jsx";
import { cva } from "~/styled-system/css";

const TabStyle = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: 1.5,
    px: 3,
    py: 2,
    flex: "none",
    rounded: "xl",
    fontWeight: "semibold",
    fontSize: "sm",
    transition: "all .18s",
    whiteSpace: "nowrap",
    cursor: "pointer",
    borderWidth: 1,
    borderColor: "transparent",
    _disabled: {
      opacity: 0.5,
    },
  },
  variants: {
    isActive: {
      true: {
        bgColor: "gray.800",
        borderColor: "gray.700",
      },
    },
  },
});

export const Tab = styled(Link, TabStyle);
export const TabButton = styled("button", TabStyle);

export const TabGroup = styled("div", {
  base: {
    display: "inline-flex",
    bgColor: "gray.900",
    rounded: "2xl",
    p: 1,
    borderWidth: 1,
    borderColor: "gray.800",
  },
});
