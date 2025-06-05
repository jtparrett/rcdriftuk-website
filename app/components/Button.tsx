import { Link } from "react-router";
import { cva } from "~/styled-system/css/cva";
import { styled } from "~/styled-system/jsx";

const ButtonStyles = cva({
  base: {
    py: 2,
    px: 4,
    rounded: "full",
    display: "inline-flex",
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "semibold",
    transition: "all .2s",
    cursor: "pointer",
    fontSize: "sm",
    color: "white !important",
    borderWidth: 1,
    position: "relative",
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      md: {},
      sm: {
        px: 3,
      },
      xs: {
        gap: 1,
        py: 1,
        px: 3,
      },
    },
    isLoading: {
      true: {
        color: "transparent",
        _after: {
          content: '""',
          position: "absolute",
          w: 6,
          h: 6,
          rounded: "full",
          animation: "spin .8s linear infinite",
          borderWidth: 2,
          borderColor: "transparent",
          borderTopColor: "white",
        },
      },
    },
    variant: {
      primary: {
        bg: "brand.500",
        borderColor: "brand.500",
        _hover: {
          md: {
            backgroundColor: "brand.700",
            borderColor: "brand.700",
          },
        },
      },
      secondary: {
        bg: "gray.800",
        borderColor: "gray.800",
        _hover: {
          md: {
            backgroundColor: "gray.700",
            borderColor: "gray.700",
          },
        },
      },
      ghost: {
        bg: "transparent",
        borderColor: "transparent",
        _hover: {
          md: {
            bgColor: "gray.800",
            borderColor: "gray.800",
          },
        },
      },
      outline: {
        bg: "transparent",
        borderWidth: 1,
        borderColor: "gray.800",
        _hover: {
          md: {
            bgColor: "gray.800",
          },
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
