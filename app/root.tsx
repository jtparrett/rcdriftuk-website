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
import { Box, Center, styled } from "~/styled-system/jsx";

import "./index.css";
import { Header } from "./components/Header";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import { CookieBanner } from "./components/CookieBanner";
import { userPrefs } from "./utils/cookiePolicy.server";
import { LinkButton } from "./components/Button";
import { RiHome2Line } from "react-icons/ri";
import { getUser } from "./utils/getUser.server";
import { Footer } from "./components/Footer";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import "mapbox-gl/dist/mapbox-gl.css";
import { EmbedProvider } from "./utils/EmbedContext";
import { AppProvider } from "./utils/AppContext";
import { AppNav } from "./components/AppNav";
import { AppHeader } from "./components/AppHeader";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import type { Route } from "./+types/root";
import { useEffect } from "react";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK" },
    { name: "description", content: "Welcome to RCDrift.uk" },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
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

    if (userId) {
      const user = await getUser(userId);
      return {
        user,
        isEmbed,
        isApp,
        hideBanner: cookie.hideBanner,
      };
    }

    return {
      user: null,
      isEmbed,
      isApp,
      hideBanner: cookie.hideBanner,
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
    >
      <Box
        p={8}
        bg="gray.900"
        borderRadius="lg"
        borderWidth={1}
        borderColor="gray.800"
        shadow="lg"
        textAlign="center"
      >
        <styled.h1 fontWeight="extrabold" mb={4} fontSize="3xl">
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : error instanceof Error
              ? error.message
              : "Unknown Error"}
        </styled.h1>
        <LinkButton to="/app">
          Go Home <RiHome2Line />
        </LinkButton>
      </Box>
    </Center>
  );
}

function App({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const { hideBanner, isEmbed, isApp } = loaderData || {};
  const { user } = loaderData || {};
  const location = useLocation();
  const isMap = location.pathname.includes("/map");

  useEffect(() => {
    if (isApp) {
      let focusTimestamp = 0;

      const handleFocusIn = (e: Event) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          focusTimestamp = Date.now();
        }
      };

      const handleScroll = () => {
        const activeElement = document.activeElement;
        if (
          (activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement) &&
          Date.now() - focusTimestamp > 1500
        ) {
          activeElement.blur();
        }
      };

      document.addEventListener("focusin", handleFocusIn);
      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("focusin", handleFocusIn);
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
        <AppProvider value={isApp}>
          <EmbedProvider value={isEmbed}>
            {isApp && <AppHeader />}

            {!isEmbed && (
              <>
                {!isApp && <AnnouncementBanner />}
                {!hideBanner && !isApp && <CookieBanner />}
                {!isApp && <Header user={user} />}
              </>
            )}

            <Outlet />

            {isApp && <AppNav />}
            {!isMap && !isEmbed && !isApp && <Footer />}
          </EmbedProvider>
        </AppProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
