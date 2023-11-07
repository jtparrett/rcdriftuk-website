import { Link } from "@remix-run/react";
import { cva } from "~/styled-system/css/cva";
import { styled } from "~/styled-system/jsx";

const ButtonStyles = cva({
  base: {
    py: {
      base: 2,
      md: 2,
    },
    px: {
      base: 3,
      md: 4,
    },
    rounded: "lg",
    display: "inline-flex",
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "semibold",
    borderWidth: 2,
    transition: "all .2s",
    cursor: "pointer",
    fontSize: "sm",
    color: "white !important",
  },
  variants: {
    variant: {
      primary: {
        bg: "brand-500",
        borderColor: "brand-500",
        _hover: {
          backgroundColor: "brand-700",
          borderColor: "brand-700",
        },
      },
      outline: {
        bg: "transparent",
        borderColor: "brand-500",
        borderWidth: 2,
        _hover: {
          backgroundColor: "brand-700",
          borderColor: "brand-700",
        },
      },
      ghost: {
        bg: "transparent",
        borderColor: "transparent",
        _hover: {
          bgColor: "gray.800",
          borderColor: "gray.800",
        },
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export const Button = styled("button", ButtonStyles);

export const LinkButton = styled(Link, ButtonStyles);
