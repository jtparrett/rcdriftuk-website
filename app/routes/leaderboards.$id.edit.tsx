import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { Label } from "~/components/Label";
import { Box, Container, Flex, styled, VStack } from "~/styled-system/jsx";
import { z } from "zod";
import {
  useFetcher,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { TabButton, TabGroup } from "~/components/Tab";
import { LeaderboardType, TournamentsState } from "~/utils/enums";
import { capitalCase } from "change-case";
import { getUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { Reorder } from "motion/react";
import { RiDeleteBinFill, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "~/components/Dropdown";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  notFoundInvariant(userId, "User not found");

  const leaderboard = await prisma.leaderboards.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      drivers: true,
      tournaments: true,
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const users = await getUsers();

  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
      OR: [
        {
          userId,
        },
        {
          rated: true,
        },
      ],
    },
  });

  return {
    leaderboard,
    users,
    tournaments,
  };
};

const formSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(LeaderboardType),
  tournaments: z.array(z.string()),
  drivers: z.array(z.number()),
});

const validationSchema = toFormikValidationSchema(formSchema);

const TournamentsForm = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) => {
  const { tournaments } = useLoaderData<typeof loader>();
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(
      (tournament) =>
        !value.includes(tournament.id) &&
        `${tournament.name}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [tournaments, value, search]);

  return (
    <Box>
      {value.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              marginBottom: "-1px",
            }}
          >
            {value.map((tournamentId, i) => {
              const tournament = tournaments.find(
                (tournament) => tournament.id === tournamentId,
              );

              return (
                <Reorder.Item
                  key={tournamentId}
                  value={tournamentId}
                  style={{ listStyle: "none" }}
                  whileDrag={{
                    zIndex: 1000,
                  }}
                  dragElastic={0.1}
                >
                  <Flex
                    gap={2}
                    borderBottomWidth={1}
                    borderBottomColor="gray.800"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    transition="all 0.2s ease"
                    _hover={{ bgColor: "gray.800" }}
                    alignItems="center"
                    pl={2}
                  >
                    <RiDraggable size={16} />

                    <styled.p
                      flex={1}
                      userSelect="none"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      py={1}
                    >
                      {i + 1}.{" "}
                      {tournament ? `${tournament.name}` : tournamentId}
                    </styled.p>

                    <Box p={1}>
                      <Button
                        px={1}
                        size="xs"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          onChange(value.filter((_id, index) => index !== i));
                        }}
                      >
                        <RiDeleteBinFill />
                      </Button>
                    </Box>
                  </Flex>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(_e) => {
            setTimeout(() => {
              const active = document.activeElement;
              const listbox = document.querySelector('[role="listbox"]');
              if (!listbox?.contains(active)) {
                setFocused(false);
              }
            }, 0);
          }}
          onFocus={() => setFocused(true)}
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {focused && search.length > 0 && (
          <Dropdown role="listbox">
            {filteredTournaments.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No results found
              </styled.p>
            )}

            {filteredTournaments.map((tournament) => {
              return (
                <Option
                  key={tournament.id}
                  type="button"
                  onClick={() => {
                    onChange([...value, tournament.id]);
                    setSearch("");
                  }}
                >
                  {tournament.name}
                </Option>
              );
            })}
          </Dropdown>
        )}
      </Box>
    </Box>
  );
};

const PeopleForm = ({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) => {
  const { users } = useLoaderData<typeof loader>();
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !value.includes(user.driverId) &&
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [users, value, search]);

  return (
    <Box>
      {value.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              marginBottom: "-1px",
            }}
          >
            {value.map((userId, i) => {
              const user = users.find((user) =>
                typeof userId === "string" ? false : user.driverId === userId,
              );

              return (
                <Reorder.Item
                  key={userId}
                  value={userId}
                  style={{ listStyle: "none" }}
                  whileDrag={{
                    zIndex: 1000,
                  }}
                  dragElastic={0.1}
                >
                  <Flex
                    gap={2}
                    borderBottomWidth={1}
                    borderBottomColor="gray.800"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    transition="all 0.2s ease"
                    _hover={{ bgColor: "gray.800" }}
                    alignItems="center"
                    pl={2}
                  >
                    <RiDraggable size={16} />

                    <styled.p
                      flex={1}
                      userSelect="none"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      py={1}
                    >
                      {i + 1}.{" "}
                      {user ? `${user.firstName} ${user.lastName}` : userId}
                    </styled.p>

                    <Box p={1}>
                      <Button
                        px={1}
                        size="xs"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          onChange(value.filter((_id, index) => index !== i));
                        }}
                      >
                        <RiDeleteBinFill />
                      </Button>
                    </Box>
                  </Flex>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(_e) => {
            setTimeout(() => {
              const active = document.activeElement;
              const listbox = document.querySelector('[role="listbox"]');
              if (!listbox?.contains(active)) {
                setFocused(false);
              }
            }, 0);
          }}
          onFocus={() => setFocused(true)}
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {focused && search.length > 0 && (
          <Dropdown role="listbox">
            {filteredUsers.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No results found
              </styled.p>
            )}

            {filteredUsers.map((user) => {
              return (
                <Option
                  key={user.driverId}
                  type="button"
                  onClick={() => {
                    onChange([...value, user.driverId]);
                    setSearch("");
                  }}
                >
                  {user.firstName} {user.lastName}
                </Option>
              );
            })}
          </Dropdown>
        )}
      </Box>
    </Box>
  );
};

const LeaderboardsEditPage = () => {
  const fetcher = useFetcher();
  const { leaderboard } = useLoaderData<typeof loader>();

  const formik = useFormik({
    validationSchema,
    initialValues: {
      name: leaderboard.name,
      type: leaderboard.type,
      drivers: leaderboard.drivers.map((driver) => driver.driverId),
      tournaments: leaderboard.tournaments.map(
        (tournament) => tournament.tournamentId,
      ),
    },
    async onSubmit(values) {
      await fetcher.submit(values, {
        method: "POST",
      });
    },
  });

  return (
    <Container maxW={1100} px={2} py={4}>
      <Box maxW="580px" mx="auto">
        <styled.h2>Edit Leaderboard Details</styled.h2>
        <Box p={6} mt={2} rounded="2xl" borderWidth={1} borderColor="gray.800">
          <form onSubmit={formik.handleSubmit}>
            <VStack gap={4} alignItems="stretch">
              <FormControl error={formik.errors.name}>
                <Label>Leaderboard Name</Label>
                <Input
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl>
                <Label>Leaderboard Type</Label>
                <TabGroup>
                  {Object.values(LeaderboardType).map((item) => {
                    return (
                      <TabButton
                        key={item}
                        type="button"
                        isActive={formik.values.type === item}
                        onClick={() => formik.setFieldValue("type", item)}
                      >
                        {capitalCase(item)}
                      </TabButton>
                    );
                  })}
                </TabGroup>
              </FormControl>

              {formik.values.type === LeaderboardType.TOURNAMENTS && (
                <FormControl>
                  <Label>Tournaments</Label>
                  <TournamentsForm
                    value={formik.values.tournaments}
                    onChange={(value) =>
                      formik.setFieldValue("tournaments", value)
                    }
                  />
                </FormControl>
              )}

              {formik.values.type === LeaderboardType.DRIVERS && (
                <FormControl>
                  <Label>Drivers</Label>
                  <PeopleForm
                    value={formik.values.drivers}
                    onChange={(value) => formik.setFieldValue("drivers", value)}
                  />
                </FormControl>
              )}

              <Button
                type="submit"
                isLoading={formik.isSubmitting}
                disabled={formik.isSubmitting}
              >
                Save Changes
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
    </Container>
  );
};

export default LeaderboardsEditPage;
