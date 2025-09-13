import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { css } from "~/styled-system/css";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";
import { useState, useRef } from "react";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const { scrollY } = useScroll();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!isApp) {
      setIsVisible(true);
      return;
    }

    if (latest <= 16) {
      // Always show when near top
      setIsVisible(true);
    } else {
      // Show when scrolling up, hide when scrolling down
      const direction = latest > lastScrollY.current ? "down" : "up";
      setIsVisible(direction === "up");
    }
    lastScrollY.current = latest;
  });

  // Use animate prop for smooth transitions

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
      animate={{
        translateY: isVisible ? 0 : -64,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
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
