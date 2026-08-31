import { api } from '@/services/api';
import type {
  Comment,
  CreatePostPayload,
  InteractionResult,
  MediaUpload,
  PaginatedComments,
  PaginatedPosts,
  Post,
  PaginatedReports,
  ReportReason,
  PostAnalytics,
} from '@/types/posts';

export interface FeedParams {
  page?: number;
  limit?: number;
  sort?: 'latest' | 'trending' | 'pinned';
}

export async function fetchPosts(params: FeedParams = {}): Promise<PaginatedPosts> {
  const { data } = await api.get<PaginatedPosts>('/posts', { params });
  return data;
}

export async function fetchSavedPosts(params: FeedParams = {}): Promise<PaginatedPosts> {
  const { data } = await api.get<PaginatedPosts>('/posts/saved', { params });
  return data;
}

export async function fetchUserPosts(
  userId: string,
  params: FeedParams = {},
): Promise<PaginatedPosts> {
  const { data } = await api.get<PaginatedPosts>(`/users/${userId}/posts`, { params });
  return data;
}

export async function fetchMentionSuggestions(q: string) {
  const { data } = await api.get<{ data: Array<{ id: string; fullName: string }> }>(
    '/mentions/autocomplete',
    { params: { q } },
  );
  return data.data;
}

export async function fetchPostsByHashtag(
  tag: string,
  params: FeedParams = {},
): Promise<PaginatedPosts> {
  const { data } = await api.get<PaginatedPosts>(`/posts/hashtags/${encodeURIComponent(tag)}`, {
    params,
  });
  return data;
}

export async function uploadPostMedia(file: File): Promise<MediaUpload> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<MediaUpload>('/posts/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchPost(id: string): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/${id}`);
  return data;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const { data } = await api.post<Post>('/posts', payload);
  return data;
}

export async function updatePost(id: string, payload: Partial<CreatePostPayload>): Promise<Post> {
  const { data } = await api.patch<Post>(`/posts/${id}`, payload);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

// ==== Interaksi sosial ====

export async function reactPost(id: string): Promise<InteractionResult> {
  const { data } = await api.post<InteractionResult>(`/posts/${id}/reactions`, { type: 'LIKE' });
  return data;
}

export async function unreactPost(id: string): Promise<InteractionResult> {
  const { data } = await api.delete<InteractionResult>(`/posts/${id}/reactions`);
  return data;
}

export async function sharePost(id: string): Promise<InteractionResult> {
  const { data } = await api.post<InteractionResult>(`/posts/${id}/share`);
  return data;
}

export async function savePost(id: string): Promise<InteractionResult> {
  const { data } = await api.post<InteractionResult>(`/posts/${id}/save`);
  return data;
}

export async function unsavePost(id: string): Promise<InteractionResult> {
  const { data } = await api.delete<InteractionResult>(`/posts/${id}/save`);
  return data;
}

// ==== Komentar ====

export async function fetchComments(postId: string): Promise<PaginatedComments> {
  const { data } = await api.get<PaginatedComments>(`/posts/${postId}/comments`);
  return data;
}

export async function createComment(
  postId: string,
  payload: { content: string; parentId?: string },
): Promise<Comment[]> {
  const { data } = await api.post<Comment[]>(`/posts/${postId}/comments`, payload);
  return Array.isArray(data) ? data : (data as { data: Comment[] }).data;
}

export async function deleteComment(id: string): Promise<void> {
  await api.delete(`/comments/${id}`);
}

export async function updateComment(id: string, content: string): Promise<Comment> {
  const { data } = await api.patch<Comment>(`/comments/${id}`, { content });
  return data;
}

export async function reportPost(
  id: string,
  payload: { reason: ReportReason; description?: string },
) {
  const { data } = await api.post(`/posts/${id}/report`, payload);
  return data;
}

export async function reportComment(
  id: string,
  payload: { reason: ReportReason; description?: string },
) {
  const { data } = await api.post(`/comments/${id}/report`, payload);
  return data;
}

export async function fetchPostReports(
  params: { page?: number; limit?: number; status?: string } = {},
) {
  const { data } = await api.get<PaginatedReports>('/post-reports', { params });
  return data;
}

export async function updateReportStatus(id: string, status: string) {
  const { data } = await api.patch(`/post-reports/${id}`, { status });
  return data;
}

export async function moderatePost(
  id: string,
  action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide' | 'unhide',
) {
  const endpoint = action.replace(/^un/, '');
  const method = action.startsWith('un') ? 'delete' : 'post';
  const { data } = await api.request({ method, url: `/posts/${id}/${endpoint}` });
  return data as Post;
}

export async function votePoll(postId: string, optionId: string) {
  const { data } = await api.post<{ voted: boolean; optionId: string }>(
    `/posts/${postId}/poll/vote`,
    { optionId },
  );
  return data;
}

export async function fetchPostAnalytics(): Promise<PostAnalytics> {
  const { data } = await api.get<PostAnalytics>('/posts/analytics/summary');
  return data;
}
