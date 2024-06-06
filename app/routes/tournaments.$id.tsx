import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  invariant(userId);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      drivers: true,
      event: {
        include: {
          eventTrack: {
            include: {
              owners: {
                where: {
                  id: userId,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament || (tournament.event.eventTrack?.owners.length ?? 0) <= 0) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return tournament;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  invariant(userId);

  const formData = await args.request.formData();
  const drivers = z.string().parse(formData.get("drivers"));

  await prisma.tournamentDrivers.createMany({
    data: drivers
      .replaceAll(", ", ",")
      .split(",")
      .map((name) => {
        return {
          name,
          tournamentId: id,
        };
      }),
  });

  return null;
};

const TournamentPage = () => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <Container pb={12} px={2} pt={2} maxW={1100}>
      <styled.h1 fontSize="4xl" fontWeight="extrabold">
        {tournament.event.name}
      </styled.h1>

      <Box maxW={500}>
        <Box p={4} borderWidth={1} rounded="xl" borderColor="gray.800" mb={6}>
          <styled.h2 fontWeight="semibold" fontSize="lg">
            Drivers
          </styled.h2>
          <styled.table w="full">
            <styled.tbody>
              {tournament.drivers.map((driver, i) => {
                return (
                  <styled.tr key={driver.id}>
                    <styled.td>{i + 1}</styled.td>
                    <styled.td>{driver.name}</styled.td>
                  </styled.tr>
                );
              })}
            </styled.tbody>
          </styled.table>
        </Box>

        <Form method="post" key={new Date().getTime()}>
          <styled.label mb={4} fontWeight="semibold">
            Add Drivers
          </styled.label>
          <styled.textarea
            w="full"
            display="block"
            minH={100}
            borderWidth={1}
            p={4}
            borderColor="gray.800"
            rounded="lg"
            placeholder="List your tournament drivers seperated by a comma (,)"
            mb={2}
            name="drivers"
          ></styled.textarea>
          <Flex>
            <Spacer />
            <Button size="xs" flex="none" type="submit">
              Add Drivers
            </Button>
          </Flex>
        </Form>
      </Box>
    </Container>
  );
};

export default TournamentPage;
