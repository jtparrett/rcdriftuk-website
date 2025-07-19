import { Box, Center, styled } from "~/styled-system/jsx";
import { motion } from "framer-motion";
import { css } from "~/styled-system/css";
import { useState } from "react";

export const AppSplash = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      className={css({
        position: "absolute",
        inset: 0,
        bgColor: "black",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      })}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0, filter: "blur(16px)" }}
      transition={{ duration: 0.4, delay: 1.5, ease: "easeInOut" }}
      onAnimationComplete={() => {
        setIsVisible(false);
      }}
    >
      <Box w="200px">
        <styled.img
          src="/rcdriftuk-26.svg"
          alt="Splash"
          w="full"
          display="block"
        />
      </Box>
    </motion.div>
  );
};
