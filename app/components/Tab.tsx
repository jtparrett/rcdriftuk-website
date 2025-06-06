import { Link } from "react-router";
import type { ReactNode } from "react";
import { styled } from "~/styled-system/jsx";

interface Props {
  children?: ReactNode;
  isActive?: boolean;
  to: string;
}

const TabBase = styled(Link);

export const Tab = ({ children, isActive, to }: Props) => {
  return (
    <TabBase
      to={to}
      px={3}
      py={2}
      bgColor={isActive ? "gray.800" : undefined}
      rounded="lg"
      fontWeight="semibold"
      fontSize="sm"
      transition="background-color .3s"
      whiteSpace="nowrap"
    >
      {children}
    </TabBase>
  );
};
