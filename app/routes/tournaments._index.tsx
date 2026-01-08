import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { format } from "date-fns";
import {
  RiAddCircleFill,
  RiCheckboxCircleFill,
  RiCheckboxMultipleBlankFill,
  RiCircleLine,
  RiDeleteBinFill,
  RiSearchLine,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { Button, LinkButton } from "~/components/Button";
import {
  styled,
  Container,
  Box,
  Flex,
  Spacer,
  Center,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { LinkOverlay } from "~/components/LinkOverlay";
import { sentenceCase } from "change-case";
import { TabsBar } from "~/components/TabsBar";
import { TabButton } from "~/components/Tab";
import { z } from "zod";
import { Regions } from "~/utils/enums";
import { token } from "~/styled-system/tokens";
import { useCallback, useState } from "react";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const region = z
    .nativeEnum(Regions)
    .nullable()
    .default(Regions.ALL)
    .parse(url.searchParams.get("region")?.toUpperCase());

  const isMyTournaments = url.searchParams.get("my") === "true";
  const query = url.searchParams.get("query") ?? "";

  const tournaments = await prisma.tournaments.findMany({
    where: {
      ...(region !== Regions.ALL ? { region } : {}),
      ...(query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : {}),
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
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const [searchValue, setSearchValue] = useState(query);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          if (value.trim()) {
            newSearchParams.set("query", value.trim());
          } else {
            newSearchParams.delete("query");
          }
          setSearchParams(newSearchParams);
        }, 300); // 300ms debounce
      };
    })(),
    [searchParams, setSearchParams],
  );

  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const toggleMyTournaments = () => {
    setSearchParams((prev) => {
      prev.set("my", isMyTournaments ? "false" : "true");
      return prev;
    });
  };

  const changeRegion = (region: Regions) => {
    setSearchParams((prev) => {
      prev.set("region", region.toLowerCase());
      return prev;
    });
  };

  return (
    <>
      <TabsBar>
        {Object.values(Regions).map((option) => {
          return (
            <TabButton
              key={option}
              onClick={() => changeRegion(option)}
              isActive={option === region}
            >
              {option}
            </TabButton>
          );
        })}
      </TabsBar>

      <Box borderBottomWidth={1} borderColor="gray.900">
        <Flex maxW={1100} mx="auto">
          <Center pl={4} color="gray.500">
            <RiSearchLine />
          </Center>
          <styled.input
            value={searchValue}
            onChange={handleSearchChange}
            bgColor="inherit"
            px={2}
            py={3}
            w="full"
            placeholder={`Search ${region === Regions.ALL ? "" : `${region} `}tournaments...`}
            color="inherit"
            outline="none"
          />
        </Flex>
      </Box>

      <Container maxW={1100} px={2} py={2}>
        <styled.h1 srOnly>Tournaments</styled.h1>

        <Flex gap={2} mb={2}>
          <Spacer />
          <Button variant="outline" onClick={toggleMyTournaments} pr={3}>
            My Tournaments
            <styled.span
              style={{
                color: isMyTournaments
                  ? token("colors.green.500")
                  : token("colors.white"),
              }}
            >
              {isMyTournaments ? <RiCheckboxCircleFill /> : <RiCircleLine />}
            </styled.span>
          </Button>
          <LinkButton to="/tournaments/new" size="sm">
            Create New <RiAddCircleFill />
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
              <Flex alignItems="center" gap={1}>
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
                {tournament.rated && (
                  <Flex
                    bgColor="brand.900"
                    rounded="full"
                    borderWidth={1}
                    borderColor="brand.800"
                    color="brand.400"
                    pl={2}
                    pr={2.5}
                    py={1}
                    alignItems="center"
                    gap={1}
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    <RiVerifiedBadgeFill /> <styled.span>Rated</styled.span>
                  </Flex>
                )}
                <LinkButton
                  variant="ghost"
                  pos="relative"
                  zIndex={3}
                  size="sm"
                  to={`/tournaments/new?tournamentId=${tournament.id}`}
                >
                  <RiCheckboxMultipleBlankFill />
                </LinkButton>
                {tournament.userId === userId && (
                  <LinkButton
                    variant="ghost"
                    pos="relative"
                    zIndex={3}
                    size="sm"
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
