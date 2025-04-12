import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { RiAddFill, RiBookOpenFill } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { styled, Container, Box, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { LinkOverlay } from "~/components/LinkOverlay";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const tournaments = await prisma.tournaments.findMany({
    where: {
      OR: [
        {
          userId,
        },
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
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { tournaments };
};

const Page = () => {
  const { tournaments } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <Flex
        alignItems={{ base: "stretch", md: "flex-end" }}
        pb={4}
        gap={2}
        flexDir={{ base: "column", md: "row" }}
      >
        <styled.h1 fontSize="3xl" fontWeight="extrabold">
          My Tournaments
        </styled.h1>
        <Spacer />
        <LinkButton to="/tournaments/new">
          New Tournament <RiAddFill />
        </LinkButton>
        <LinkButton
          to="/tournaments/user-guide"
          variant="outline"
          target="_blank"
        >
          User Guide <RiBookOpenFill />
        </LinkButton>
      </Flex>

      <Flex flexDir="column" gap={2}>
        {tournaments.map((tournament) => (
          <Box
            key={tournament.id}
            p={1}
            rounded="xl"
            borderWidth="1px"
            borderColor="gray.700"
            pos="relative"
            overflow="hidden"
          >
            <LinkOverlay to={`/tournaments/${tournament.id}/overview`} />
            <Flex p={4} rounded="lg" borderWidth="1px" borderColor="gray.800">
              <Box>
                <styled.span fontWeight="bold" fontSize="lg">
                  {tournament.name}
                </styled.span>

                <styled.p fontSize="sm" color="gray.500">
                  {format(new Date(tournament.createdAt), "MMM d, yyyy")}
                </styled.p>
              </Box>
              <Spacer />
              <styled.span fontSize="sm" color="gray.700">
                {tournament.state}
              </styled.span>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
