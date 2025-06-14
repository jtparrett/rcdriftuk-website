import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, useLoaderData } from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Select } from "~/components/Select";
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
  const formData = await args.request.formData();
  const deleteType = z
    .enum(["single", "recurring"])
    .parse(formData.get("deleteType"));

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
    include: {
      eventTrack: true,
    },
  });

  if (!event) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  if (deleteType === "single") {
    await prisma.eventResponses.deleteMany({
      where: {
        eventId: id,
      },
    });

    await prisma.events.delete({
      where: {
        id,
      },
    });
  } else if (deleteType === "recurring") {
    await prisma.eventResponses.deleteMany({
      where: {
        event: {
          createdAt: {
            equals: event.createdAt,
          },
          trackId: event.trackId,
        },
      },
    });

    // Delete all recurring instances of this event
    await prisma.events.deleteMany({
      where: {
        trackId: event.trackId,
        createdAt: {
          equals: event.createdAt,
        },
      },
    });
  }

  if (event.eventTrack) {
    return redirect(`/tracks/${event.eventTrack.slug}`);
  }

  return redirect("/");
};

export const EventDeletePage = () => {
  const event = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={10}>
      <Box bg="gray.900" p={8} borderRadius="2xl" mx="auto" maxW={500}>
        <styled.h1 fontWeight="extrabold" fontSize="2xl">
          Delete "{event.name}"
        </styled.h1>
        <Form method="delete">
          <Select my={4} name="deleteType">
            <option value="single">Delete only this event</option>
            <option value="recurring">
              Delete this event and all recurring instances of this event
            </option>
          </Select>
          <Flex gap={2} justifyContent="flex-end">
            <LinkButton to={`/events/${event.id}`} variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit">Delete Event</Button>
          </Flex>
        </Form>
      </Box>
    </Container>
  );
};

export default EventDeletePage;
