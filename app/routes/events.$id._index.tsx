import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, redirect, useLoaderData } from "@remix-run/react";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { useMemo } from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiExternalLinkLine,
} from "react-icons/ri";
import { z } from "zod";
import pluralize from "pluralize";
import { Button, LinkButton } from "~/components/Button";
import { styled, Box, Container, Flex, Divider } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import invariant from "tiny-invariant";
import { SignedIn, SignedOut, useClerk } from "@clerk/remix";
import { getEventDate } from "~/utils/getEventDate";
import { dateWithoutTimezone } from "~/utils/dateWithoutTimezone";
import { getAuth } from "~/utils/getAuth.server";
import { Markdown } from "~/components/Markdown";
import { clearPendingTickets } from "~/utils/clearPendingTickets.server";
import { getEvent } from "~/utils/getEvent.server";
import { EventTicketButton } from "~/components/EventTicketButton";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";
import { getUserEventTicket } from "~/utils/getUserEventTicket.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `RC Drift UK | Events | ${data?.event.name}` },
    { name: "description", content: data?.event.description },
    {
      property: "og:image",
      content:
        data?.event.cover ??
        `https://rcdrift.uk/${data?.event.eventTrack?.image}`,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);

  const event = await getEvent(id);

  if (!event) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  await clearPendingTickets(event.id);

  const { userId } = await getAuth(args);
  const isSoldOut = isEventSoldOut(event);

  let isAttending = false;
  let ticket: GetUserEventTicket = null;

  if (userId) {
    const userEventResponse = await prisma.eventResponses.findFirst({
      where: {
        userId,
        eventId: id,
      },
    });

    isAttending = !!userEventResponse;

    ticket = await getUserEventTicket(id, userId);
  }

  return {
    event,
    isAttending,
    ticket,
    isSoldOut,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId, "User is not signed in");

  const eventId = z.string().parse(args.params.id);
  const userEventResponse = await prisma.eventResponses.findFirst({
    where: {
      userId,
      eventId,
    },
  });

  if (userEventResponse) {
    await prisma.eventResponses.delete({
      where: {
        id: userEventResponse.id,
      },
    });
  } else {
    await prisma.eventResponses.create({
      data: {
        userId,
        eventId,
      },
    });
  }

  return redirect(`/events/${eventId}`);
};

