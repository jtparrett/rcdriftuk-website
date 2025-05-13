import { Link } from "react-router";
import { styled } from "~/styled-system/jsx";

export const LinkOverlay = styled(Link, {
  base: {
    _before: {
      content: '""',
      position: "absolute",
      inset: 0,
      display: "block",
      zIndex: 3,
    },
  },
});
