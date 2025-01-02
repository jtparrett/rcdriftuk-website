import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { dark } from "@clerk/themes";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { Box, Center, styled } from "~/styled-system/jsx";

import styles from "./index.css";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "./components/Header";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { ClerkApp } from "@clerk/remix";
import { CookieBanner } from "./components/CookieBanner";
import { userPrefs } from "./utils/cookiePolicy.server";
import { LinkButton } from "./components/Button";
import { RiHome2Line } from "react-icons/ri";
import { getUser } from "./utils/getUser.server";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },

  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  },

  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  },
];

export const loader = (args: LoaderFunctionArgs) =>
  rootAuthLoader(args, async ({ request }) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
    const { pathname } = new URL(request.url);

    const { userId } = request.auth;

    if (userId) {
      const user = await getUser(userId);
      return {
        user,
        hideBanner: cookie.hideBanner,
        pathname,
      };
    }

    return {
      user: null,
      hideBanner: cookie.hideBanner,
      pathname,
    };
  });

function App() {
  const { hideBanner, user, pathname } = useLoaderData<typeof loader>();
  const isEmbed = pathname.includes("/embed/");

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script async src="https://cdn.splitbee.io/sb.js"></script>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8123266196289449"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        {!isEmbed && !hideBanner && <CookieBanner />}
        {!isEmbed && <Header user={user} />}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Analytics />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html lang="en">
      <head>
        <title>Oops!</title>
        <Meta />
        <Links />
        <script async src="https://cdn.splitbee.io/sb.js"></script>
      </head>
      <body>
        <Center
          h="100vh"
          bgImage="url(/grid-bg.svg)"
          bgRepeat="repeat"
          bgSize="60px"
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
            <styled.h1 fontWeight="black" mb={4} fontSize="3xl">
              {isRouteErrorResponse(error)
                ? `${error.status} ${error.statusText}`
                : error instanceof Error
                  ? error.message
                  : "Unknown Error"}
            </styled.h1>
            <LinkButton to="/">
              Go Home <RiHome2Line />
            </LinkButton>
          </Box>
        </Center>

        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default ClerkApp(App, {
  appearance: {
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
  },
});
