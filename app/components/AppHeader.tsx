import { Box, Center, Spacer, styled } from "~/styled-system/jsx";
import { useDelayedLoader } from "./Header";
import { Link, useLocation, useNavigate } from "react-router";
import {
  RiArrowLeftSLine,
  RiChat3Line,
  RiNotificationLine,
} from "react-icons/ri";
import { useScroll, motion, useTransform, AnimatePresence } from "motion/react";
import { css } from "~/styled-system/css";
import { LogoLoader } from "./LogoLoader";
import { NotificationsBadge } from "./NotificationsBadge";
import { SignedIn } from "@clerk/react-router";
import { AppName } from "~/utils/enums";
import { useMemo } from "react";

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

  const scale = useTransform(scrollY, [0, 84], [1, 0.65]);
  const height = useTransform(scrollY, [0, 84], [64, 48]);

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
      >
        <motion.div
          className={css({
            h: "64px",
            display: "flex",
            alignItems: "center",
            px: 4,
            pos: "relative",
            gap: 1,
          })}
          style={{
            height,
          }}
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
            <motion.img
              className={css({
                w: 140,
              })}
              style={{
                scale,
                transformOrigin: "left center",
              }}
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

            <IconButton to="/inbox">
              <RiChat3Line size={16} />
              <styled.span srOnly>Inbox</styled.span>
            </IconButton>
          </SignedIn>
        </motion.div>
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
