import { Link, useFetcher } from "react-router";
import {
  add,
  differenceInCalendarDays,
  format,
  sub,
  startOfHour,
} from "date-fns";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button, LinkButton } from "~/components/Button";
import { DatePicker } from "~/components/DatePicker";
import { FormControl } from "~/components/FormControl";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { MoneyInput } from "~/components/MoneyInput";
import { RankSelector } from "~/components/RankSelector";
import { Select } from "~/components/Select";
import { Textarea } from "~/components/Textarea";
import { TimePicker } from "~/components/TimePicker";
import { TabButton, TabGroup } from "~/components/Tab";
import { styled, Box, Divider, Flex } from "~/styled-system/jsx";
import { Card } from "~/components/CollapsibleCard";

export interface EventFormDefaults {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  link?: string | null;
  description?: string | null;
  rated?: boolean;
  enableTicketing?: boolean;
  ticketCapacity?: number | null;
  ticketPrice?: number | null;
  ticketReleaseDate?: Date | null;
  earlyAccessCode?: string | null;
  allowedRanks?: string[];
}

interface Props {
  defaults?: EventFormDefaults;
  stripeAccountEnabled: boolean;
  stripeSetupLink?: string;
  showRepeatEvent?: boolean;
  submitLabel: string;
  cancelLink?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date(),
  numberOfDays: z.coerce.number(),
  endDate: z.date(),
  link: z.string(),
  description: z.string(),
  rated: z.boolean(),
  enableTicketing: z.boolean(),
  ticketCapacity: z.coerce.number().optional().default(0),
  ticketPrice: z.string().optional().default(""),
  ticketReleaseDate: z.date().optional(),
  earlyAccessCode: z.string().optional().default(""),
  allowedRanks: z.array(z.string()).optional().default([]),
  repeatWeeks: z.string(),
});

const validationSchema = toFormikValidationSchema(formSchema);

type FormValues = z.infer<typeof formSchema>;

const getError = (formik: { touched: Record<string, unknown>; errors: Record<string, unknown> }, field: keyof FormValues) => {
  return formik.touched[field] ? (formik.errors[field] as string | undefined) : undefined;
};

