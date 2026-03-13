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
import { useState, useEffect } from "react";
import { RiArrowDownSLine, RiDeleteBinLine, RiAddLine } from "react-icons/ri";

export interface EventFormDefaults {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  link?: string | null;
  description?: string | null;
  rated?: boolean;
  ticketCapacity?: number | null;
  ticketTypes?: Array<{
    id: number;
    name: string;
    price: number;
    releaseDate: Date;
    allowedRanks: string[];
  }>;
}

interface Props {
  defaults?: EventFormDefaults;
  stripeAccountEnabled: boolean;
  stripeSetupLink?: string;
  showRepeatEvent?: boolean;
  submitLabel: string;
  cancelLink?: string;
}

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    startDate: z.date(),
    numberOfDays: z.coerce.number(),
    endDate: z.date(),
    link: z.string(),
    description: z.string(),
    rated: z.boolean(),
    ticketCapacity: z.coerce.number().optional().default(0),
    ticketTypes: z.array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Name is required"),
        price: z.string().min(1, "Price is required"),
        releaseDate: z.date(),
        allowedRanks: z.array(z.string()),
      }),
    ),
    repeatWeeks: z.string(),
  })
  .refine(
    (data) => data.ticketTypes.length === 0 || (data.ticketCapacity ?? 0) > 0,
    {
      message: "Ticket capacity is required when ticket types are added",
      path: ["ticketCapacity"],
    },
  );

const validationSchema = toFormikValidationSchema(formSchema);

type FormValues = z.infer<typeof formSchema>;

