import pluralize from "pluralize";
import { RiArrowRightSLine } from "react-icons/ri";
import { useLoaderData } from "react-router";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";

export const loader = async () => {
  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      userId: SDC_USER_ID,
    },
    include: {
      _count: {
        select: {
          tournaments: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return leaderboards;
};

const Page = () => {
  const leaderboards = useLoaderData<typeof loader>();

  return (
    <Container maxW={800} px={2} py={4}>
      <Flex flexDir="column" gap={2}>
        {leaderboards.map((leaderboard) => (
          <Card
            key={leaderboard.id}
            bgGradient="to-b"
            gradientFrom="gray.900"
            gradientTo="black"
            pos="relative"
          >
            <Flex p={6} alignItems="center">
              <Box flex={1}>
                <LinkOverlay to={`/leaderboards/${leaderboard.id}`}>
                  <styled.h2 fontWeight="medium">{leaderboard.name}</styled.h2>
                </LinkOverlay>
                <styled.p fontSize="sm" color="gray.500">
                  {pluralize(
                    "tournament",
                    leaderboard._count.tournaments,
                    true,
                  )}
                </styled.p>
              </Box>
              <RiArrowRightSLine />
            </Flex>
          </Card>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
