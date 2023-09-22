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
    rounded: "full",
    display: "inline-flex",
    gap: 3,
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
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export const Button = styled("button", ButtonStyles);

export const LinkButton = styled(Link, ButtonStyles);
