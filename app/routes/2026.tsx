import { styled } from "~/styled-system/jsx";
import { Outlet, useLocation } from "react-router";
import { Tab } from "~/components/Tab";
import { TabsBar } from "~/components/TabsBar";

const Page = () => {
  const location = useLocation();

  return (
    <styled.main>
      <TabsBar>
        <Tab
          to="/2026"
          isActive={location.pathname.replaceAll(/\//g, "") === "2026"}
        >
          Overview
        </Tab>
        <Tab
          to="/2026/schedule"
          isActive={location.pathname.startsWith("/2026/schedule")}
        >
          Schedule
        </Tab>
        <Tab
          to="/2026/rules"
          isActive={location.pathname.startsWith("/2026/rules")}
        >
          Rules & Regs
        </Tab>
        <Tab
          to="/2026/judging-criteria"
          isActive={location.pathname.startsWith("/2026/judging-criteria")}
        >
          Judging Criteria
        </Tab>
      </TabsBar>
      <Outlet />
    </styled.main>
  );
};

export default Page;
