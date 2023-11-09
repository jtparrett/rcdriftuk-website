import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { client } from "~/utils/contentful.server";
import { eventSchema } from "~/utils/contentfulSchema";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document } from "@contentful/rich-text-types";
import {
  BsCalendar,
  BsFacebook,
  BsTicketPerforatedFill,
} from "react-icons/bs/index.js";
import { format } from "date-fns";
import { LinkButton } from "~/components/Button";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = z.string().parse(params.slug);

  const entries = await client.getEntries({
    content_type: "event",
    "fields.slug": slug,
    limit: 1,
  });

  invariant(entries.items?.[0]);

  return eventSchema.parse(entries.items[0]);
};

const Page = () => {
  const event = useLoaderData<typeof loader>();

  const Content = documentToReactComponents(event.fields.body as Document, {
    renderNode: {
      [BLOCKS.HEADING_1]: (_node, children) => (
        <styled.h1
          fontSize={{ base: "3xl", md: "4xl" }}
          lineHeight={1.1}
          fontWeight="bold"
        >
          {children}
        </styled.h1>
      ),
    },
  });
  const startDate = new Date(event.fields.startDate);

  return (
    <Container>
      <styled.main>
        <Breadcrumbs
          paths={[
            {
              to: "/2024/schedule",
              title: "Schedule",
            },
            {
              to: `/2024/schedule/${event.fields.slug}`,
              title: event.fields.title,
            },
          ]}
        />

        <Box overflow="hidden" rounded="xl">
          <styled.img src={event.fields.cover.fields.file.url} />
        </Box>

        <Flex flexDir="column" gap={4} maxW={800} pt={4}>
          <Box>
            <Flex alignItems="start" gap={2}>
              <styled.span color="gray.400" mt={1}>
                <BsCalendar />
              </styled.span>
              <styled.p>
                {format(startDate, "MMMM do")}
                {event.fields.endDate &&
                  format(new Date(event.fields.endDate), "-do")}
                {format(startDate, ", Y")}
              </styled.p>
            </Flex>
          </Box>

          {Content}

          <Flex gap={4} flexDir={{ base: "column", md: "row" }} pb={8}>
            {event.fields.ticketUrl && (
              <LinkButton
                fontSize="md"
                to={event.fields.ticketUrl}
                target="_blank"
              >
                Buy Tickets <BsTicketPerforatedFill />
              </LinkButton>
            )}
            {event.fields.facebookEventUrl && (
              <LinkButton
                fontSize="md"
                variant="outline"
                to={event.fields.facebookEventUrl}
                target="_blank"
              >
                Facebook Event <BsFacebook />
              </LinkButton>
            )}
          </Flex>
        </Flex>
      </styled.main>
    </Container>
  );
};

export default Page;
