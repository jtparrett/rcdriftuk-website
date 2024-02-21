import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import {
  format,
  formatDuration,
  intervalToDuration,
  isThisWeek,
  startOfDay,
} from "date-fns";
import { useMemo } from "react";
import { RiCheckboxCircleFill, RiCloseCircleFill } from "react-icons/ri";
import { z } from "zod";
import pluralize from "pluralize";
import { Button, LinkButton } from "~/components/Button";
import { styled, Box, Container, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { getAuth } from "@clerk/remix/ssr.server";
import invariant from "tiny-invariant";
import { SignedIn, SignedOut, useClerk } from "@clerk/remix";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `RC Drift UK | Events | ${data?.event.name}` },
    { name: "description", content: data?.event.description },
    {
      property: "og:image",
      content: `https://rcdrift.uk/${data?.event.eventTrack?.image}`,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const event = await prisma.events.findFirst({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          responses: true,
        },
      },
      responses: {
        where: {
          userId: userId ?? undefined,
        },
      },
      eventTrack: {
        include: {
          _count: {
            select: {
              events: {
                where: {
                  endDate: {
                    lte: startOfDay(new Date()),
                  },
                },
              },
            },
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

  const isAttending = event.responses.length > 0;

  return { event, isAttending };
};

export const action = async (args: ActionFunctionArgs) => {
  const eventId = z.string().parse(args.params.id);
  const body = await args.request.formData();
  const isAttending = body.get("attending") === "true";
  const { userId } = await getAuth(args);

  invariant(userId, "User is not signed in");

  if (isAttending) {
    await prisma.eventResponses.create({
      data: {
        userId,
        eventId,
      },
    });
  } else {
    const response = await prisma.eventResponses.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    invariant(response, "This user has not responded to this event");

    await prisma.eventResponses.delete({
      where: {
        id: response.id,
      },
    });
  }

  return null;
};

const Page = () => {
  const { event, isAttending } = useLoaderData<typeof loader>();
  const startDate = useMemo(() => new Date(event.startDate), [event]);
  const endDate = useMemo(() => new Date(event.endDate), [event]);

  const clerk = useClerk();

  return (
    <Container maxW={1100} px={2} py={12}>
      <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
        <Box
          borderWidth={1}
          borderColor="gray.800"
          rounded="xl"
          p={{ base: 8, md: 12 }}
          flex={1}
        >
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
            {isThisWeek(startDate)
              ? format(startDate, "eeee")
              : format(startDate, "do MMMM")}{" "}
            from {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
          </styled.p>

          <styled.h1 fontSize="3xl" fontWeight="black">
            {event.name}
          </styled.h1>

          {event.description && (
            <styled.p
              mb={4}
              color="gray.500"
              fontSize="sm"
              whiteSpace="pre-line"
            >
              {event.description}
            </styled.p>
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

          <styled.span fontWeight="semibold" mt={4} display="block">
            You are currently {isAttending ? "going" : "not going"} to this
            event
          </styled.span>

          {!isAttending && (
            <styled.span fontSize="sm" color="gray.500" display="block">
              Let the host know you're interested in this event by responding
              below:
            </styled.span>
          )}

          <Flex gap={2} pt={2}>
            <SignedIn>
              <Form method="post">
                <input
                  type="hidden"
                  value={(!isAttending).toString()}
                  name="attending"
                />
                <Button type="submit">
                  I'm {isAttending && "Not "}Going{" "}
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
                I'm Going <RiCheckboxCircleFill />
              </Button>
            </SignedOut>
            <LinkButton to={event.link} target="_blank" variant="secondary">
              More Info
            </LinkButton>
          </Flex>
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

              <styled.h2 fontSize="xl" fontWeight="bold" textWrap="balance">
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
                to={`/calendar/${event.eventTrack.slug}`}
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
