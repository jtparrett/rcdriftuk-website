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
      md: 5,
    },
    rounded: "lg",
    display: "inline-flex",
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "semibold",
    borderWidth: 2,
    transition: "all .2s",
    color: "inherit",
    cursor: "pointer",
    fontSize: "sm",
    _hover: {
      backgroundColor: "transparent",
    },
  },
  variants: {
    variant: {
      primary: {
        bg: "blue.400",
        borderColor: "blue.400",
      },
      secondary: {
        bg: "gray.700",
        borderColor: "gray.700",
      },
      ghost: {
        bg: "transparent",
        borderColor: "transparent",
        _hover: {
          bgColor: "gray.900",
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
