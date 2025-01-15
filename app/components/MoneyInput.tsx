import { Input } from "~/components/Input";
import { useState } from "react";
import { FaPoundSign } from "react-icons/fa";
import { Center, Flex } from "~/styled-system/jsx";

interface Props {
  name?: string;
  required?: boolean;
  placeholder?: string;
}

export const MoneyInput = ({ name, required, placeholder }: Props) => {
  const [value, setValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric chars except decimal
    const input = e.target.value.replace(/[^0-9.]/g, "");

    // Only allow one decimal point
    const decimalCount = (input.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Limit to 2 decimal places
    const parts = input.split(".");
    if (parts[1]?.length > 2) return;

    setValue(input);

    // Format display value
    if (input === "") {
      setDisplayValue("");
    } else {
      const num = parseFloat(input);
      if (!isNaN(num)) {
        setDisplayValue(num.toFixed(2));
      }
    }
  };

  return (
    <Flex align="center" bgColor="gray.900" rounded="md">
      <Center w={10}>
        <FaPoundSign />
      </Center>
      <Input
        name={name}
        value={displayValue}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        inputMode="decimal"
        type="text"
        pattern="[0-9]*\.?[0-9]*"
      />
      <input type="hidden" name={name} value={value} />
    </Flex>
  );
};
