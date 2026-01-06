import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { format } from "date-fns";
import {
  RiAddCircleFill,
  RiBookOpenFill,
  RiCheckboxMultipleBlankFill,
  RiDeleteBinFill,
} from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { styled, Container, Box, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { LinkOverlay } from "~/components/LinkOverlay";
import { sentenceCase } from "change-case";
import { TabsBar } from "~/components/TabsBar";
import { Tab } from "~/components/Tab";
import { Regions } from "@prisma/client";
import { z } from "zod";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const region = z
    .nativeEnum(Regions)
    .nullable()
    .default(Regions.ALL)
    .parse(url.searchParams.get("region")?.toUpperCase());

  const isMyTournaments = url.searchParams.get("my") === "true";

  const tournaments = await prisma.tournaments.findMany({
    where: {
      ...(region !== Regions.ALL ? { region } : {}),
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

        ...(isMyTournaments
          ? []
          : [
              {
                rated: true,
              },
            ]),
      ],
      archived: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { tournaments, userId, isMyTournaments, region };
};

const Page = () => {
  const { tournaments, userId, isMyTournaments, region } =
    useLoaderData<typeof loader>();

  return (
    <>
      <TabsBar>
        {Object.values(Regions).map((option) => {
          return (
            <Tab
              key={option}
              to={`/tournaments?region=${option.toLowerCase()}${isMyTournaments ? "&my=true" : ""}`}
              isActive={option === region}
              data-replace="true"
              replace
            >
              {option}
            </Tab>
          );
        })}
      </TabsBar>

      <Box borderBottomWidth={1} borderColor="gray.900">
        <Container px={2} maxW={1100}>
          <Flex gap={0.5} py={2}>
            <Tab
              to={`/tournaments${region !== Regions.ALL ? `?region=${region}` : ""}`}
              isActive={!isMyTournaments}
              replace
              data-replace="true"
            >
              All Tournaments
            </Tab>
            <Tab
              to={`/tournaments?my=true${region !== Regions.ALL ? `&region=${region}` : ""}`}
              isActive={isMyTournaments}
              replace
              data-replace="true"
            >
              My Tournaments
            </Tab>
          </Flex>
        </Container>
      </Box>

      <Container maxW={1100} px={2} py={2}>
        <styled.h1 srOnly>Tournaments</styled.h1>

        <Flex gap={2} mb={2}>
          <LinkButton
            to={userId ? "/tournaments/new" : "/sign-in"}
            size="sm"
            flex={1}
          >
            Create New <RiAddCircleFill />
          </LinkButton>
          <LinkButton
            to="/tournaments/user-guide"
            variant="outline"
            size="sm"
            flex={1}
          >
            Guide <RiBookOpenFill />
          </LinkButton>
        </Flex>

        <Flex flexDir="column" gap={2}>
          {tournaments.length === 0 && (
            <styled.p textAlign="center" color="gray.500" py={4}>
              Looks like you don't have any tournaments yet.
            </styled.p>
          )}

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
                <LinkButton
                  variant="ghost"
                  pos="relative"
                  zIndex={3}
                  to={`/tournaments/new?tournamentId=${tournament.id}`}
                >
                  <RiCheckboxMultipleBlankFill />
                </LinkButton>
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
