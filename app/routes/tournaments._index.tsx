import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { RiAddFill } from "react-icons/ri";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { styled, Container, Box, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId);

  const tournaments = await prisma.tournaments.findMany({
    where: {
      userId,
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
    <Container maxW={1100} px={2} py={4}>
      <Flex alignItems="center" pb={2}>
        <styled.h1 fontSize={{ base: "xl", md: "3xl" }} fontWeight="extrabold">
          My Tournaments
        </styled.h1>
        <Spacer />
        <LinkButton to="/tournaments/new" size="xs">
          New Tournament <RiAddFill />
        </LinkButton>
      </Flex>
      <Box h={1} bgColor="brand.500" w={32} mb={6} />
      <Flex flexDir="column" gap={2}>
        {tournaments.map((tournament) => (
          <Box
            key={tournament.id}
            p={1}
            rounded="xl"
            borderWidth="1px"
            borderColor="gray.700"
          >
            <Flex p={4} rounded="lg" borderWidth="1px" borderColor="gray.800">
              <Box>
                <Link to={`/tournaments/${tournament.id}/overview`}>
                  <styled.span fontWeight="bold" fontSize="lg">
                    {tournament.name}
                  </styled.span>
                </Link>
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
