import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useMotionValue,
} from "motion/react";
import { css } from "~/styled-system/css";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";
import { useRef } from "react";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const { scrollY } = useScroll();

  // Motion values for tracking scroll state without re-renders
  const isScrollingUp = useMotionValue(false);
  const scrollDirectionChangeY = useMotionValue(0);
  const headerPositionAtChange = useMotionValue(0);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    const wasScrollingUp = isScrollingUp.get();
    const nowScrollingUp = direction === "up";

    // If direction changed, record both scroll position and current header position
    if (wasScrollingUp !== nowScrollingUp) {
      scrollDirectionChangeY.set(latest);
      headerPositionAtChange.set(translateY.get());
    }

    isScrollingUp.set(nowScrollingUp);
    lastScrollY.current = latest;
  });

  const translateY = useTransform(scrollY, (value) => {
    // Only apply scroll transform if we're in the app
    if (!isApp) {
      return 0;
    }

    if (value <= 0) {
      return 0;
    }

    const scrollingUp = isScrollingUp.get();
    const changeY = scrollDirectionChangeY.get();
    const positionAtChange = headerPositionAtChange.get();

    if (scrollingUp) {
      // When scrolling up, translate back into view based on how much we've scrolled up
      const scrolledUp = changeY - value;
      return Math.max(-64, Math.min(0, positionAtChange + scrolledUp));
    } else {
      // When scrolling down, continue from current position
      const scrolledDown = value - changeY;
      return Math.max(-64, positionAtChange - scrolledDown);
    }
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
