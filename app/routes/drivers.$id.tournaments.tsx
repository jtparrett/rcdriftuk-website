import { format } from "date-fns";
import { RiArrowRightSLine } from "react-icons/ri";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);

  const tournaments = await prisma.tournaments.findMany({
    where: {
      rated: true,
      drivers: {
        some: {
          driverId,
        },
      },
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
    <Flex flexDir="column" gap={2}>
      {tournaments.map((tournament) => (
        <Card
          key={tournament.id}
          pos="relative"
          bgGradient="to-b"
          gradientFrom="gray.900"
          gradientTo="black"
        >
          <Flex alignItems="center" gap={1} p={6}>
            <Box flex={1}>
              <LinkOverlay to={`/tournaments/${tournament.id}`}>
                <styled.h2 fontWeight="medium">{tournament.name}</styled.h2>
              </LinkOverlay>
              <styled.p fontSize="sm" color="gray.500">
                {format(new Date(tournament.createdAt), "MMM d, yyyy")}
              </styled.p>
            </Box>
            <RiArrowRightSLine />
          </Flex>
        </Card>
      ))}
    </Flex>
  );
};

export default Page;
