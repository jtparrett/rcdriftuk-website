import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format, isThisWeek, startOfDay } from "date-fns";
import { useMemo } from "react";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { styled, Box, Container, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const event = await prisma.events.findFirst({
    where: {
      id,
    },
    include: {
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

  return event;
};

const Page = () => {
  const event = useLoaderData<typeof loader>();
  const startDate = useMemo(() => new Date(event.startDate), [event]);
  const endDate = useMemo(() => new Date(event.endDate), [event]);

  return (
    <Container maxW={1100} px={2} py={12}>
      <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
        <Box borderWidth={1} borderColor="gray.800" rounded="xl" p={8} flex={1}>
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

          <styled.span fontSize="sm" color="gray.500" mb={2} display="block">
            Let the host know you're interested in this event by responding
            below:
          </styled.span>
          <Flex gap={2}>
            <Button>
              I'm Going <RiCheckboxCircleFill />
            </Button>
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
