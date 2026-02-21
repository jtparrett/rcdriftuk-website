import { useQuery } from "@tanstack/react-query";

export interface SearchUser {
  id: string | null;
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

export const useUserSearch = (query: string) => {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query) return [];
      const response = await fetch(
        `/api/search-users?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Failed to search users");
      return response.json() as Promise<SearchUser[]>;
    },
    enabled: query.length > 0,
  });
};
