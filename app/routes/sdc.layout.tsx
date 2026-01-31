import { Outlet, useLocation } from "react-router";
import { Tab } from "~/components/Tab";
import { TabsBar } from "~/components/TabsBar";

const Page = () => {
  const location = useLocation();
  return (
    <>
      <TabsBar>
        <Tab to="/standings" isActive={location.pathname === "/standings"}>
          All Standings
        </Tab>
        <Tab to="/standings/regional">Regional Standings</Tab>
      </TabsBar>
      <Outlet />
    </>
  );
};

export default Page;
