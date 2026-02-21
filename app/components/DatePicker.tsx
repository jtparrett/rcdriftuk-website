import {
  add,
  differenceInDays,
  format,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  sub,
  isAfter,
  isBefore,
  isEqual,
} from "date-fns";
import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { token } from "~/styled-system/tokens";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  days?: number;
}

export const DatePicker = ({
  value = new Date(),
  onChange,
  maxDate,
  days = 1,
}: Props) => {
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(value));
  const monthStartDate = startOfMonth(selectedMonth);
  const rangeEndDate = add(value, { days: days - 1 });

  const isInRange = (day: Date) => {
    if (days <= 1) return false;
    return (
      isAfter(day, value) &&
      (isBefore(day, rangeEndDate) || isEqual(day, rangeEndDate))
    );
  };

  return (
    <Box
      w="full"
      rounded="md"
      overflow="hidden"
      borderWidth={1}
      borderColor="gray.800"
    >
      <Flex alignItems="center" py={2} mb="1px">
        <styled.button
          color="inherit"
          type="button"
          py={2}
          px={4}
          onClick={() => setSelectedMonth(sub(selectedMonth, { months: 1 }))}
        >
          <styled.span srOnly>Previous Month</styled.span>
          <RiArrowLeftSLine />
        </styled.button>
        <styled.span flex={1} textAlign="center">
          {format(selectedMonth, "MMMM, yyyy")}
        </styled.span>
        <styled.button
          color="inherit"
          type="button"
          py={2}
          px={4}
          onClick={() => setSelectedMonth(add(selectedMonth, { months: 1 }))}
        >
          <styled.span srOnly>Next Month</styled.span>
          <RiArrowRightSLine />
        </styled.button>
      </Flex>

      <Flex mb="1px">
        {["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"].map((day) => (
          <styled.span
            w={`${100 / 7}%`}
            textAlign="center"
            key={day}
            color="gray.400"
          >
            {day}
          </styled.span>
        ))}
      </Flex>

      <Flex flexWrap="wrap" gap="1px">
        {Array.from(
          new Array(
            differenceInDays(
              monthStartDate,
              startOfWeek(monthStartDate, {
                weekStartsOn: 1,
              }),
            ),
          ),
        ).map((_, i) => (
          <Box key={i} bgColor="gray.900" w={`calc(${100 / 7}% - 1px)`}></Box>
        ))}

        {Array.from({ length: getDaysInMonth(monthStartDate) }).map((_, i) => {
          const day = add(monthStartDate, {
            days: i,
          });

          const isSelected = isSameDay(day, value);
          const isHighlighted = isInRange(day);
          const isDisabled = maxDate && isAfter(day, maxDate);

          const getBgColor = () => {
            if (isSelected) return token("colors.brand.500");
            if (isHighlighted) return token("colors.brand.900");
            return token("colors.gray.900");
          };

          return (
            <styled.button
              key={i}
              type="button"
              color={isDisabled ? "gray.600" : "inherit"}
              w={`calc(${100 / 7}% - 1px)`}
              textAlign="center"
              py={2}
              style={
                {
                  "--bg-color": getBgColor(),
                } as React.CSSProperties
              }
              bg="var(--bg-color)"
              onClick={() => !isDisabled && onChange(day)}
              disabled={isDisabled}
              cursor={isDisabled ? "not-allowed" : "pointer"}
            >
              {format(day, "do")}
            </styled.button>
          );
        })}
      </Flex>
    </Box>
  );
};
