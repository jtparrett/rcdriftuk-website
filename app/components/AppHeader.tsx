import { Box, Center, Spacer, styled } from "~/styled-system/jsx";
import { useDelayedLoader } from "./Header";
import { Link, useLocation, useNavigate } from "react-router";
import {
  RiArrowLeftSLine,
  RiChat3Line,
  RiNotificationLine,
} from "react-icons/ri";
import {
  useScroll,
  motion,
  useTransform,
  AnimatePresence,
  useMotionValueEvent,
  useMotionValue,
} from "motion/react";
import { css } from "~/styled-system/css";
import { LogoLoader } from "./LogoLoader";
import { NotificationsBadge } from "./NotificationsBadge";
import { SignedIn } from "@clerk/react-router";
import { AppName } from "~/utils/enums";
import { useMemo, useRef } from "react";

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
  const isNavigating = useDelayedLoader();
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Motion values for tracking scroll state without re-renders
  const isScrollingUp = useMotionValue(false);
  const scrollDirectionChangeY = useMotionValue(0);
  const headerPositionAtChange = useMotionValue(0);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    const wasScrollingUp = isScrollingUp.get();
    const nowScrollingUp = direction === "up";

    // If direction changed, record both scroll position and current header position
    if (wasScrollingUp !== nowScrollingUp) {
      scrollDirectionChangeY.set(latest);
      headerPositionAtChange.set(translateY.get());
    }

    isScrollingUp.set(nowScrollingUp);
    lastScrollY.current = latest;
  });

  const translateY = useTransform(scrollY, (value) => {
    if (value <= 0) {
      return 0;
    }

    const scrollingUp = isScrollingUp.get();
    const changeY = scrollDirectionChangeY.get();
    const positionAtChange = headerPositionAtChange.get();

    if (scrollingUp) {
      // When scrolling up, translate back into view based on how much we've scrolled up
      const scrolledUp = changeY - value;
      return Math.max(-64, Math.min(0, positionAtChange + scrolledUp));
    } else {
      // When scrolling down, continue from current position
      const scrolledDown = value - changeY;
      return Math.max(-64, positionAtChange - scrolledDown);
    }
  });

  const showBackButton = useMemo(() => {
    return !APP_TAB_ROUTES.some((route) =>
      route.endsWith("*")
        ? location.pathname.toLowerCase().startsWith(route.slice(0, -1))
        : location.pathname.toLowerCase() === route,
    );
  }, [location.pathname]);

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
        style={{
          translateY,
        }}
      >
        <div
          className={css({
            h: "64px",
            display: "flex",
            alignItems: "center",
            px: 2,
            pos: "relative",
            gap: 1,
          })}
        >
          <AnimatePresence mode="wait">
            {showBackButton && (
              <motion.div
                key="back-button"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                  opacity: { duration: 0.2 },
                }}
                style={{ overflow: "hidden" }}
              >
                <styled.button
                  onClick={() => navigate(-1)}
                  type="button"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minW="32px"
                  h="32px"
                >
                  <RiArrowLeftSLine size={24} />
                </styled.button>
              </motion.div>
            )}
          </AnimatePresence>

          <Link to="/app">
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
        </div>
      </motion.div>

      <Box h="calc(64px + env(safe-area-inset-top))" w="full" />

      {isNavigating && (
        <Center pos="fixed" inset={0} bgColor="black" zIndex={14}>
          <LogoLoader />
        </Center>
      )}
    </>
  );
};
