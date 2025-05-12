import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { dark } from "@clerk/themes";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
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

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://fonts.cdnfonts.com/css/sf-pro-display" },
];

export const loader = (args: LoaderFunctionArgs) =>
  rootAuthLoader(args, async ({ request }) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    const { userId } = request.auth;

    if (userId) {
      const user = await getUser(userId);
      return {
        user,
        hideBanner: cookie.hideBanner,
      };
    }

    return {
      user: null,
      hideBanner: cookie.hideBanner,
    };
  });

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();
  const { hideBanner, user } = loaderData;
  const location = useLocation();
  const isMap = location.pathname.includes("/map");

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
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
          <script src="https://cdn.splitbee.io/sb.js"></script>
          {process.env.NODE_ENV === "production" && (
            <script
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8123266196289449"
              crossOrigin="anonymous"
            ></script>
          )}
        </head>
        <body>
          {!hideBanner && <CookieBanner />}
          <AnnouncementBanner />
          <Header user={user} />
          {children}
          {!isMap && <Footer />}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <Center
      h="100vh"
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
        <LinkButton to="/">
          Go Home <RiHome2Line />
        </LinkButton>
      </Box>
    </Center>
  );
}

function App() {
  return <Outlet />;
}

export default App;
