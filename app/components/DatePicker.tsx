import {
  add,
  differenceInDays,
  format,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  sub,
} from "date-fns";
import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { Box, Flex, styled } from "~/styled-system/jsx";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

export const DatePicker = ({ value = new Date(), onChange }: Props) => {
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(value));
  const monthStartDate = startOfMonth(selectedMonth);

  return (
    <Box w="full" rounded="md" overflow="hidden">
      <Flex alignItems="center" py={2} bgColor="gray.900" mb="1px">
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

      <Flex bgColor="gray.900" mb="1px">
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
              })
            )
          )
        ).map((_, i) => (
          <Box key={i} bgColor="gray.900" w={`calc(${100 / 7}% - 1px)`}></Box>
        ))}

        {Array.from({ length: getDaysInMonth(monthStartDate) }).map((_, i) => {
          const day = add(monthStartDate, {
            days: i,
          });

          const isSelected = isSameDay(day, value);

          return (
            <styled.button
              key={i}
              type="button"
              color="inherit"
              w={`calc(${100 / 7}% - 1px)`}
              textAlign="center"
              py={2}
              bgColor={isSelected ? "brand.500" : "gray.900"}
              onClick={() => onChange(day)}
            >
              {format(day, "do")}
            </styled.button>
          );
        })}
      </Flex>
    </Box>
  );
};
