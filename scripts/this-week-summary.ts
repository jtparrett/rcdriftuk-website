import { endOfWeek, format, startOfWeek } from "date-fns";
import { prisma } from "~/utils/prisma.server";

const run = async () => {
  const startDate = startOfWeek(new Date(), {
    weekStartsOn: 1,
  });
  const endDate = endOfWeek(new Date(), {
    weekStartsOn: 1,
  });

  const events = await prisma.events.findMany({
    where: {
      approved: true,
      startDate: {
        gte: startDate,
      },
      endDate: {
        lte: endDate,
      },
    },
    orderBy: {
      startDate: "asc",
    },
    select: {
      name: true,
      startDate: true,
      endDate: true,
      eventTrack: {
        select: {
          name: true,
        },
      },
    },
  });

  type Events = typeof events;

  const eventsGroupedByDay = events.reduce<Record<string, Events>>(
    (agg, event) => {
      const eventDate = format(new Date(event.startDate), "E, do MMMM");

      return {
        ...agg,
        [eventDate]: [...(agg?.[eventDate] ?? []), event],
      };
    },
    {}
  );

  console.log(`What's on this week?

See All [https://rcdrift.uk/calendar/week/${format(startDate, "dd-MM-yy")}]

----------------------------
${Object.entries(eventsGroupedByDay)
  .map(([day, events]) => {
    return `${day}\n${events
      .map((event) => {
        return `-${event.name} / ${event.eventTrack?.name}`;
      })
      .join("\n")}`;
  })
  .join("\n----------------------------\n")}
    `);
};

run();
