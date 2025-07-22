import { Link } from "react-router";
import type { ReactNode } from "react";
import { styled } from "~/styled-system/jsx";
import { cva } from "~/styled-system/css";

const TabStyle = cva({
  base: {
    px: 3,
    py: 2,
    flex: "none",
    rounded: "lg",
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