export const EventForm = ({
  defaults = {},
  stripeAccountEnabled,
  stripeSetupLink,
  showRepeatEvent = false,
  submitLabel,
  cancelLink,
}: Props) => {
  const fetcher = useFetcher();

  const defaultStart =
    defaults.startDate ?? startOfHour(add(new Date(), { days: 1 }));
  const defaultEnd =
    defaults.endDate ?? startOfHour(add(new Date(), { days: 1 }));
  const defaultDays =
    defaults.startDate && defaults.endDate
      ? differenceInCalendarDays(defaults.endDate, defaults.startDate) + 1
      : 1;

  const formik = useFormik<FormValues>({
    validationSchema,
    initialValues: {
      name: defaults.name ?? "",
      startDate: defaultStart,
      numberOfDays: defaultDays,
      endDate: defaultEnd,
      link: defaults.link ?? "",
      description: defaults.description ?? "",
      rated: defaults.rated ?? false,
      enableTicketing: defaults.enableTicketing ?? false,
      ticketCapacity: defaults.ticketCapacity ?? 0,
      ticketPrice:
        defaults.ticketPrice != null && defaults.ticketPrice > 0
          ? defaults.ticketPrice.toFixed(2)
          : "",
      ticketReleaseDate: defaults.ticketReleaseDate ?? new Date(),
      earlyAccessCode: defaults.earlyAccessCode ?? "",
      allowedRanks: defaults.allowedRanks ?? [],
      repeatWeeks: "0",
    },
    onSubmit: (values) => {
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append(
        "startDate",
        format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      );
      formData.append(
        "endDate",
        format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      );
      formData.append("link", values.link);
      formData.append("description", values.description);
      formData.append("rated", values.rated ? "true" : "false");
      formData.append(
        "enableTicketing",
        values.enableTicketing ? "true" : "false",
      );

      if (values.enableTicketing) {
        formData.append("ticketCapacity", (values.ticketCapacity ?? 0).toString());
        formData.append("ticketPrice", values.ticketPrice ?? "");
        if (values.ticketReleaseDate) {
          formData.append(
            "ticketReleaseDate",
            values.ticketReleaseDate.toISOString(),
          );
        }
        formData.append("earlyAccessCode", values.earlyAccessCode ?? "");

        for (const rank of values.allowedRanks ?? []) {
          formData.append("allowedRanks", rank);
        }
      }

      if (showRepeatEvent) {
        formData.append("repeatWeeks", values.repeatWeeks);
      }

      fetcher.submit(formData, { method: "POST" });
    },
  });

  const updateEndDate = (newStartDate: Date, days: number) => {
    formik.setFieldValue("endDate", add(newStartDate, { days: days - 1 }));
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Card maxW={580} p={6}>
        <Flex flexDir="column" gap={4}>
          <FormControl error={getError(formik, "startDate")}>
            <Label>Date</Label>
            <DatePicker
              value={formik.values.startDate}
              days={formik.values.numberOfDays}
              onChange={(date) => {
                formik.setFieldValue("startDate", date);
                updateEndDate(date, formik.values.numberOfDays);
              }}
            />
          </FormControl>

          <FormControl error={getError(formik, "numberOfDays")}>
            <Label>Number of Days</Label>
            <Select
              value={formik.values.numberOfDays}
              onChange={(e) => {
                const days = parseInt(e.target.value, 10);
                formik.setFieldValue("numberOfDays", days);
                updateEndDate(formik.values.startDate, days);
              }}
            >
              <option value="1">1 Day</option>
              <option value="2">2 Days</option>
              <option value="3">3 Days</option>
              <option value="4">4 Days</option>
              <option value="5">5 Days</option>
            </Select>
          </FormControl>

          <FormControl error={getError(formik, "startDate")}>
            <Label>Start Time</Label>
            <TimePicker
              value={formik.values.startDate}
              onChange={(date) => formik.setFieldValue("startDate", date)}
            />
          </FormControl>

          <FormControl error={getError(formik, "endDate")}>
            <Label>End Time</Label>
            <TimePicker
              value={formik.values.endDate}
              onChange={(date) => formik.setFieldValue("endDate", date)}
            />
          </FormControl>

          {showRepeatEvent && (
            <Box>
              <Label>Repeat Event</Label>
              <Select
                value={formik.values.repeatWeeks}
                onChange={(e) =>
                  formik.setFieldValue("repeatWeeks", e.target.value)
                }
              >
                <option value="0">Never</option>
                <option value="1">Weekly</option>
                <option value="2">Bi-Weekly</option>
              </Select>
            </Box>
          )}

          <FormControl error={getError(formik, "name")}>
            <Label>Name</Label>
            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </FormControl>

          <FormControl error={getError(formik, "link")}>
            <Label>Link (https://)</Label>
            <Input
              name="link"
              value={formik.values.link}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </FormControl>

          <FormControl error={getError(formik, "description")}>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </FormControl>

          <Box>
            <Label>Is this a rated tournament?</Label>
            <TabGroup>
              <TabButton
                type="button"
                isActive={!formik.values.rated}
                onClick={() => formik.setFieldValue("rated", false)}
              >
                No
              </TabButton>
              <TabButton
                type="button"
                isActive={formik.values.rated}
                onClick={() => formik.setFieldValue("rated", true)}
              >
                Yes
              </TabButton>
            </TabGroup>
          </Box>

          <Divider borderColor="gray.800" />

          {stripeAccountEnabled ? (
            <>
              <Box>
                <Label>Enable ticketing</Label>
                <TabGroup>
                  <TabButton
                    type="button"
                    isActive={!formik.values.enableTicketing}
                    onClick={() =>
                      formik.setFieldValue("enableTicketing", false)
                    }
                  >
                    No
                  </TabButton>
                  <TabButton
                    type="button"
                    isActive={formik.values.enableTicketing}
                    onClick={() =>
                      formik.setFieldValue("enableTicketing", true)
                    }
                  >
                    Yes
                  </TabButton>
                </TabGroup>
              </Box>

              {formik.values.enableTicketing && (
                <>
                  <FormControl error={getError(formik, "ticketCapacity")}>
                    <Label>Ticket Capacity</Label>
                    <Input
                      name="ticketCapacity"
                      type="number"
                      value={formik.values.ticketCapacity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </FormControl>

                  <FormControl error={getError(formik, "ticketPrice")}>
                    <Label>Ticket Price</Label>
                    <MoneyInput
                      initialValue={defaults.ticketPrice}
                      onValueChange={(val) =>
                        formik.setFieldValue("ticketPrice", val)
                      }
                    />
                  </FormControl>

                  <FormControl error={getError(formik, "ticketReleaseDate")}>
                    <Label>Ticket Release Date</Label>
                    <DatePicker
                      value={formik.values.ticketReleaseDate ?? new Date()}
                      maxDate={sub(formik.values.startDate, { days: 1 })}
                      onChange={(date) =>
                        formik.setFieldValue("ticketReleaseDate", date)
                      }
                    />
                  </FormControl>

                  <FormControl error={getError(formik, "ticketReleaseDate")}>
                    <Label>Ticket Release Time</Label>
                    <TimePicker
                      value={formik.values.ticketReleaseDate ?? new Date()}
                      onChange={(date) =>
                        formik.setFieldValue("ticketReleaseDate", date)
                      }
                    />
                  </FormControl>

                  <FormControl error={getError(formik, "earlyAccessCode")}>
                    <Label>Early Access Code</Label>
                    <Input
                      name="earlyAccessCode"
                      value={formik.values.earlyAccessCode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </FormControl>

                  <Box>
                    <Label>Restrict by Driver Rank</Label>
                    <RankSelector
                      selectedRanks={formik.values.allowedRanks}
                      onChange={(ranks) =>
                        formik.setFieldValue("allowedRanks", ranks)
                      }
                    />
                  </Box>
                </>
              )}
            </>
          ) : stripeSetupLink ? (
            <Box
              bgColor="gray.800"
              borderRadius="lg"
              p={4}
              borderWidth={1}
              borderColor="gray.700"
            >
              <styled.p color="gray.400" fontSize="sm" mb={2}>
                To enable ticketing for events, you need to connect your
                Stripe account first.
              </styled.p>
              <Link
                to={stripeSetupLink}
                style={{ color: "#60a5fa", fontSize: "14px" }}
              >
                Set up Stripe Connect in track settings
              </Link>
            </Box>
          ) : null}

          <Divider borderColor="gray.800" />

          <Flex gap={2} justifyContent="flex-end">
            {cancelLink && (
              <LinkButton to={cancelLink} variant="secondary">
                Cancel
              </LinkButton>
            )}
            <Button
              type="submit"
              isLoading={formik.isSubmitting}
              disabled={formik.isSubmitting}
            >
              {submitLabel}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </form>
  );
};
