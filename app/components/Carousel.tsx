import type { CSSProperties, ReactNode } from "react";
import React, { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useSwipeable } from "react-swipeable";
import { Box, Flex, styled } from "~/styled-system/jsx";

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

  const handlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => previous(),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <Box pos="relative" w="full">
      <Box
        w="full"
        overflow="hidden"
        {...handlers}
        style={{ touchAction: "pan-y", cursor: "grab" }}
      >
        <Flex
          transform="var(--transform)"
          w="full"
          overflow="visible"
          transition="transform 0.2s ease-in-out"
          style={
            {
              "--transform": `translateX(-${currentIndex * 100}%)`,
            } as CSSProperties
          }
        >
          {children}
        </Flex>
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
          <styled.p fontSize="sm" color="gray.500" fontFamily="mono">
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
