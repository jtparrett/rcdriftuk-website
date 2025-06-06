import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, useLoaderData } from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { id } = z.object({ id: z.string() }).parse(params);

  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const event = await prisma.events.findFirst({
    where: {
      id,
      eventTrack: {
        Owners: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!event) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return event;
};

export const action = async (args: ActionFunctionArgs) => {
  const { params } = args;
  const { id } = z.object({ id: z.string() }).parse(params);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  await prisma.events.delete({
    where: {
      id,
      eventTrack: {
        Owners: {
          some: {
            userId,
          },
        },
      },
    },
  });

  return redirect("/");
};

export const EventDeletePage = () => {
  const event = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={10}>
      <Box
        bg="gray.900"
        p={8}
        borderRadius="2xl"
        mx="auto"
        maxW={500}
        textAlign="center"
      >
        <styled.h1 fontWeight="extrabold" fontSize="2xl">
          Delete "{event.name}"
        </styled.h1>
        <Form method="delete">
          <styled.p mb={4}>
            Are you sure you want to delete this event?
          </styled.p>
          <Flex gap={2} justifyContent="center">
            <LinkButton to={`/events/${event.id}`} variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit">Yes, Delete this event</Button>
          </Flex>
        </Form>
      </Box>
    </Container>
  );
};

export default EventDeletePage;
