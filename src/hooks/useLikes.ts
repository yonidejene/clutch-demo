import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useLikes(videoId: number) {
  const queryClient = useQueryClient();
  const { state } = useAuth();
  const userId = state.status === 'authenticated' ? state.user.id : undefined;

  const countQuery = useQuery({
    queryKey: ['likes', 'count', videoId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const userLikeQuery = useQuery({
    queryKey: ['likes', 'userLike', videoId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const hasLiked = !!userLikeQuery.data;

  const mutation = useMutation({
    mutationFn: async ({ shouldLike }: { shouldLike: boolean }) => {
      if (!userId) throw new Error('Not authenticated');
      if (shouldLike) {
        const { error } = await supabase
          .from('likes')
          .insert({ video_id: videoId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likes', 'count', videoId] });
      await queryClient.cancelQueries({ queryKey: ['likes', 'userLike', videoId, userId] });

      const prevCount = queryClient.getQueryData<number>(['likes', 'count', videoId]);
      const prevUserLike = queryClient.getQueryData(['likes', 'userLike', videoId, userId]);

      const isCurrentlyLiked = !!prevUserLike;
      queryClient.setQueryData(['likes', 'count', videoId], (old: number | undefined) =>
        isCurrentlyLiked ? Math.max(0, (old ?? 0) - 1) : (old ?? 0) + 1,
      );
      queryClient.setQueryData(
        ['likes', 'userLike', videoId, userId],
        isCurrentlyLiked ? null : { id: 'optimistic' },
      );

      return { prevCount, prevUserLike };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['likes', 'count', videoId], context.prevCount);
        queryClient.setQueryData(['likes', 'userLike', videoId, userId], context.prevUserLike);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', 'count', videoId] });
      queryClient.invalidateQueries({ queryKey: ['likes', 'userLike', videoId, userId] });
    },
  });

  return {
    likeCount: countQuery.data ?? 0,
    isCountLoading: countQuery.isLoading,
    hasLiked,
    toggleLike: () => mutation.mutate({ shouldLike: !hasLiked }),
    isToggling: mutation.isPending,
  };
}
