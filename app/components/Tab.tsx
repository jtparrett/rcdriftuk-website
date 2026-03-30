import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router";
import { styled } from "~/styled-system/jsx";
import { cva, type RecipeVariantProps } from "~/styled-system/css";
import { WebHaptics } from "web-haptics";

let haptics: WebHaptics | null = null;
function getHaptics() {
  if (!haptics) haptics = new WebHaptics();
  return haptics;
}

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

const StyledTab = styled(Link, TabStyle);
const StyledTabButton = styled("button", TabStyle);

type TabProps = React.ComponentProps<typeof StyledTab>;
type TabButtonProps = React.ComponentProps<typeof StyledTabButton>;

export const Tab = forwardRef<HTMLAnchorElement, TabProps>(
  ({ onClick, ...props }, ref) => (
    <StyledTab
      ref={ref}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        getHaptics().trigger("selection");
        onClick?.(e);
      }}
      {...props}
    />
  ),
);
Tab.displayName = "Tab";

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ onClick, ...props }, ref) => (
    <StyledTabButton
      ref={ref}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        getHaptics().trigger("selection");
        onClick?.(e);
      }}
      {...props}
    />
  ),
);
TabButton.displayName = "TabButton";

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
