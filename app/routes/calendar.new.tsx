import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { add, differenceInWeeks, endOfYear, sub } from "date-fns";
import { useState } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { DatePicker } from "~/components/DatePicker";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { MoneyInput } from "~/components/MoneyInput";
import { Select } from "~/components/Select";
import { Textarea } from "~/components/Textarea";
import { TimePicker } from "~/components/TimePicker";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/");
  }

  const user = await prisma.users.findFirst({
    where: {
      id: userId,
    },
    include: {
      Tracks: {
        include: {
          track: true,
        },
      },
    },
  });

  if ((user?.Tracks.length ?? 0) <= 0) {
    throw redirect("/");
  }

  return user;
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { userId } = await getAuth(args);
  const body = await request.formData();

  invariant(userId);

  const trackId = body.get("trackId");
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

  const data = z
    .object({
      trackId: z.string(),
      name: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      link: z.string().optional(),
      repeatWeeks: z.coerce.number(),
      description: z.string().optional(),
      enableTicketing: z.string().optional(),
      ticketCapacity: z.coerce.number().nullable(),
      ticketReleaseDate: z.coerce.date().nullable(),
      earlyAccessCode: z.string().nullable(),
      ticketPrice: z.coerce.number().nullable(),
    })
    .parse({
      trackId,
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
    });

  // Ensure the user owns the track
  await prisma.users.findFirstOrThrow({
    where: {
      id: userId,
      Tracks: {
        some: {
          trackId: data.trackId,
        },
      },
    },
  });

  const diff = differenceInWeeks(endOfYear(data.startDate), data.startDate);
  const arrayLength = data.repeatWeeks === 0 ? 1 : diff / data.repeatWeeks + 1;

  await prisma.events.createMany({
    data: Array.from({ length: arrayLength }).map((_, i) => {
      const repeatStartDate = add(data.startDate, {
        weeks: i * data.repeatWeeks,
      });
      const repeatEndDate = add(data.endDate, { weeks: i * data.repeatWeeks });

      const utcStartDate = repeatStartDate;
      const utcEndDate = repeatEndDate;

      return {
        name: data.name,
        trackId: data.trackId,
        link: data.link,
        startDate: utcStartDate,
        endDate: utcEndDate,
        description: data.description,
        approved: true,
        enableTicketing: data.enableTicketing === "true",
        ticketCapacity: data.ticketCapacity,
        ticketReleaseDate: data.ticketReleaseDate
          ? data.ticketReleaseDate
          : null,
        earlyAccessCode: data.earlyAccessCode,
        ticketPrice: data.ticketPrice,
      };
    }),
  });

  return redirect("/calendar/success");
};

const CalendarNewPage = () => {
  const [startDate, setStartDate] = useState(add(new Date(), { days: 1 }));
  const [endDate, setEndDate] = useState(add(new Date(), { days: 1 }));
  const [enableTicketing, setEnableTicketing] = useState(false);
  const [ticketReleaseDate, setTicketReleaseDate] = useState(new Date());
  const user = useLoaderData<typeof loader>();

  return (
    <Box pb={12}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        Create an event
      </styled.h1>
      <Form method="post">
        <Flex flexDir="column" maxW={500} gap={4}>
          <Box>
            <Label>Track</Label>
            <Select name="trackId">
              {user?.Tracks.map((track) => (
                <option key={track.trackId} value={track.trackId}>
                  {track.track.name}
                </option>
              ))}
            </Select>
          </Box>

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
              value={startDate.toISOString()}
            />
            <TimePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
            />
          </Box>

          <Box flex={1}>
            <Label>End Time</Label>
            <Input
              type="hidden"
              name="endDate"
              required
              value={endDate.toISOString()}
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
            <Label>Event Name</Label>
            <Input name="name" required />
          </Box>

          <Box>
            <Label>Event Link (https://)</Label>
            <Input name="link" />
          </Box>

          <Box>
            <Label>Event Description</Label>
            <Textarea name="description" />
          </Box>

          <Box>
            <Label>Enable Ticketing</Label>
            <input
              type="hidden"
              name="enableTicketing"
              value={enableTicketing ? "true" : "false"}
            />
            <Flex overflow="hidden" rounded="md">
              <Button
                rounded="none"
                variant={enableTicketing ? "secondary" : "primary"}
                flex={1}
                type="button"
                onClick={() => setEnableTicketing(false)}
              >
                Disable
              </Button>
              <Button
                rounded="none"
                variant={enableTicketing ? "primary" : "secondary"}
                flex={1}
                type="button"
                onClick={() => setEnableTicketing(true)}
              >
                Enable
              </Button>
            </Flex>
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

          <Button type="submit">List Event</Button>
        </Flex>
      </Form>
    </Box>
  );
};

export default CalendarNewPage;
