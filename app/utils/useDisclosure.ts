import { useState } from "react";

export const useDisclosure = (defaultValue: boolean = false) => {
  const [isOpen, setOpen] = useState(defaultValue);

  const onOpen = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const toggle = () => {
    setOpen(!isOpen);
  };

  return {
    isOpen,
    onOpen,
    onClose,
    toggle,
  };
};
