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
    } else if (dialog.open) {
      enableBodyScroll(body);
      dialog.close();
    }

    return () => {
      enableBodyScroll(body);
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <styled.dialog
      ref={ref}
      role="dialog"
      m="auto"
      bgColor="transparent"
      border="none"
      p={0}
      maxW={400}
      w="full"
      overflow="visible"
      opacity={0}
      filter="blur(8px)"
      transform="translateY(10px)"
      transition="opacity 0.2s ease-out, filter 0.2s ease-out, transform 0.2s ease-out, overlay 0.2s ease-out allow-discrete, display 0.2s ease-out allow-discrete"
      css={{
        "@starting-style": {
          "&:is([open])": {
            opacity: 0,
            filter: "blur(8px)",
            transform: "translateY(10px)",
          },
          "&:is([open])::backdrop": {
            backgroundColor: "rgba(0, 0, 0, 0)",
            backdropFilter: "blur(0px)",
          },
        },
        "&:is([open])": {
          opacity: 1,
          filter: "blur(0px)",
          transform: "translateY(0)",
        },
        "&::backdrop": {
          backgroundColor: "rgba(0, 0, 0, 0)",
          backdropFilter: "blur(0px)",
          transition:
            "background-color 0.2s ease-out, backdrop-filter 0.2s ease-out, overlay 0.2s ease-out allow-discrete, display 0.2s ease-out allow-discrete",
        },
        "&:is([open])::backdrop": {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
        },
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
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
