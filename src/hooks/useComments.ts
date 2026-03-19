import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Comment } from '../types/api';

export function useComments(videoId: number | null) {
  const queryClient = useQueryClient();
  const { state } = useAuth();
  const userId = state.status === 'authenticated' ? state.user.id : undefined;

  const countQuery = useQuery({
    queryKey: ['comments', 'count', videoId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: videoId != null,
  });

  const listQuery = useQuery({
    queryKey: ['comments', 'list', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, public_profiles(username)')
        .eq('video_id', videoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
    enabled: videoId != null,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('comments')
        .insert({ video_id: videoId!, user_id: userId, content })
        .select('*, public_profiles(username)')
        .single();
      if (error) throw error;
      return data as Comment;
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', 'list', videoId] });
      await queryClient.cancelQueries({ queryKey: ['comments', 'count', videoId] });

      const prevList = queryClient.getQueryData<Comment[]>(['comments', 'list', videoId]);
      const prevCount = queryClient.getQueryData<number>(['comments', 'count', videoId]);

      const optimisticComment: Comment = {
        id: `optimistic-${Date.now()}`,
        user_id: userId!,
        video_id: videoId!,
        content,
        created_at: new Date().toISOString(),
        public_profiles: { username: 'You' },
      };

      queryClient.setQueryData<Comment[]>(['comments', 'list', videoId], (old) => [
        optimisticComment,
        ...(old ?? []),
      ]);
      queryClient.setQueryData<number>(['comments', 'count', videoId], (old) => (old ?? 0) + 1);

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['comments', 'list', videoId], context.prevList);
        queryClient.setQueryData(['comments', 'count', videoId], context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'list', videoId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'count', videoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', 'list', videoId] });
      await queryClient.cancelQueries({ queryKey: ['comments', 'count', videoId] });

      const prevList = queryClient.getQueryData<Comment[]>(['comments', 'list', videoId]);
      const prevCount = queryClient.getQueryData<number>(['comments', 'count', videoId]);

      queryClient.setQueryData<Comment[]>(['comments', 'list', videoId], (old) =>
        (old ?? []).filter((c) => c.id !== commentId),
      );
      queryClient.setQueryData<number>(['comments', 'count', videoId], (old) =>
        Math.max(0, (old ?? 0) - 1),
      );

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['comments', 'list', videoId], context.prevList);
        queryClient.setQueryData(['comments', 'count', videoId], context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'list', videoId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'count', videoId] });
    },
  });

  const confirmAndDelete = useCallback(
    (comment: Comment) => {
      Alert.alert('Delete Comment', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(comment.id) },
      ]);
    },
    [deleteMutation],
  );

  return {
    comments: listQuery.data ?? [],
    commentCount: countQuery.data ?? 0,
    isCountLoading: countQuery.isLoading,
    postComment: postMutation.mutate,
    deleteComment: deleteMutation.mutate,
    confirmAndDelete,
    isLoading: listQuery.isLoading,
  };
}
