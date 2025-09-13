import { motion, useScroll, useTransform } from "motion/react";
import { css } from "~/styled-system/css";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const { scrollY } = useScroll();

  const translateY = useTransform(
    scrollY,
    [0, 84],
    ["0px", isApp ? "-16px" : "0px"],
  );

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