const Page = () => {
  const { event, isAttending, ticket, isSoldOut } =
    useLoaderData<typeof loader>();
  const startDate = useMemo(
    () => dateWithoutTimezone(event.startDate),
    [event]
  );
  const endDate = useMemo(() => dateWithoutTimezone(event.endDate), [event]);
  const clerk = useClerk();

  return (
    <Container maxW={1100} px={2} py={12}>
      <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
        <Box
          borderWidth={1}
          borderColor="gray.800"
          rounded="xl"
          overflow="hidden"
          flex={1}
          maxW={800}
        >
          {event.cover && (
            <styled.img src={event.cover} alt={event.name} w="full" />
          )}

          <Box p={{ base: 8, md: 12 }}>
            <Box
              borderWidth={1}
              borderColor="brand.500"
              rounded="md"
              overflow="hidden"
              textAlign="center"
              display="inline-block"
            >
              <Box h={3} bgColor="brand.500" />
              <styled.span
                fontWeight="black"
                fontSize="3xl"
                px={3}
                py={1}
                display="block"
              >
                {format(startDate, "dd")}
              </styled.span>
            </Box>

            <styled.p color="brand.500" fontWeight="bold">
              {getEventDate(startDate, endDate)}
            </styled.p>

            <styled.h1 fontSize="3xl" fontWeight="black">
              {event.name}
            </styled.h1>

            {event.description && (
              <Box mb={4}>
                <Markdown>{event.description}</Markdown>
              </Box>
            )}

            <styled.p color="gray.500" fontSize="sm">
              Duration:{" "}
              {formatDuration(
                intervalToDuration({
                  start: startDate,
                  end: endDate,
                })
              )}
            </styled.p>
            <styled.p fontSize="sm" color="gray.500">
              {event._count.responses}{" "}
              {pluralize("people", event._count.responses)} responded
            </styled.p>

            {event._count.responses > 0 && (
              <Flex mt={1} flexWrap="wrap">
                {event.responses.map((response) => {
                  if (!response.user) return null;

                  return (
                    <Box
                      key={response.id}
                      overflow="hidden"
                      rounded="full"
                      w="40px"
                      h="40px"
                      mr={-3}
                      bgColor="gray.400"
                    >
                      <styled.img
                        title={
                          response.user.firstName + " " + response.user.lastName
                        }
                        src={response.user.image ?? ""}
                        alt={`${response.user.firstName ?? ""} ${
                          response.user.lastName ?? ""
                        }`}
                      />
                    </Box>
                  );
                })}
              </Flex>
            )}

            <styled.span fontWeight="semibold" mt={4} display="block">
              You are currently {isAttending ? "interested" : "not interested"}
              in this event
            </styled.span>

            {!isAttending && (
              <styled.span fontSize="sm" color="gray.500" display="block">
                Let the host know you're interested in this event by responding
                below
              </styled.span>
            )}

            <Flex gap={2} pt={2}>
              <SignedIn>
                <Form method="post">
                  <Button type="submit" value="submit" variant="secondary">
                    I'm {isAttending && "Not "}Interested{" "}
                    {isAttending ? (
                      <RiCloseCircleFill />
                    ) : (
                      <RiCheckboxCircleFill />
                    )}
                  </Button>
                </Form>
              </SignedIn>
              <SignedOut>
                <Button
                  onClick={() =>
                    clerk.openSignIn({
                      redirectUrl: `/events/${event.id}`,
                    })
                  }
                >
                  I'm Interested <RiCheckboxCircleFill />
                </Button>
              </SignedOut>

              {event.link && (
                <LinkButton to={event.link} target="_blank" variant="outline">
                  More Info <RiExternalLinkLine />
                </LinkButton>
              )}
            </Flex>

            {event.enableTicketing && (
              <>
                <Divider mt={4} borderColor="gray.800" />
                <Box pt={4}>
                  <EventTicketButton
                    event={{
                      ...event,
                      startDate,
                      endDate,
                      ticketReleaseDate: event.ticketReleaseDate
                        ? dateWithoutTimezone(event.ticketReleaseDate)
                        : null,
                    }}
                    ticket={ticket}
                    isSoldOut={isSoldOut}
                  />
                </Box>
              </>
            )}
          </Box>
        </Box>

        {event.eventTrack && (
          <styled.article
            borderColor="gray.800"
            rounded="xl"
            borderWidth={1}
            w={{ md: 400 }}
            textAlign="center"
            overflow="hidden"
          >
            <Box py={2} bgColor="gray.800">
              <styled.span fontWeight="semibold">Meet your host</styled.span>
            </Box>

            <Flex p={8} flexDir="column" alignItems="center">
              <Box
                w="140px"
                h="140px"
                mb={2}
                rounded="full"
                overflow="hidden"
                borderWidth={2}
                borderColor="gray.500"
              >
                <styled.img
                  w="full"
                  h="full"
                  objectFit="cover"
                  src={event.eventTrack.image}
                  alt={event.eventTrack.name}
                />
              </Box>

              <styled.h2 fontSize="xl" fontWeight="black" textWrap="balance">
                {event.eventTrack.name}
              </styled.h2>

              <styled.span fontSize="sm" fontWeight="semibold" color="gray.300">
                {event.eventTrack._count.events} past events
              </styled.span>

              {event.eventTrack.description && (
                <styled.p
                  color="gray.500"
                  fontSize="sm"
                  textWrap="balance"
                  mt={2}
                  whiteSpace="pre-line"
                >
                  {event.eventTrack.description}
                </styled.p>
              )}

              <LinkButton
                mt={5}
                w="full"
                to={`/tracks/${event.eventTrack.slug}`}
                variant="secondary"
              >
                See All Events
              </LinkButton>
            </Flex>
          </styled.article>
        )}
      </Flex>
    </Container>
  );
};

export default Page;
