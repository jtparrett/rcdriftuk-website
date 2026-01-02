import { Box, Spacer, styled } from "~/styled-system/jsx";
import { Link } from "react-router";
import { RiNotificationLine } from "react-icons/ri";
import { useScroll, motion, useMotionValueEvent } from "motion/react";
import { css } from "~/styled-system/css";
import { NotificationsBadge } from "./NotificationsBadge";
import { SignedIn } from "@clerk/react-router";
import { AppName } from "~/utils/enums";
import { useState, useRef } from "react";

export const APP_TAB_ROUTES = [
  "/",
  "/feed",
  "/ratings/*",
  "/tournaments",
  "/map/*",
  "/calendar/*",
  "/marketplace",
  "/user-menu",
  "/sign-in",
  "/sign-up",
];

const IconButton = styled(Link, {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    w: 9,
    h: 9,
    borderRadius: "full",
    bgColor: "gray.900",
    borderWidth: 1,
    borderColor: "gray.800",
  },
});

export const AppHeader = () => {
  const { scrollY } = useScroll();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest <= 16) {
      // Always show when near top
      setIsVisible(true);
    } else {
      // Show when scrolling up, hide when scrolling down
      const direction = latest > lastScrollY.current ? "down" : "up";
      setIsVisible(direction === "up");
    }
    lastScrollY.current = latest;
  });

  return (
    <>
      <motion.div
        className={css({
          pos: "fixed",
          top: 0,
          w: "full",
          pt: "env(safe-area-inset-top)",
          zIndex: 15,
          bgColor: "rgba(12, 12, 12, 0.75)",
          backdropFilter: "blur(10px)",
          shadow: "2xl",
          transform: "translate3d(0, 0, 0)",
          borderBottomWidth: 1,
          borderColor: "gray.900",
        })}
        animate={{
          translateY: isVisible ? 0 : -64,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className={css({
            h: "64px",
            display: "flex",
            alignItems: "center",
            px: 3,
            pos: "relative",
            gap: 1,
          })}
          animate={{
            opacity: isVisible ? 1 : 0,
            filter: isVisible ? "blur(0px)" : "blur(12px)",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <Link
            to="/app"
            replace
            className={css({
              pos: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            })}
          >
            <img
              className={css({
                w: 140,
              })}
              src="/rcdriftio.svg"
              alt={AppName}
            />
          </Link>

          <Spacer />

          <SignedIn>
            <IconButton to="/notifications" pos="relative">
              <RiNotificationLine size={16} />
              <styled.span srOnly>Notifications</styled.span>
              <NotificationsBadge />
            </IconButton>

            {/* <IconButton to="/inbox">
              <RiChat3Line size={16} />
              <styled.span srOnly>Inbox</styled.span>
            </IconButton> */}
          </SignedIn>
        </motion.div>
      </motion.div>

      <Box h="calc(64px + env(safe-area-inset-top))" w="full" />
    </>
  );
};
