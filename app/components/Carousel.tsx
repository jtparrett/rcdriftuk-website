import type { ReactNode } from "react";
import React, { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { motion } from "motion/react";
import { css } from "~/styled-system/css";

interface Props {
  children: ReactNode[];
}

const ArrowButton = styled("button", {
  base: {
    w: 6,
    h: 6,
    rounded: "full",
    bg: "gray.800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
});

export const Carousel = ({ children }: Props) => {
  const arrayChildren = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((currentIndex + 1) % arrayChildren.length);
  };

  const previous = () => {
    setCurrentIndex(
      (currentIndex - 1 + arrayChildren.length) % arrayChildren.length,
    );
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 500;

    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > swipeVelocityThreshold
    ) {
      if (info.offset.x > 0) {
        // Swiped right, go to previous
        previous();
      } else {
        // Swiped left, go to next
        next();
      }
    }
  };

  return (
    <Box pos="relative" w="full">
      <Box w="full" overflow="hidden">
        <motion.div
          className={css({
            display: "flex",
          })}
          onDragEnd={handleDragEnd}
          drag={arrayChildren.length > 1 ? "x" : false}
          dragElastic={0}
          animate={{ x: (-100 / arrayChildren.length) * currentIndex + "%" }}
          style={{
            width: `${arrayChildren.length * 100}%`,
          }}
        >
          {children}
        </motion.div>
      </Box>
      {arrayChildren.length > 1 && (
        <Flex
          p={1}
          pos="absolute"
          rounded="full"
          bottom={2}
          right={2}
          zIndex={2}
          gap={2}
          bgColor="rgba(12, 12, 12, 0.75)"
          backdropFilter="blur(10px)"
          alignItems="center"
        >
          <ArrowButton type="button" onClick={previous}>
            <RiArrowLeftSLine />
          </ArrowButton>
          <styled.p fontSize="sm" color="gray.500">
            {currentIndex + 1}/{arrayChildren.length}
          </styled.p>
          <ArrowButton type="button" onClick={next}>
            <RiArrowRightSLine />
          </ArrowButton>
        </Flex>
      )}
    </Box>
  );
};