const getError = (
  formik: { touched: Record<string, unknown>; errors: Record<string, unknown> },
  field: keyof FormValues,
) => {
  return formik.touched[field]
    ? (formik.errors[field] as string | undefined)
    : undefined;
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
  const [openTicketTypes, setOpenTicketTypes] = useState<Set<number>>(
    () => new Set<number>(),
  );

  const toggleTicketType = (index: number) => {
    setOpenTicketTypes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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
      ticketCapacity: defaults.ticketCapacity ?? 0,
      ticketTypes: (defaults.ticketTypes ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price > 0 ? t.price.toFixed(2) : "",
        releaseDate: t.releaseDate,
        allowedRanks: t.allowedRanks,
      })),
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
        "ticketCapacity",
        (values.ticketCapacity ?? 0).toString(),
      );
      formData.append(
        "ticketTypes",
        JSON.stringify(
          values.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            releaseDate: t.releaseDate.toISOString(),
            allowedRanks: t.allowedRanks,
          })),
        ),
      );

      if (showRepeatEvent) {
        formData.append("repeatWeeks", values.repeatWeeks);
      }

      fetcher.submit(formData, { method: "POST" });
    },
  });

  const getTicketTypeError = (
    index: number,
    field: string,
  ): string | undefined => {
    if (formik.submitCount === 0) return undefined;
    const errors = formik.errors.ticketTypes;
    if (!Array.isArray(errors)) return undefined;
    const typeErrors = errors[index];
    if (!typeErrors || typeof typeErrors === "string") return undefined;
    return (typeErrors as Record<string, string>)[field];
  };

  const ticketTypeHasErrors = (index: number): boolean => {
    if (formik.submitCount === 0) return false;
    const errors = formik.errors.ticketTypes;
    if (!Array.isArray(errors)) return false;
    const typeErrors = errors[index];
    return !!typeErrors && typeof typeErrors !== "string";
  };

  useEffect(() => {
    if (formik.submitCount > 0 && Array.isArray(formik.errors.ticketTypes)) {
      const indicesWithErrors = new Set<number>();
      formik.errors.ticketTypes.forEach((err, i) => {
        if (err && typeof err !== "string") {
          indicesWithErrors.add(i);
        }
      });
      if (indicesWithErrors.size > 0) {
        setOpenTicketTypes((prev) => {
          const next = new Set(prev);
          for (const i of indicesWithErrors) next.add(i);
          return next;
        });
      }
    }
  }, [formik.submitCount]);

  const updateEndDate = (newStartDate: Date, days: number) => {
    formik.setFieldValue("endDate", add(newStartDate, { days: days - 1 }));
  };

  const addTicketType = () => {
    const newIndex = formik.values.ticketTypes.length;
    formik.setFieldValue("ticketTypes", [
      ...formik.values.ticketTypes,
      {
        name: "",
        price: "",
        releaseDate: sub(formik.values.startDate, { days: 7 }),
        allowedRanks: [],
      },
    ]);
    setOpenTicketTypes((prev) => new Set(prev).add(newIndex));
  };

  const removeTicketType = (index: number) => {
    formik.setFieldValue(
      "ticketTypes",
      formik.values.ticketTypes.filter((_, i) => i !== index),
    );
    setOpenTicketTypes((prev) => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      }
      return next;
    });
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
            <Flex flexDir="column" gap={4}>
              <styled.h3 fontWeight="bold" fontSize="lg">
                Ticketing
              </styled.h3>

              <FormControl error={getError(formik, "ticketCapacity")}>
                <Label>Ticket Capacity</Label>
                <Input
                  name="ticketCapacity"
                  type="number"
                  min={1}
                  value={formik.values.ticketCapacity || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 50"
                />
                <styled.p color="gray.500" fontSize="xs" mt={1}>
                  Maximum tickets across all ticket types for this event.
                </styled.p>
              </FormControl>

              <Box>
                <Label mb={2}>Ticket Types</Label>

                <Flex flexDir="column" gap={2}>
                  {formik.values.ticketTypes.map((ticketType, index) => {
                    const isOpen = openTicketTypes.has(index);
                    return (
                      <Box
                        key={index}
                        borderWidth={1}
                        borderColor={
                          ticketTypeHasErrors(index)
                            ? "brand.500"
                            : isOpen
                              ? "gray.600"
                              : "gray.800"
                        }
                        rounded="xl"
                        overflow="hidden"
                        transition="border-color .2s"
                      >
                        <styled.button
                          type="button"
                          onClick={() => toggleTicketType(index)}
                          w="full"
                          p={4}
                          display="flex"
                          alignItems="center"
                          gap={2}
                          cursor="pointer"
                          _hover={{ bgColor: "gray.800" }}
                          transition="background-color .2s"
                        >
                          <Box flex={1} textAlign="left">
                            <styled.span fontWeight="semibold" fontSize="sm">
                              {ticketType.name || `Ticket Type ${index + 1}`}
                            </styled.span>
                            {ticketType.price && (
                              <styled.span
                                color="gray.400"
                                fontSize="sm"
                                ml={2}
                              >
                                £{ticketType.price}
                              </styled.span>
                            )}
                            {!isOpen && ticketTypeHasErrors(index) && (
                              <styled.span
                                color="brand.500"
                                fontSize="xs"
                                ml={2}
                              >
                                — has errors
                              </styled.span>
                            )}
                          </Box>
                          <Box
                            transform={isOpen ? "rotate(180deg)" : "none"}
                            transition="transform 0.2s"
                            color="gray.400"
                          >
                            <RiArrowDownSLine size={20} />
                          </Box>
                        </styled.button>

                        {isOpen && (
                          <Box p={4} borderTopWidth={1} borderColor="gray.800">
                            <Flex flexDir="column" gap={4}>
                              <FormControl
                                error={getTicketTypeError(index, "name")}
                              >
                                <Label>Name</Label>
                                <Input
                                  value={ticketType.name}
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      `ticketTypes.${index}.name`,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. General Admission"
                                />
                              </FormControl>

                              <FormControl
                                error={getTicketTypeError(index, "price")}
                              >
                                <Label>Price</Label>
                                <MoneyInput
                                  key={`money-${index}-${ticketType.id ?? "new"}`}
                                  initialValue={
                                    ticketType.price
                                      ? parseFloat(ticketType.price)
                                      : null
                                  }
                                  onValueChange={(val) =>
                                    formik.setFieldValue(
                                      `ticketTypes.${index}.price`,
                                      val,
                                    )
                                  }
                                />
                              </FormControl>

                              <FormControl>
                                <Label>Release Date</Label>
                                <DatePicker
                                  value={ticketType.releaseDate}
                                  maxDate={sub(formik.values.startDate, {
                                    days: 1,
                                  })}
                                  onChange={(date) =>
                                    formik.setFieldValue(
                                      `ticketTypes.${index}.releaseDate`,
                                      date,
                                    )
                                  }
                                />
                              </FormControl>

                              <FormControl>
                                <Label>Release Time</Label>
                                <TimePicker
                                  value={ticketType.releaseDate}
                                  onChange={(date) =>
                                    formik.setFieldValue(
                                      `ticketTypes.${index}.releaseDate`,
                                      date,
                                    )
                                  }
                                />
                              </FormControl>

                              <Box>
                                <Label>Restrict by Driver Rank</Label>
                                <RankSelector
                                  selectedRanks={ticketType.allowedRanks}
                                  onChange={(ranks) =>
                                    formik.setFieldValue(
                                      `ticketTypes.${index}.allowedRanks`,
                                      ranks,
                                    )
                                  }
                                />
                              </Box>

                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => removeTicketType(index)}
                              >
                                <RiDeleteBinLine /> Remove
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Flex>

                {formik.values.ticketTypes.length === 0 && (
                  <styled.p color="gray.500" fontSize="sm" mb={2}>
                    No ticket types added. Add one to enable ticketing for this
                    event.
                  </styled.p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={addTicketType}
                  mt={2}
                  w="full"
                >
                  <RiAddLine /> Add Ticket Type
                </Button>
              </Box>
            </Flex>
          ) : stripeSetupLink ? (
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
