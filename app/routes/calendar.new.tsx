import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { setHours, setMinutes } from "date-fns";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData();

  const name = body.get("name");
  const track = body.get("track");
  const date = body.get("date");
  const startTime = body.get("startTime");
  const endTime = body.get("endTime");
  const link = body.get("link");

  const data = z
    .object({
      name: z.string(),
      track: z.string(),
      date: z.coerce.date(),
      link: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    })
    .parse({
      name,
      track,
      date,
      startTime,
      endTime,
      link,
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

  const event = await prisma.events.create({
    data: {
      name: data.name,
      track: data.track,
      link: data.link,
      startDate,
      endDate,
    },
  });

  await fetch(
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
              text: JSON.stringify(data, null, 2),
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
                value: event.id,
              },
            ],
          },
        ],
      }),
    }
  );

  return redirect("/calendar/success");
};

const CalendarNewPage = () => {
  return (
    <Box>
      <styled.h1 fontSize="4xl" fontStyle="italic" fontFamily="heading">
        Create an event
      </styled.h1>
      <Form method="post">
        <Flex flexDir="column" maxW={500} gap={4}>
          <Box>
            <Label>Event Name</Label>
            <Input name="name" required />
          </Box>
          <Box>
            <Label>Track</Label>
            <Input name="track" required />
          </Box>
          <Box>
            <Label>Event Link</Label>
            <Input name="link" required />
          </Box>
          <Box>
            <Label>Date</Label>
            <Input name="date" type="date" required />
          </Box>
          <Box>
            <Label>Start/End Time</Label>
            <Flex gap={2}>
              <Input name="startTime" type="time" required />
              <Input name="endTime" type="time" required />
            </Flex>
          </Box>
          <Button type="submit">Create Event</Button>
        </Flex>
      </Form>
    </Box>
  );
};

export default CalendarNewPage;
