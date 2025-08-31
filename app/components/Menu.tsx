import { useAuth } from "@clerk/react-router";
import {
  RiAwardLine,
  RiBook2Line,
  RiCalendarLine,
  RiCameraLensLine,
  RiDashboard2Line,
  RiFlagLine,
  RiHomeLine,
  RiListOrdered2,
  RiLogoutBoxRLine,
  RiMapPin2Line,
  RiRocketLine,
  RiSettings3Line,
  RiShoppingBagLine,
  RiTicketLine,
  RiTrophyLine,
  RiTShirtLine,
  RiUserLine,
  RiVipCrown2Line,
} from "react-icons/ri";
import { Link, useLocation } from "react-router";
import { styled } from "~/styled-system/jsx";

export const MenuIcon = styled("span", {
  base: {
    rounded: "md",
    bgColor: "rgba(255, 255, 255, 0.2)",
    w: 7,
    h: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    shadow: "md",
  },
});

export const MenuLink = styled(Link, {
  base: {
    rounded: "lg",
    py: 2,
    pl: 2,
    display: "flex",
    gap: 3,
    alignItems: "center",
    fontSize: "sm",
    fontWeight: "semibold",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    maxW: "full",
  },
  variants: {
    active: {
      inactive: {
        _hover: {
          md: {
            bgColor: "gray.800",
          },
        },
      },
      active: {
        bgColor: "brand.500",
      },
    },
  },
  defaultVariants: {
    active: "inactive",
  },
});

export const Menu = () => {
  const location = useLocation();

  return (
    <>
      <MenuLink
        to="/getting-started"
        active={
          location.pathname.startsWith("/getting-started")
            ? "active"
            : "inactive"
        }
      >
        <MenuIcon>
          <RiRocketLine />
        </MenuIcon>
        Getting Started
      </MenuLink>

      <MenuLink
        to="/feed"
        active={location.pathname === "/feed" ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiHomeLine />
        </MenuIcon>
        Community Feed
      </MenuLink>

      <MenuLink
        to="/ratings/all"
        active={location.pathname === "/ratings/all" ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiListOrdered2 />
        </MenuIcon>
        Driver Ratings
      </MenuLink>

      <MenuLink
        to="/competitions"
        active={
          location.pathname.startsWith("/competitions") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiTrophyLine />
        </MenuIcon>
        Competitions
      </MenuLink>

      <MenuLink
        to="/tournaments"
        active={
          location.pathname.startsWith("/tournaments") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiVipCrown2Line />
        </MenuIcon>
        Tournaments
      </MenuLink>

      <MenuLink
        to="/leaderboards"
        active={
          location.pathname.startsWith("/leaderboards") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiAwardLine />
        </MenuIcon>
        Leaderboards
      </MenuLink>

      <MenuLink
        to="/map/all"
        active={location.pathname.startsWith("/map") ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiMapPin2Line />
        </MenuIcon>
        Drift Map
      </MenuLink>
      <MenuLink
        to="/tracks"
        active={location.pathname === "/tracks" ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiFlagLine />
        </MenuIcon>
        Tracks
      </MenuLink>
      <MenuLink
        to={`/calendar`}
        active={
          location.pathname.startsWith("/calendar") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiCalendarLine />
        </MenuIcon>
        Calendar
      </MenuLink>

      <MenuLink
        to="/marketplace"
        active={
          location.pathname.startsWith("/marketplace") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiShoppingBagLine />
        </MenuIcon>
        Marketplace
      </MenuLink>

      <MenuLink
        to="/blog"
        active={location.pathname.startsWith("/blog") ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiBook2Line />
        </MenuIcon>
        Insights Blog
      </MenuLink>

      <MenuLink
        to="/merch"
        active={location.pathname.startsWith("/merch") ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiTShirtLine />
        </MenuIcon>
        Merch
      </MenuLink>
    </>
  );
};

export const UserMenu = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <>
      <MenuLink
        to={`/tickets`}
        active={
          location.pathname.startsWith("/tickets") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiTicketLine />
        </MenuIcon>
        My Tickets
      </MenuLink>

      <MenuLink to="/drivers/me">
        <MenuIcon>
          <RiUserLine />
        </MenuIcon>
        My Driver Profile
      </MenuLink>

      <MenuLink to="/setup">
        <MenuIcon>
          <RiDashboard2Line />
        </MenuIcon>
        My Car Setup
      </MenuLink>

      <MenuLink
        to="/fdr"
        active={location.pathname.startsWith("/fdr") ? "active" : "inactive"}
      >
        <MenuIcon>
          <RiCameraLensLine />
        </MenuIcon>
        FDR Calculator
      </MenuLink>

      <MenuLink
        to="/user/profile"
        active={
          location.pathname.startsWith("/user/profile") ? "active" : "inactive"
        }
      >
        <MenuIcon>
          <RiSettings3Line />
        </MenuIcon>
        Account Settings
      </MenuLink>

      <MenuLink
        to="/"
        onClick={(e) => {
          e.preventDefault();
          signOut({
            redirectUrl: "/sign-in",
          });
        }}
      >
        <MenuIcon>
          <RiLogoutBoxRLine />
        </MenuIcon>
        Sign Out
      </MenuLink>
    </>
  );
};
