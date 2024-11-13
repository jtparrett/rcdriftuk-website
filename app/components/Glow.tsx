import { styled } from "~/styled-system/jsx";

export const Glow = styled("div", {
  base: {
    position: "absolute",
    zIndex: -1,
    inset: 0,
    borderRadius: "inherit",
    overflow: "hidden",
    _before: {
      content: '""',
      position: "absolute",
      inset: 1,
      bgColor: "black",
      zIndex: -1,
      borderRadius: "inherit",
    },
    _after: {
      content: '""',
      position: "absolute",
      width: "100px",
      ml: "-50px",
      height: "100%",
      bgGradient: "to-r",
      gradientFrom: "rgba(236, 26, 85, 0)",
      gradientVia: "brand.500",
      gradientTo: "rgba(236, 26, 85, 0)",
      zIndex: -2,
      top: "50%",
      left: "50%",
      animation: `spin 3s linear infinite`,
      transformOrigin: "top center",
    },
  },
});
