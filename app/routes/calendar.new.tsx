import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import {
  add,
  differenceInWeeks,
  endOfYear,
  format,
  setHours,
  setMinutes,
} from "date-fns";
import { Fragment, useState } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { DatePicker } from "~/components/DatePicker";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Select } from "~/components/Select";
import { Textarea } from "~/components/Textarea";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

const sendEventToSlack = (text: string, id: string) => {
  return fetch(
    "https://hooks.slack.com/services/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",
    {
      method: "post",
      body: JSON.stringify({
        text: "New Event",

        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Approve",
                },
                style: "primary",
                action_id: "approve",
                value: id,
              },
            ],
          },
        ],
      }),
    }
  );
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/");
  }

  const userData = await prisma.users.findFirst({
    where: {
      id: userId,
    },
  });

  if (!userData?.trackId) {
    throw redirect("/");
  }

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { userId } = await getAuth(args);
  const body = await request.formData();

  invariant(userId);

  const userData = await prisma.users.findFirst({
    where: {
      id: userId,
    },
  });

  invariant(userData?.trackId, "User does not own a track");

  const name = body.get("name");
  const date = body.get("date");
  const startTime = body.get("startTime");
  const endTime = body.get("endTime");
  const link = body.get("link");
  const repeatWeeks = body.get("repeatWeeks");
  const description = body.get("description");

  const data = z
    .object({
      name: z.string(),
      date: z.coerce.date(),
      link: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      repeatWeeks: z.coerce.number(),
      description: z.string().optional(),
    })
    .parse({
      name,
      date,
      startTime,
      endTime,
      link,
      repeatWeeks,
      description,
    });

  const [startHours, startMinutes] = data.startTime.split(":");
  const [endHours, endMinutes] = data.endTime.split(":");
  const startDate = setMinutes(
    setHours(data.date, parseInt(startHours)),
    parseInt(startMinutes)
  );
  const endDate = setMinutes(
    setHours(data.date, parseInt(endHours)),
    parseInt(endMinutes)
  );

  const diff = differenceInWeeks(endOfYear(startDate), startDate);
  const arrayLength = data.repeatWeeks === 0 ? 1 : diff / data.repeatWeeks + 1;

  await prisma.events.createMany({
    data: Array.from({ length: arrayLength }).map((_, i) => {
      const repeatStartDate = add(startDate, { weeks: i * data.repeatWeeks });
      const repeatEndDate = add(endDate, { weeks: i * data.repeatWeeks });

      return {
        name: data.name,
        trackId: userData.trackId,
        link: data.link,
        startDate: repeatStartDate,
        endDate: repeatEndDate,
        description: data.description,
      };
    }),
  });

  const event = await prisma.events.findFirst({
    where: {
      trackId: userData.trackId,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      { startDate: "desc" },
    ],
    include: {
      eventTrack: {
        select: {
          name: true,
        },
      },
    },
  });

  if (event) {
    await sendEventToSlack(JSON.stringify(event, null, 2), event.id);
  }

  return redirect("/calendar/success");
};

const CalendarNewPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box pb={12}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        Create an event
      </styled.h1>
      <Form method="post">
        <Flex flexDir="column" maxW={500} gap={4}>
          <Box>
            <Label>Date</Label>
            <Input
              name="date"
              type="hidden"
              required
              value={format(selectedDate, "MM/dd/yyyy")}
            />
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
          </Box>

          <Box>
            <Flex gap={2}>
              <Box flex={1}>
                <Label>Start Time (24hr)</Label>
                <Select name="startTime" required>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hours = i.toString().padStart(2, "0");
                    return (
                      <Fragment key={i}>
                        <option>{hours}:00</option>
                        <option>{hours}:30</option>
                      </Fragment>
                    );
                  })}
                </Select>
              </Box>

              <Box flex={1}>
                <Label>End Time (24hr)</Label>
                <Select name="endTime" required>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hours = i.toString().padStart(2, "0");
                    return (
                      <Fragment key={i}>
                        <option>{hours}:00</option>
                        <option>{hours}:30</option>
                      </Fragment>
                    );
                  })}
                </Select>
              </Box>
            </Flex>
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

          <Button type="submit">List Event</Button>
        </Flex>
      </Form>
    </Box>
  );
};

export default CalendarNewPage;
