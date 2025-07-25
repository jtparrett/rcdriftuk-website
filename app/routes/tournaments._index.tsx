import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { format } from "date-fns";
import { RiAddFill, RiBookOpenFill, RiDeleteBinFill } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { styled, Container, Box, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { LinkOverlay } from "~/components/LinkOverlay";
import { sentenceCase } from "change-case";
import { TabsBar } from "~/components/TabsBar";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  const tournaments = await prisma.tournaments.findMany({
    where: {
      OR: [
        ...(userId
          ? [
              { userId },
              {
                judges: {
                  some: {
                    user: {
                      id: userId,
                    },
                  },
                },
              },
              {
                drivers: {
                  some: {
                    user: {
                      id: userId,
                    },
                  },
                },
              },
            ]
          : []),
        {
          rated: true,
        },
      ],
      archived: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { tournaments, userId };
};

const Page = () => {
  const { tournaments, userId } = useLoaderData<typeof loader>();

  return (
    <>
      <TabsBar>
        <styled.h1 fontSize="lg" fontWeight="extrabold">
          Tournaments
        </styled.h1>
        <Spacer />
        <LinkButton to="/tournaments/user-guide" variant="outline" size="sm">
          Guide <RiBookOpenFill />
        </LinkButton>

        <LinkButton to={userId ? "/tournaments/new" : "/sign-in"} size="sm">
          Create New <RiAddFill />
        </LinkButton>
      </TabsBar>
      <Container maxW={1100} px={2} py={4}>
        <Flex flexDir="column" gap={2}>
          {tournaments.map((tournament) => (
            <Box
              key={tournament.id}
              p={4}
              rounded="xl"
              borderWidth="1px"
              borderColor="gray.800"
              pos="relative"
              overflow="hidden"
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
            >
              <Flex>
                <Box>
                  <LinkOverlay to={`/tournaments/${tournament.id}/overview`}>
                    <styled.span fontWeight="medium" fontSize="lg">
                      {tournament.name}
                    </styled.span>
                  </LinkOverlay>

                  <Flex
                    gap={1}
                    alignItems="center"
                    color="gray.500"
                    fontSize="sm"
                  >
                    <styled.p>
                      {format(new Date(tournament.createdAt), "MMM d, yyyy")}
                    </styled.p>
                    <Box>&middot;</Box>
                    <styled.p>
                      {sentenceCase(tournament.state.toLocaleLowerCase())}
                    </styled.p>
                  </Flex>
                </Box>
                <Spacer />
                {tournament.userId === userId && (
                  <LinkButton
                    variant="ghost"
                    pos="relative"
                    zIndex={3}
                    to={`/tournaments-archive/${tournament.id}`}
                  >
                    <RiDeleteBinFill />
                  </LinkButton>
                )}
              </Flex>
            </Box>
          ))}
        </Flex>
      </Container>
    </>
  );
};

export default Page;
