import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { css } from "~/styled-system/css";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";
import { useState, useRef } from "react";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const { scrollY } = useScroll();

  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [scrollDirectionChangeY, setScrollDirectionChangeY] = useState(0);
  const [headerPositionAtChange, setHeaderPositionAtChange] = useState(0);
  const lastScrollY = useRef(0);
  const currentHeaderPosition = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    const wasScrollingUp = isScrollingUp;
    const nowScrollingUp = direction === "up";

    // If direction changed, record both scroll position and current header position
    if (wasScrollingUp !== nowScrollingUp) {
      setScrollDirectionChangeY(latest);
      setHeaderPositionAtChange(currentHeaderPosition.current);
    }

    setIsScrollingUp(nowScrollingUp);
    lastScrollY.current = latest;
  });

  const translateY = useTransform(scrollY, (value) => {
    // Only apply scroll transform if we're in the app
    if (!isApp) {
      return 0;
    }

    if (value <= 0) {
      currentHeaderPosition.current = 0;
      return 0;
    }

    let newPosition;

    if (isScrollingUp) {
      // When scrolling up, translate back into view based on how much we've scrolled up
      const scrolledUp = scrollDirectionChangeY - value;
      newPosition = Math.max(
        -64,
        Math.min(0, headerPositionAtChange + scrolledUp),
      );
    } else {
      // When scrolling down, continue from current position
      const scrolledDown = value - scrollDirectionChangeY;
      newPosition = Math.max(-64, headerPositionAtChange - scrolledDown);
    }

    currentHeaderPosition.current = newPosition;
    return newPosition;
  });

  return (
    <motion.div
      className={css({
        borderBottomWidth: 1,
        borderColor: "gray.900",
        pos: "sticky",
        top: "calc(64px + env(safe-area-inset-top))",
        zIndex: 10,
        bgColor: "rgba(12, 12, 12, 0.75)",
        backdropFilter: "blur(10px)",
      })}
      style={{
        translateY,
      }}
    >
      <Container px={2} maxW={1100}>
        <Box overflowX="auto" w="full">
          <Flex gap={0.5} py={2} alignItems="center">
            {children}
          </Flex>
        </Box>
      </Container>
    </motion.div>
  );
};
