import { RiArrowDownSLine } from "react-icons/ri";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { useDisclosure } from "~/utils/useDisclosure";

const H2 = styled("h2", {
  base: {
    fontSize: "2xl",
    fontWeight: "extrabold",
    textWrap: "balance",
  },
});

const Card = styled("div", {
  base: {
    borderWidth: 1,
    borderColor: "gray.800",
    rounded: "xl",
    overflow: "hidden",
    bgColor: "gray.900",
  },
});

const CardHeader = styled("button", {
  base: {
    w: "full",
    p: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    _hover: {
      md: {
        bgColor: "gray.800",
      },
    },
  },
});

const CardContent = styled("div", {
  base: {
    p: 6,
    borderTopWidth: 1,
    borderColor: "gray.800",
  },
});

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleCard = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) => {
  const disclosure = useDisclosure(defaultOpen);

  return (
    <Card>
      <CardHeader onClick={disclosure.toggle}>
        <H2 my={0}>{title}</H2>
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

const Page = () => {
  return (
    <Container maxW={1100} px={2} py={4}>
      <Flex flexDir="column" gap={4}>
        <CollapsibleCard title="2024 Final Standings">
          <styled.img src="/2024/final-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Overall Standings">
          <styled.img src="/2024/overall-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 1 Standings">
          <styled.img src="/2024/round-1-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 2 Standings">
          <styled.img src="/2024/round-2-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 3 Standings">
          <styled.img src="/2024/round-3-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 4 Standings">
          <styled.img src="/2024/round-4-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 5 Standings">
          <styled.img src="/2024/round-5-standings.jpg" />
        </CollapsibleCard>

        <CollapsibleCard title="Round 6 Standings">
          <styled.img src="/2024/round-6-standings.jpg" />
        </CollapsibleCard>
      </Flex>
    </Container>
  );
};

export default Page;
