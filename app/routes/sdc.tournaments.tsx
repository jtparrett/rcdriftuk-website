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
  RiExchangeLine,
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
  Divider,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { LinkOverlay } from "~/components/LinkOverlay";
import { sentenceCase } from "change-case";
import { token } from "~/styled-system/tokens";
import { useCallback, useState } from "react";
import { Card } from "~/components/CollapsibleCard";
import { SDC_USER_ID } from "~/utils/theme";

export const meta = () => {
  return [{ title: "SDC 2026 - Tournaments" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);

  const isMyTournaments = url.searchParams.get("my") === "true";
  const query = url.searchParams.get("query") ?? "";

  const nameFilter = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {};

  if (isMyTournaments && userId) {
    const tournaments = await prisma.tournaments.findMany({
      where: {
        ...nameFilter,
        OR: [
          { userId },
          { judges: { some: { user: { id: userId } } } },
          { drivers: { some: { user: { id: userId } } } },
        ],
        archived: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return { tournaments, userId, isMyTournaments };
  }

  const tournaments = await prisma.tournaments.findMany({
    where: {
      ...nameFilter,
      leaderboards: {
        some: {
          leaderboard: { userId: SDC_USER_ID },
        },
      },
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  return { tournaments, isMyTournaments, userId };
};

const Page = () => {
  const { tournaments, isMyTournaments, userId } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const [searchValue, setSearchValue] = useState(query);

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
        }, 300);
      };
    })(),
    [searchParams, setSearchParams],
  );

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

  return (
    <Container maxW={800} px={2} py={6}>
      <Box
        borderWidth={1}
        borderColor="gray.800"
        rounded="xl"
        overflow="hidden"
        mb={4}
      >
        <Flex>
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
            placeholder="Search tournaments..."
            color="inherit"
            outline="none"
          />
        </Flex>
      </Box>

      <Flex gap={2} mb={4} alignItems="center">
        <Divider flex={1} borderColor="gray.800" />
        <Button variant="secondary" onClick={toggleMyTournaments} pr={3}>
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
          <styled.p textAlign="center" color="gray.500" py={8}>
            {isMyTournaments
              ? "You don't have any tournaments yet."
              : "No tournaments found."}
          </styled.p>
        )}

        {tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            p={4}
            pos="relative"
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

              {tournament.userId === userId && (
                <LinkButton
                  variant="ghost"
                  pos="relative"
                  zIndex={3}
                  size="sm"
                  to={`/tournaments/new?tournamentId=${tournament.id}`}
                >
                  <RiCheckboxMultipleBlankFill />
                </LinkButton>
              )}

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
          </Card>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
