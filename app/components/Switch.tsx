import { styled } from "~/styled-system/jsx";

export const Switch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <styled.button
    type="button"
    onClick={() => onChange(!checked)}
    w={9}
    h={5}
    rounded="full"
    bgColor={checked ? "brand.500" : "gray.700"}
    pos="relative"
    cursor="pointer"
    transition="background-color 0.2s"
    flexShrink={0}
  >
    <styled.span
      display="block"
      w={3.5}
      h={3.5}
      rounded="full"
      bgColor="white"
      pos="absolute"
      top="50%"
      transform="translateY(-50%)"
      left={checked ? "calc(100% - 17px)" : "3px"}
      transition="left 0.2s"
    />
  </styled.button>
);
