import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { z } from "zod";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { client } from "~/utils/contentful.server";
import { eventSchema } from "~/utils/contentfulSchema";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
  };
}

export const loader = async () => {
  const events = await client.getEntries({
    content_type: "event",
    order: ["sys.createdAt"],
  });

  return z.array(eventSchema).parse(events.items);
};

const Page = () => {
  const events = useLoaderData<typeof loader>();

  return (
    <Container px={2} maxW={1100}>
      <styled.main>
        <Breadcrumbs
          paths={[
            {
              to: "/2024/schedule",
              title: "Schedule",
            },
          ]}
        />

        <styled.h1
          fontSize="5xl"
          fontFamily="heading"
          lineHeight={1}
          fontStyle="italic"
        >
          2024 Schedule
        </styled.h1>

        <Box maxW={200} h="4px" bgColor="brand.500" mt={2} mb={4} />

        <Box overflow="hidden" rounded="lg" mb={4}>
          <styled.img src="/2024-cover.jpg" w="full" />
        </Box>

        <Box overflow="hidden">
          <Flex flexWrap="wrap" ml={-4} mt={-4}>
            {events.map((event) => {
              const startDate = new Date(event.fields.startDate);

              return (
                <Flex
                  key={event.sys.id}
                  pt={4}
                  pl={4}
                  w={{ base: "50%", lg: "25%" }}
                >
                  <styled.article
                    bgColor="gray.900"
                    overflow="hidden"
                    rounded="lg"
                  >
                    <styled.img src={event.fields.card.fields.file.url} />
                    <Box p={4}>
                      <styled.h1
                        fontSize="2xl"
                        fontFamily="heading"
                        lineHeight={1}
                      >
                        {event.fields.title}{" "}
                        <styled.span color="brand.500">//</styled.span>{" "}
                        {event.fields.subTitle}
                      </styled.h1>

                      <styled.p color="gray.400">
                        {format(startDate, "MMM do")}
                        {event.fields.endDate &&
                          format(new Date(event.fields.endDate), "-do")}
                        {format(startDate, ", Y")}
                      </styled.p>

                      <LinkButton
                        to={`/2024/schedule/${event.fields.slug}`}
                        w="full"
                        mt={4}
                        py={1}
                      >
                        More Info
                      </LinkButton>
                    </Box>
                  </styled.article>
                </Flex>
              );
            })}
          </Flex>
        </Box>
      </styled.main>
    </Container>
  );
};

export default Page;
