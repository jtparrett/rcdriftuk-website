import CurrencyInput from "react-currency-input-field";
import { Input } from "~/components/Input";

interface Props {
  name?: string;
  required?: boolean;
  placeholder?: string;
  initialValue?: number | null;
  onValueChange?: (value: string) => void;
}

export const MoneyInput = ({
  name,
  required,
  placeholder,
  initialValue,
  onValueChange,
}: Props) => {
  const defaultValue =
    initialValue != null && initialValue > 0 ? initialValue : undefined;

  return (
    <CurrencyInput
      name={name}
      customInput={Input}
      intlConfig={{ locale: "en-GB", currency: "GBP" }}
      defaultValue={defaultValue}
      decimalsLimit={2}
      allowNegativeValue={false}
      placeholder={placeholder ?? "£0.00"}
      required={required}
      onValueChange={(value) => onValueChange?.(value ?? "")}
    />
  );
};
