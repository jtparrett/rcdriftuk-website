import { Link } from "react-router";
import { cva } from "~/styled-system/css/cva";
import { styled } from "~/styled-system/jsx";

const ButtonStyles = cva({
  base: {
    py: 2,
    px: 4,
    rounded: "xl",
    display: "inline-flex",
    gap: 1.5,
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "semibold",
    transition: "all .18s",
    cursor: "pointer",
    fontSize: "sm",
    color: "white !important",
    borderWidth: 1,
    position: "relative",
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    whiteSpace: "nowrap",
    "& svg": {
      fontSize: "16px",
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
        bgColor: "brand.600",
        borderColor: "brand.500",
        _hover: {
          md: {
            bgColor: "brand.500",
          },
        },
      },
      secondary: {
        color: "gray.200",
        bgColor: "gray.900",
        borderColor: "gray.800",
        _hover: {
          md: {
            bgColor: "gray.800",
            color: "white",
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
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export const Button = styled("button", ButtonStyles);

export const LinkButton = styled(Link, ButtonStyles);
