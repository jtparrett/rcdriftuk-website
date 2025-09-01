import { RiAddFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { LinkButton } from "~/components/Button";
import { LinkOverlay } from "~/components/LinkOverlay";
import { TabsBar } from "~/components/TabsBar";
import { Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      OR: [
        {
          userId: userId!,
        },
        {
          drivers: {
            some: {
              driver: {
                id: userId!,
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
          Create New <RiAddFill />
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
            <styled.article
              key={leaderboard.id}
              pos="relative"
              p={4}
              rounded="xl"
              borderWidth="1px"
              borderColor="gray.800"
              overflow="hidden"
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
            >
              <LinkOverlay to={`/leaderboards/${leaderboard.id}`}>
                <styled.span fontWeight="medium" fontSize="lg">
                  {leaderboard.name}
                </styled.span>
              </LinkOverlay>
            </styled.article>
          ))}
        </Flex>
      </Container>
    </>
  );
};

export default LeaderboardsPage;
