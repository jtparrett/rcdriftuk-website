import { Link } from "react-router";
import { styled } from "~/styled-system/jsx";
import { cva } from "~/styled-system/css";

const TabStyle = cva({
  base: {
    px: 3,
    py: 2,
    flex: "none",
    rounded: "xl",
    fontWeight: "semibold",
    fontSize: "sm",
    transition: "background-color .3s",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  variants: {
    isActive: {
      true: {
        bgColor: "gray.800",
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
