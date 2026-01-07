import { Box, styled } from "~/styled-system/jsx";
import { RiArrowDownSLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";

export const Card = styled("div", {
  base: {
    borderWidth: 1,
    borderColor: "gray.800",
    rounded: "xl",
    overflow: "hidden",
    bgColor: "gray.900",
  },
});

export const CardHeader = styled("div", {
  base: {
    w: "full",
    p: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "background-color .2s",
    _hover: {
      md: {
        bgColor: "gray.800",
      },
    },
  },
});

export const CardContent = styled("div", {
  base: {
    p: 6,
    borderTopWidth: 1,
    borderColor: "gray.800",
  },
});

const H2 = styled("h2", {
  base: {
    fontSize: {
      base: "xl",
      md: "2xl",
    },
    fontWeight: "extrabold",
    textWrap: "balance",
  },
});

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleCard = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) => {
  const disclosure = useDisclosure(defaultOpen);

  return (
    <Card>
      <CardHeader onClick={disclosure.toggle}>
        <H2 textAlign="left">{title}</H2>
        <Box
          transform={disclosure.isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          color="gray.400"
        >
          <RiArrowDownSLine size={24} />
        </Box>
      </CardHeader>
      {disclosure.isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
};
