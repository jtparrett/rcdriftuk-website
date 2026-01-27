import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, Link, useLoaderData, useParams } from "react-router";
import {
  add,
  differenceInWeeks,
  endOfYear,
  format,
  parseISO,
  startOfHour,
  sub,
} from "date-fns";
import { useState } from "react";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { DatePicker } from "~/components/DatePicker";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { MoneyInput } from "~/components/MoneyInput";
import { Select } from "~/components/Select";
import { Textarea } from "~/components/Textarea";
import { TimePicker } from "~/components/TimePicker";
import { styled, Box, Flex, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { TabButton, TabGroup } from "~/components/Tab";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { userId } = await getAuth(args);
  const slug = z.string().parse(params.slug);

  if (!userId) {
    throw redirect("/");
  }

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
    select: {
      stripeAccountEnabled: true,
    },
  });

  if (!track) {
    throw redirect("/");
  }

  return { stripeAccountEnabled: track.stripeAccountEnabled };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { userId } = await getAuth(args);
  const body = await request.formData();
  const slug = z.string().parse(params.slug);

  invariant(userId, "User not found");

  const name = body.get("name");
  const startDate = body.get("startDate");
  const endDate = body.get("endDate");
  const link = body.get("link");
  const repeatWeeks = body.get("repeatWeeks");
  const description = body.get("description");
  const enableTicketing = body.get("enableTicketing");
  const ticketCapacity = body.get("ticketCapacity");
  const ticketReleaseDate = body.get("ticketReleaseDate");
  const earlyAccessCode = body.get("earlyAccessCode");
  const ticketPrice = body.get("ticketPrice");
  const rated = body.get("rated");

  const data = z
    .object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      link: z.string().optional(),
      repeatWeeks: z.coerce.number(),
      description: z.string().optional(),
      enableTicketing: z.string().optional(),
      ticketCapacity: z.coerce.number().nullable(),
      ticketReleaseDate: z.coerce.date().nullable(),
      earlyAccessCode: z.string().nullable(),
      ticketPrice: z.coerce.number().nullable(),
      rated: z.string().optional(),
    })
    .parse({
      name,
      startDate,
      endDate,
      link,
      repeatWeeks,
      description,
      enableTicketing,
      ticketCapacity,
      ticketReleaseDate,
      earlyAccessCode,
      ticketPrice,
      rated,
    });

  const startDateNoZone = parseISO(data.startDate);
  const endDateNoZone = parseISO(data.endDate);

  const track = await prisma.tracks.findFirstOrThrow({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
  });

  const diff = differenceInWeeks(endOfYear(startDateNoZone), startDateNoZone);
  const arrayLength = data.repeatWeeks === 0 ? 1 : diff / data.repeatWeeks + 1;

  const [firstEvent] = await prisma.events.createManyAndReturn({
    data: Array.from({ length: arrayLength }).map((_, i) => {
      const repeatStartDate = add(startDateNoZone, {
        weeks: i * data.repeatWeeks,
      });
      const repeatEndDate = add(endDateNoZone, { weeks: i * data.repeatWeeks });

      return {
        name: data.name,
        trackId: track.id,
        link: data.link,
        startDate: repeatStartDate,
        endDate: repeatEndDate,
        description: data.description,
        enableTicketing: data.enableTicketing === "true",
        ticketCapacity: data.ticketCapacity,
        ticketReleaseDate: data.ticketReleaseDate
          ? data.ticketReleaseDate
          : null,
        earlyAccessCode: data.earlyAccessCode,
        ticketPrice: data.ticketPrice,
        rated: data.rated === "true",
      };
    }),
  });

  return redirect(`/events/${firstEvent.id}`);
};

