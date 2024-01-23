import { useState } from "react";

export const useDisclosure = () => {
  const [isOpen, setOpen] = useState(false);

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
