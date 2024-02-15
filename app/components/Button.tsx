import { Link } from "@remix-run/react";
import { cva } from "~/styled-system/css/cva";
import { styled } from "~/styled-system/jsx";

const ButtonStyles = cva({
  base: {
    py: {
      base: 2,
      md: 2,
    },
    px: 4,
    rounded: "lg",
    display: "inline-flex",
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "semibold",
    transition: "all .2s",
    cursor: "pointer",
    fontSize: "sm",
    color: "white !important",
  },
  variants: {
    size: {
      md: {},
      sm: {
        py: 2,
        px: 3,
      },
    },
    variant: {
      primary: {
        bg: "brand.500",
        _hover: {
          backgroundColor: "brand.700",
        },
      },
      secondary: {
        bg: "gray.800",
        _hover: {
          backgroundColor: "gray.700",
        },
      },
      ghost: {
        bg: "transparent",
        _hover: {
          bgColor: "gray.800",
        },
      },
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export const Button = styled("button", ButtonStyles);

export const LinkButton = styled(Link, ButtonStyles);
