import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { Advert } from "~/components/Advert";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
  };
}

export const loader = async () => {
  const events = await prisma.events.findMany({
    where: {
      id: {
        in: [
          "f289ed4a-cc0e-447b-a648-475783c2a759",
          "c2cc5b29-46f1-45fb-9ef7-a9f5d04b9e67",
          "c3599b9c-0aa6-4786-8051-812cfd14f9d9",
          "74adce46-1b95-4511-8ddf-a27ea74632c3",
          "be9fcdb2-1e9f-4f1c-925c-f07357b16a06",
          "2c75929b-83c4-458f-a430-e3f6c79a8d83",
          "3fda1916-5a3e-4588-8dfb-c96298c47dd1",
          "9462af46-cfe9-42ec-88cb-593fa19e0fb5",
        ],
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return events;
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

        <styled.h1 srOnly>2024 Schedule</styled.h1>

        <Box overflow="hidden" rounded="lg" mb={4}>
          <styled.img src="/2024-cover.jpg" w="full" />
        </Box>

        <Box overflow="hidden">
          <Flex flexWrap="wrap" ml={-4} mt={-4}>
            {events.map((event) => {
              const startDate = new Date(event.startDate);

              return (
                <Flex
                  key={event.id}
                  pt={4}
                  pl={4}
                  w={{ base: "50%", lg: "33.3333%" }}
                >
                  <styled.article
                    bgColor="gray.900"
                    overflow="hidden"
                    rounded="lg"
                    w="full"
                  >
                    <Box borderBottomRadius="lg" overflow="hidden">
                      <styled.img src={`/2024/${event.id}.jpg`} />
                    </Box>

                    <Box p={4}>
                      <styled.h1
                        fontWeight="bold"
                        textWrap="balance"
                        fontSize="lg"
                      >
                        {event.name}
                      </styled.h1>

                      <styled.p color="gray.400" fontSize="sm" mb={2}>
                        {format(startDate, "do MMMM")} from{" "}
                        {format(startDate, "HH:mm")} -{" "}
                        {format(new Date(event.endDate), "HH:mm")}
                      </styled.p>

                      <LinkButton
                        to={`/events/${event.id}`}
                        variant="secondary"
                        size="sm"
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

      <Advert />
    </Container>
  );
};

export default Page;
