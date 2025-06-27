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
    shadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
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
        bgGradient: "to-b",
        gradientFrom: "brand.500",
        gradientTo: "brand.600",
        borderColor: "brand.600",
        _hover: {
          md: {
            gradientFrom: "brand.600",
            gradientTo: "brand.700",
            borderColor: "brand.700",
          },
        },
      },
      secondary: {
        bgGradient: "to-b",
        gradientFrom: "gray.800",
        gradientTo: "gray.900",
        borderColor: "gray.800",
        _hover: {
          md: {
            gradientFrom: "gray.700",
            gradientTo: "gray.800",
          },
        },
      },
      ghost: {
        bg: "transparent",
        borderColor: "transparent",
        shadow: "none",
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
        shadow: "none",
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
