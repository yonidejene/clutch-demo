import { useCallback, useMemo, useState } from "react";
import {
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ViewToken } from "react-native";
import { VIDEO_API_BASE } from "../lib/api";
import type { ApiResponse, Video } from "../types/api";

export const feedKeys = {
  all: ["feed"] as const,
  detail: (videoId: number) => [...feedKeys.all, "video", videoId] as const,
  list: () => [...feedKeys.all, "list"] as const,
};

interface FeedViewabilityInfo {
  changed: ViewToken<Video>[];
  viewableItems: ViewToken<Video>[];
}

interface ViewableVideoItem {
  isViewable?: boolean | null;
  item: {
    id: number;
  };
}

function getVisibleVideoIds(viewableItems: readonly ViewableVideoItem[]) {
  const uniqueIds = new Set<number>();

  for (const viewableItem of viewableItems) {
    if (!viewableItem.isViewable) {
      continue;
    }

    uniqueIds.add(viewableItem.item.id);
  }

  return Array.from(uniqueIds);
}

function getCachedVideo(
  feedData: InfiniteData<ApiResponse, number> | undefined,
  videoId: number
) {
  return feedData?.pages
    .flatMap((page) => page.data)
    .find((video) => video.id === videoId);
}

export async function fetchFeedPage(page: number): Promise<ApiResponse> {
  const response = await fetch(`${VIDEO_API_BASE}?page=${page}`);

  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status})`);
  }

  return response.json();
}

export async function fetchVideoById(videoId: number): Promise<Video> {
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const page = await fetchFeedPage(currentPage);
    const matchedVideo = page.data.find((video) => video.id === videoId);

    if (matchedVideo) {
      return matchedVideo;
    }

    totalPages = page.pagination.total_pages;
    currentPage += 1;
  }

  throw new Error("Match not found");
}

export function useFeed() {
  const query = useInfiniteQuery({
    gcTime: 0,
    getNextPageParam: (lastPage: ApiResponse) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    queryKey: feedKeys.list(),
    staleTime: 0,
  });

  const videos = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data]
  );

  return {
    ...query,
    videos,
  };
}

export function useMatchVideoQuery(videoId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    gcTime: 0,
    initialData: () =>
      getCachedVideo(
        queryClient.getQueryData<InfiniteData<ApiResponse, number>>(
          feedKeys.list()
        ),
        videoId
      ) as Video | undefined,
    queryFn: () => fetchVideoById(videoId),
    queryKey: feedKeys.detail(videoId),
    staleTime: 0,
  });
}

export function useFeedPlayback() {
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);

  const clearActiveVideo = useCallback(() => {
    setActiveVideoId(null);
  }, []);

  const handleViewVideo = useCallback((videoId: number) => {
    setActiveVideoId(videoId);
  }, []);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: FeedViewabilityInfo) => {
      const nextVisibleVideoIds = getVisibleVideoIds(viewableItems);

      setActiveVideoId((currentActiveVideoId) => {
        if (
          currentActiveVideoId !== null &&
          !nextVisibleVideoIds.includes(currentActiveVideoId)
        ) {
          return null;
        }

        return currentActiveVideoId;
      });
    },
    []
  );

  return {
    activeVideoId,
    clearActiveVideo,
    handleViewableItemsChanged,
    handleViewVideo,
  };
}
