import type { LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/2024";
import { redirect } from "react-router";
import { Outlet, useLocation } from "react-router";
import { Tab } from "~/components/Tab";
import { TabsBar } from "~/components/TabsBar";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2024 | Championship" },
    {
      name: "description",
      content: "Welcome to the 2024 championship",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/2024-cover.jpg",
    },
  ];
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.pathname === "/2024" || url.pathname === "/2024/") {
    return redirect(`/2024/schedule`);
  }

  return null;
};

const Page = () => {
  const location = useLocation();

  return (
    <>
      <TabsBar>
        <Tab
          to="/2024/schedule"
          isActive={
            location.pathname === "/2024/schedule" ||
            location.pathname === "/2024/schedule/"
          }
        >
          Schedule
        </Tab>
        <Tab
          to="/2024/standings"
          isActive={location.pathname.startsWith("/2024/standings")}
        >
          Standings
        </Tab>
      </TabsBar>

      <Outlet />
    </>
  );
};

export default Page;
