import { styled } from "~/styled-system/jsx";

export const DashedLine = () => {
  return (
    <styled.svg w="full" h="1px" color="gray.800">
      <styled.line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
    </styled.svg>
  );
};
