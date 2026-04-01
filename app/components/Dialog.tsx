import { useEffect, useRef, type ReactNode } from "react";
import { styled } from "~/styled-system/jsx";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

export const Dialog = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const body = document.body;

    if (open) {
      disableBodyScroll(body);
      dialog.showModal();
    } else {
      enableBodyScroll(body);
      dialog.close();
    }

    return () => {
      enableBodyScroll(body);
    };
  }, [open]);

  return (
    <styled.dialog
      ref={ref}
      role="dialog"
      m="auto"
      bgColor="transparent"
      p={0}
      maxW={400}
      w="full"
      _backdrop={{
        bg: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(10px)",
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
      onClose={onClose}
    >
      <styled.div
        bgColor="gray.950"
        color="white"
        rounded="2xl"
        borderWidth={1}
        borderColor="gray.800"
        p={6}
      >
        {children}
      </styled.div>
    </styled.dialog>
  );
};
