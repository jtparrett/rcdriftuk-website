import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { dark } from "@clerk/themes";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { Toaster } from "sonner";

import "./index.css";
import { Header } from "./components/Header";
import { rootAuthLoader, clerkMiddleware } from "@clerk/react-router/server";
import { CookieBanner } from "./components/CookieBanner";
import { userPrefs } from "./utils/cookiePolicy.server";
import { Button, LinkButton } from "./components/Button";
import { RiHome2Line, RiRefreshLine } from "react-icons/ri";
import { getUser } from "./utils/getUser.server";
import { Footer } from "./components/Footer";
import "mapbox-gl/dist/mapbox-gl.css";
import { EmbedProvider } from "./utils/EmbedContext";
import { AppProvider } from "./utils/AppContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import type { Route } from "./+types/root";
import { useEffect } from "react";
import { useExpoPushTokenSync } from "./utils/useExpoPushToken";
import { PostHogProvider } from "./components/PostHogProvider";
import { AppName } from "./utils/enums";

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | Driving the Future of RC Drifting` },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://fonts.cdnfonts.com/css/sf-pro-display" },
];

export const loader = (args: LoaderFunctionArgs) =>
  rootAuthLoader(args, async ({ request }) => {
    const isApp = request.headers.get("User-Agent") === "rcdrift-app";
    const isEmbed = new URL(request.url).searchParams.get("embed") === "true";
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    const { userId } = request.auth;

    // PostHog environment variables
    const posthog = {
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
      POSTHOG_HOST: process.env.POSTHOG_HOST,
    };

    if (userId) {
      const user = await getUser(userId);
      return {
        user,
        isEmbed,
        isApp,
        hideBanner: cookie.hideBanner,
        posthog,
      };
    }

    return {
      user: null,
      isEmbed,
      isApp,
      hideBanner: cookie.hideBanner,
      posthog,
    };
  });

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Center
      h="100dvh"
      bgImage="url(/dot-bg.svg)"
      bgRepeat="repeat"
      bgSize="16px"
      bgPosition="center"
      borderBottomWidth={1}
      borderColor="gray.800"
      minH="100dvh"
    >
      <Box
        p={8}
        bg="gray.900"
        borderRadius="2xl"
        borderWidth={1}
        borderColor="gray.800"
        shadow="lg"
        textAlign="center"
      >
        <styled.h1 fontWeight="extrabold" mb={4} fontSize="3xl">
          {isRouteErrorResponse(error)
            ? `${error.statusText}`
            : error instanceof Error
              ? error.message
              : "Unknown Error"}
        </styled.h1>
        <Flex gap={2}>
          <LinkButton to="/app">
            Go Home <RiHome2Line />
          </LinkButton>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload <RiRefreshLine />
          </Button>
        </Flex>
      </Box>
    </Center>
  );
}

const ExpoPushToken = () => {
  useExpoPushTokenSync();
  return null;
};

function App({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const { hideBanner, isEmbed, isApp, posthog, user } = loaderData || {};
  const location = useLocation();
  const isMap = location.pathname.includes("/map");

  useEffect(() => {
    if (isApp) {
      let scrollStartY = 0;
      let focusStartTime = 0;
      let scrollStartTimeout: NodeJS.Timeout | null = null;

      const handleFocusIn = (e: Event) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          focusStartTime = Date.now();

          // Clear any existing timeout
          if (scrollStartTimeout) {
            clearTimeout(scrollStartTimeout);
          }

          // Set scrollStartY after 1 second delay
          scrollStartTimeout = setTimeout(() => {
            scrollStartY = window.scrollY;
          }, 1000);
        }
      };

      const handleScroll = () => {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement
        ) {
          // Only enable blur after 1 second has passed since focus
          if (Date.now() - focusStartTime < 1000) return;

          const scrollDistance = Math.abs(window.scrollY - scrollStartY);
          if (scrollDistance > 80) {
            activeElement.blur();
          }
        }
      };

      document.addEventListener("focusin", handleFocusIn);
      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("focusin", handleFocusIn);
        if (scrollStartTimeout) {
          clearTimeout(scrollStartTimeout);
        }
      };
    }
  }, [isApp]);

  return (
    <ClerkProvider
      loaderData={loaderData}
      appearance={{
        baseTheme: dark,
        layout: {
          logoPlacement: "none",
        },
        variables: {
          colorPrimary: "#ec1a55",
        },
        elements: {
          rootBox: {
            margin: "0 auto",
            overflow: "hidden",
          },
          card: {
            margin: 0,
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PostHogProvider
          apiKey={posthog?.POSTHOG_API_KEY}
          host={posthog?.POSTHOG_HOST}
        >
          <AppProvider value={isApp}>
            <EmbedProvider value={isEmbed}>
              <ExpoPushToken />

              {!isEmbed && (
                <>
                  {!hideBanner && !isApp && <CookieBanner />}
                  {!isApp && <Header user={user} />}
                </>
              )}

              <Outlet />

              {!isMap && !isEmbed && !isApp && <Footer />}

              <Toaster position="top-center" />
            </EmbedProvider>
          </AppProvider>
        </PostHogProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
