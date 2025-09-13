import { motion, useScroll, useTransform, useMotionValue } from "motion/react";
import { css } from "~/styled-system/css";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";
import { useEffect } from "react";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const { scrollY } = useScroll();

  const translateY = useTransform(
    scrollY,
    [0, 84],
    ["0px", isApp ? "-16px" : "0px"],
  );

  const tabsBarY = useMotionValue(0);

  useEffect(() => {
    if (!isApp) return;

    let lastScrollY = 0;
    let tabsOffset = 0;

    const unsubscribe = scrollY.on("change", (currentScrollY) => {
      const scrollDelta = currentScrollY - lastScrollY;

      // Calculate the current header height based on scroll position to match header movement
      const progress = Math.min(currentScrollY / 84, 1);
      const currentHeaderHeight = 64 - (64 - 48) * progress; // 64px -> 48px
      // Move it the full header height to hide it completely (same as header)
      const maxHideDistance = currentHeaderHeight;

      if (currentScrollY <= 0) {
        // At top - always show tabs
        tabsOffset = 0;
      } else if (scrollDelta > 0) {
        // Scrolling down - hide tabs progressively (same as header)
        tabsOffset = Math.min(tabsOffset + scrollDelta, maxHideDistance);
      } else if (scrollDelta < 0) {
        // Scrolling up - show tabs progressively at rate of scroll change
        tabsOffset = Math.max(tabsOffset + scrollDelta, 0);
      }

      tabsBarY.set(-tabsOffset);
      lastScrollY = currentScrollY;
    });

    return () => unsubscribe();
  }, [scrollY, tabsBarY, isApp]);

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
        y: isApp ? tabsBarY : 0,
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
