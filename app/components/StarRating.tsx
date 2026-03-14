import { useState } from "react";
import { RiStarFill, RiStarLine } from "react-icons/ri";
import { Flex, styled } from "~/styled-system/jsx";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const StarRating = ({
  value,
  onChange,
  size = "md",
  interactive = false,
}: StarRatingProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const iconSize = sizeMap[size];
  const displayValue = hovered ?? value;

  return (
    <Flex
      gap={0.5}
      alignItems="center"
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        const Icon = filled ? RiStarFill : RiStarLine;

        if (!interactive) {
          return (
            <Icon
              key={star}
              size={iconSize}
              color={filled ? "#eab308" : "#4b5563"}
            />
          );
        }

        return (
          <styled.button
            key={star}
            type="button"
            cursor="pointer"
            p={0.5}
            display="flex"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
          >
            <Icon size={iconSize} color={filled ? "#eab308" : "#4b5563"} />
          </styled.button>
        );
      })}
    </Flex>
  );
};
