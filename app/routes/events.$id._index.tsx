import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import {
  format,
  formatDuration,
  intervalToDuration,
  isAfter,
  isBefore,
} from "date-fns";
import { useMemo } from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiExternalLinkLine,
  RiDownloadLine,
  RiCalendarLine,
} from "react-icons/ri";
import { z } from "zod";
import pluralize from "pluralize";
import { Button, LinkButton } from "~/components/Button";
import { styled, Box, Container, Flex, Divider } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import invariant from "~/utils/invariant";
import { SignedIn, SignedOut, useClerk } from "@clerk/react-router";
import { getEventDate } from "~/utils/getEventDate";
import { getAuth } from "~/utils/getAuth.server";
import { Markdown } from "~/components/Markdown";
import { clearPendingTickets } from "~/utils/clearPendingTickets.server";
import { getEvent } from "~/utils/getEvent.server";
import { EventTicketButton } from "~/components/EventTicketButton";
import { isEventSoldOut } from "~/utils/isEventSoldOut";
import type { GetUserEventTicket } from "~/utils/getUserEventTicket.server";
import { getUserEventTicket } from "~/utils/getUserEventTicket.server";
import { google } from "calendar-link";
import type { Route } from "./+types/events.$id._index";

export const meta: Route.MetaFunction = ({ data }) => {
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
  const { userId } = await getAuth(args);

  const event = await getEvent(id, userId ?? undefined);

  if (!event) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  await clearPendingTickets(event.id);

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

  const isSoldOut = isEventSoldOut(event);

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
  const startDate = useMemo(() => new Date(event.startDate), [event]);
  const endDate = useMemo(() => new Date(event.endDate), [event]);
  const clerk = useClerk();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isTrackOwner = (event.eventTrack?.Owners.length ?? 0) > 0;

  const CalendarLink = () => {
    return (
      <LinkButton
        to={google({
          title: event.name,
          description: event.description ?? undefined,
          start: startDate,
          end: endDate,
          location: event.eventTrack?.name,
        })}
        target="_blank"
        variant="outline"
      >
        Add to Calendar <RiCalendarLine />
      </LinkButton>
    );
  };

  return (
    <Container maxW={1100} px={2} pb={6} mt={4}>
      <Flex
        flexDir={{ base: "column", md: "row" }}
        gap={4}
        justifyContent={event.eventTrack ? "flex-start" : "center"}
      >
        <Box
          borderWidth={1}
          borderColor="gray.800"
          rounded="xl"
          overflow="hidden"
          flex={1}
          maxW={event.eventTrack ? 800 : 1000}
          mx={event.eventTrack ? 0 : "auto"}
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
                fontWeight="extrabold"
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

            <styled.h1 fontSize="3xl" fontWeight="extrabold">
              {event.name}
            </styled.h1>

            {event.description && (
              <Box mb={4}>
                <Markdown>{event.description}</Markdown>
              </Box>
            )}

            {!event.enableTicketing && (
              <>
                <styled.p color="gray.500" fontSize="sm">
                  Duration:{" "}
                  {formatDuration(
                    intervalToDuration({
                      start: startDate,
                      end: endDate,
                    }),
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
                              response.user.firstName +
                              " " +
                              response.user.lastName
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
                  You are currently{" "}
                  {isAttending ? "interested" : "not interested"}
                  in this event
                </styled.span>

                {!isAttending && (
                  <styled.span fontSize="sm" color="gray.500" display="block">
                    Let the host know you're interested in this event by
                    responding below
                  </styled.span>
                )}
              </>
            )}

            <Flex gap={2} pt={2} flexDir={{ base: "column", md: "row" }}>
              {!event.enableTicketing && (
                <>
                  <SignedIn>
                    <Form method="post">
                      <Button
                        type="submit"
                        value="submit"
                        variant="secondary"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        {isAttending && "Not "}Interested{" "}
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
                </>
              )}

              {event.link && (
                <LinkButton
                  to={event.link}
                  target={
                    event.link.includes("/tournaments") ? undefined : "_blank"
                  }
                  variant="outline"
                >
                  {event.link.includes("/tournaments")
                    ? "View Results"
                    : "More Info"}
                  <RiExternalLinkLine />
                </LinkButton>
              )}

              <CalendarLink />
            </Flex>

            {event.enableTicketing &&
              isBefore(new Date(), new Date(event.startDate)) && (
                <>
                  <Divider mt={4} borderColor="gray.800" />
                  <Box pt={4}>
                    <EventTicketButton
                      event={{
                        ...event,
                        startDate,
                        endDate,
                        ticketReleaseDate: event.ticketReleaseDate
                          ? new Date(event.ticketReleaseDate)
                          : null,
                      }}
                      ticket={
                        ticket
                          ? {
                              ...ticket,
                              event: {
                                ...ticket.event,
                                startDate,
                                endDate,
                              },
                            }
                          : null
                      }
                      isSoldOut={isSoldOut}
                    />
                  </Box>
                </>
              )}

            {isAfter(new Date(), new Date(event.endDate)) && (
              <>
                <Divider mt={4} borderColor="gray.800" />
                <styled.p
                  color="brand.500"
                  fontWeight="semibold"
                  py={2}
                  textAlign="center"
                >
                  This event has ended.
                </styled.p>
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

              <styled.h2
                fontSize="xl"
                fontWeight="extrabold"
                textWrap="balance"
              >
                {event.eventTrack.name}
              </styled.h2>

              <styled.span fontSize="sm" fontWeight="semibold" color="gray.300">
                {event.eventTrack._count.events} past events
              </styled.span>

              {event.eventTrack.address && (
                <styled.p
                  color="gray.500"
                  fontSize="sm"
                  textWrap="balance"
                  mt={2}
                  whiteSpace="pre-line"
                >
                  {event.eventTrack.address}
                </styled.p>
              )}

              <Flex w="full" flexDir="column" gap={2} mt={5}>
                <LinkButton
                  w="full"
                  to={`/tracks/${event.eventTrack.slug}`}
                  variant="secondary"
                >
                  View Profile
                </LinkButton>

                {isTrackOwner && event.enableTicketing && (
                  <>
                    <LinkButton
                      w="full"
                      to={`/events/${event.id}/export`}
                      variant="outline"
                      download={`${event.name} Tickets ${format(
                        new Date(),
                        "dd-MM-yyyy",
                      )}.csv`}
                      target="_blank"
                    >
                      Download Attendees <RiDownloadLine />
                    </LinkButton>

                    <LinkButton
                      w="full"
                      to={`/events/${event.id}/create-tournament`}
                      variant="outline"
                    >
                      Create Tournament
                    </LinkButton>
                  </>
                )}

                {isTrackOwner && (
                  <LinkButton
                    w="full"
                    variant="outline"
                    to={`/events/${event.id}/delete`}
                    color="brand.500"
                  >
                    Delete Event
                  </LinkButton>
                )}
              </Flex>
            </Flex>
          </styled.article>
        )}
      </Flex>
    </Container>
  );
};

export default Page;