const CalendarNewPage = () => {
  const { stripeAccountEnabled } = useLoaderData<typeof loader>();
  const params = useParams();
  const [startDate, setStartDate] = useState(
    startOfHour(add(new Date(), { days: 1 })),
  );
  const [endDate, setEndDate] = useState(
    startOfHour(add(new Date(), { days: 1 })),
  );
  const [enableTicketing, setEnableTicketing] = useState(false);
  const [ticketReleaseDate, setTicketReleaseDate] = useState(new Date());
  const [rated, setRated] = useState(false);

  return (
    <Container maxW={1100} px={4} py={8}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        Create an event
      </styled.h1>
      <Form method="post">
        <Flex flexDir="column" maxW={500} gap={4}>
          <Box>
            <Label>Date</Label>
            <DatePicker
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setEndDate(date);
              }}
            />
          </Box>

          <Box flex={1}>
            <Label>Start Time</Label>
            <Input
              type="hidden"
              name="startDate"
              required
              value={format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")}
            />
            <TimePicker
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
              }}
            />
          </Box>

          <Box flex={1}>
            <Label>End Time</Label>
            <Input
              type="hidden"
              name="endDate"
              required
              value={format(endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")}
            />
            <TimePicker value={endDate} onChange={(date) => setEndDate(date)} />
          </Box>

          <Box>
            <Label>Repeat Event</Label>
            <Select name="repeatWeeks">
              <option value="0">Never</option>
              <option value="1">Weekly</option>
              <option value="2">Bi-Weekly</option>
            </Select>
          </Box>

          <Box>
            <Label>Name</Label>
            <Input name="name" required />
          </Box>

          <Box>
            <Label>Link (https://)</Label>
            <Input name="link" />
          </Box>

          <Box>
            <Label>Description</Label>
            <Textarea name="description" />
          </Box>

          <Box>
            <Label>Is this a rated tournament?</Label>
            <input
              type="hidden"
              name="rated"
              value={rated ? "true" : "false"}
            />
            <TabGroup>
              <TabButton
                type="button"
                isActive={!rated}
                onClick={() => setRated(false)}
              >
                No
              </TabButton>
              <TabButton
                type="button"
                isActive={rated}
                onClick={() => setRated(true)}
              >
                Yes
              </TabButton>
            </TabGroup>
          </Box>

          {stripeAccountEnabled ? (
            <>
              <Box>
                <Label>Enable ticketing</Label>
                <input
                  type="hidden"
                  name="enableTicketing"
                  value={enableTicketing ? "true" : "false"}
                />

                <TabGroup>
                  <TabButton
                    type="button"
                    isActive={!enableTicketing}
                    onClick={() => setEnableTicketing(false)}
                  >
                    No
                  </TabButton>
                  <TabButton
                    type="button"
                    isActive={enableTicketing}
                    onClick={() => setEnableTicketing(true)}
                  >
                    Yes
                  </TabButton>
                </TabGroup>
              </Box>

              {enableTicketing && (
                <>
                  <Box>
                    <Label>Ticket Capacity</Label>
                    <Input
                      name="ticketCapacity"
                      type="number"
                      defaultValue={0}
                      required
                    />
                  </Box>

                  <Box>
                    <Label>Ticket Price</Label>
                    <MoneyInput name="ticketPrice" required />
                  </Box>

                  <Box>
                    <Label>Ticket Release Date</Label>
                    <Input
                      name="ticketReleaseDate"
                      type="hidden"
                      required
                      value={ticketReleaseDate.toISOString()}
                    />
                    <DatePicker
                      value={ticketReleaseDate}
                      maxDate={sub(startDate, { days: 1 })}
                      onChange={(date) => setTicketReleaseDate(date)}
                    />
                  </Box>

                  <Box>
                    <Label>Ticket Release Time</Label>
                    <TimePicker
                      value={ticketReleaseDate}
                      onChange={(date) => setTicketReleaseDate(date)}
                    />
                  </Box>

                  <Box>
                    <Label>Early Access Code</Label>
                    <Input name="earlyAccessCode" required />
                  </Box>
                </>
              )}
            </>
          ) : (
            <Box
              bgColor="gray.800"
              borderRadius="lg"
              p={4}
              borderWidth={1}
              borderColor="gray.700"
            >
              <styled.p color="gray.400" fontSize="sm" mb={2}>
                To enable ticketing for events, you need to connect your Stripe
                account first.
              </styled.p>
              <Link
                to={`/edit/track/${params.slug}#payments`}
                style={{ color: "#60a5fa", fontSize: "14px" }}
              >
                Set up Stripe Connect in track settings
              </Link>
            </Box>
          )}

          <Button type="submit">Create Event</Button>
        </Flex>
      </Form>
    </Container>
  );
};

export default CalendarNewPage;
