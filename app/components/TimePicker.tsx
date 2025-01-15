import { Box, Flex, styled } from "~/styled-system/jsx";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

export const TimePicker = ({ value, onChange }: Props) => {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(value);
    const selectedHour = parseInt(e.target.value);
    const newHour =
      period === "PM"
        ? selectedHour === 12
          ? 12
          : selectedHour + 12
        : selectedHour === 12
          ? 0
          : selectedHour;
    newDate.setHours(newHour);
    onChange(newDate);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(value);
    newDate.setMinutes(parseInt(e.target.value));
    onChange(newDate);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(value);
    const newPeriod = e.target.value;
    const currentHours = newDate.getHours();
    if (newPeriod === "AM" && currentHours >= 12) {
      newDate.setHours(currentHours - 12);
    } else if (newPeriod === "PM" && currentHours < 12) {
      newDate.setHours(currentHours + 12);
    }
    onChange(newDate);
  };

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
          Hour
        </styled.label>
        <styled.select
          w="full"
          py={2}
          px={4}
          bgColor="gray.800"
          rounded="md"
          color="white"
          value={displayHours}
          onChange={handleHourChange}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </styled.select>
      </Box>

      <styled.span py={2} mt={6}>
        :
      </styled.span>

      <Box flex={1}>
        <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
          Minutes
        </styled.label>
        <styled.select
          w="full"
          py={2}
          px={4}
          bgColor="gray.800"
          rounded="md"
          color="white"
          value={minutes}
          onChange={handleMinuteChange}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <option key={i} value={i * 15}>
              {(i * 15).toString().padStart(2, "0")}
            </option>
          ))}
        </styled.select>
      </Box>

      <Box flex={1}>
        <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
          AM/PM
        </styled.label>
        <styled.select
          w="full"
          py={2}
          px={4}
          bgColor="gray.800"
          rounded="md"
          color="white"
          value={period}
          onChange={handlePeriodChange}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </styled.select>
      </Box>
    </Flex>
  );
};
