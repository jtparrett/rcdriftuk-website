import { Box, Center, Spacer, styled } from "~/styled-system/jsx";
import { useDelayedLoader } from "./Header";
import { useLocation, useNavigate } from "react-router";
import { RiArrowLeftSLine } from "react-icons/ri";
import { useScroll, motion, useTransform } from "motion/react";
import { css } from "~/styled-system/css";
import { LogoLoader } from "./LogoLoader";

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

export const AppHeader = () => {
  const isNavigating = useDelayedLoader();
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  const scale = useTransform(scrollY, [0, 84], [1, 0.65]);
  const height = useTransform(scrollY, [0, 84], [64, 48]);

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
          })}
          style={{
            height,
          }}
        >
          {!APP_TAB_ROUTES.some((route) =>
            route.endsWith("*")
              ? location.pathname.toLowerCase().startsWith(route.slice(0, -1))
              : location.pathname.toLowerCase() === route,
          ) && (
            <styled.button onClick={() => navigate(-1)} type="button">
              <RiArrowLeftSLine size={24} />
            </styled.button>
          )}

          <Spacer />

          <Box
            pos="absolute"
            transform="translate3d(-50%, -50%, 0)"
            top="50%"
            left="50%"
          >
            <motion.img
              className={css({
                w: 140,
              })}
              style={{
                scale,
              }}
              src="/rcdriftuk-26.svg"
              alt="RC Drift UK"
            />
          </Box>
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
