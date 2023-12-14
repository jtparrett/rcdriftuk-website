import { Link } from "@remix-run/react";
import { ReactNode } from "react";
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
      py={1}
      textTransform="capitalize"
      bgColor={isActive ? "black" : undefined}
      rounded="md"
      fontWeight="medium"
      transition="background-color .3s"
    >
      {children}
    </TabBase>
  );
};
