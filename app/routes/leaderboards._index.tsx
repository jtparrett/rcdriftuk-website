import { format } from "date-fns";
import { RiAddCircleFill, RiArrowRightSLine } from "react-icons/ri";
import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { LinkButton } from "~/components/Button";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { TabsBar } from "~/components/TabsBar";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in?redirect_url=/leaderboards");
  }

  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      OR: [
        {
          userId: userId,
        },
        {
          drivers: {
            some: {
              driver: {
                id: userId,
              },
            },
          },
        },
        {
          tournaments: {
            some: {
              tournament: {
                drivers: {
                  some: {
                    user: {
                      id: userId!,
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { leaderboards, userId };
};

const LeaderboardsPage = () => {
  const { leaderboards, userId } = useLoaderData<typeof loader>();

  return (
    <>
      <TabsBar>
        <styled.h1 fontSize="lg" fontWeight="extrabold">
          Leaderboards
        </styled.h1>
        <Spacer />

        <LinkButton to={userId ? "/leaderboards/new" : "/sign-in"} size="sm">
          Create a Leaderboard <RiAddCircleFill />
        </LinkButton>
      </TabsBar>
      <Container maxW={1100} px={2} py={4}>
        <Flex flexDir="column" gap={2}>
          {leaderboards.length === 0 && (
            <styled.p textAlign="center" color="gray.500">
              Looks like you don't have any leaderboards yet.
            </styled.p>
          )}

          {leaderboards.map((leaderboard) => (
            <Card
              key={leaderboard.id}
              pos="relative"
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
            >
              <Flex alignItems="center" gap={4} p={6}>
                <Box flex={1} overflow="hidden">
                  <LinkOverlay to={`/leaderboards/${leaderboard.id}`}>
                    <styled.span fontWeight="medium" fontSize="lg">
                      {leaderboard.name}
                    </styled.span>
                  </LinkOverlay>
                  <styled.p fontSize="sm" color="gray.500">
                    {format(new Date(leaderboard.createdAt), "MMM d, yyyy")}
                  </styled.p>
                </Box>

                <RiArrowRightSLine />
              </Flex>
            </Card>
          ))}
        </Flex>
      </Container>
    </>
  );
};

export default LeaderboardsPage;
