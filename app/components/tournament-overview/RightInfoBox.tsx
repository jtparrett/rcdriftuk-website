import { motion } from "motion/react";
import { Box, Spacer } from "~/styled-system/jsx";
import { css } from "~/styled-system/css";

export const RightInfoBox = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      className={css({
        display: "flex",
        overflow: "hidden",
      })}
      initial={{ x: 200, opacity: 0, filter: "blur(8px)" }}
      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        delay,
      }}
    >
      <Spacer />
      <Box
        bgGradient="to-b"
        gradientFrom="gray.800"
        gradientTo="gray.900"
        py={2}
        pl={{ base: 4, md: 8 }}
        pr={{ base: 4, md: 10 }}
        transform="skewX(-16deg)"
        mr={-2}
        borderLeftWidth={4}
        borderColor="brand.500"
        whiteSpace="nowrap"
      >
        <Box transform="skewX(16deg)" textAlign="right">
          {children}
        </Box>
      </Box>
    </motion.div>
  );
};
