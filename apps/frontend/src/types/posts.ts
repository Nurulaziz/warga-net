export interface Post {
  id: string;
  authorId: string;
  type: 'TEXT' | 'IMAGE' | 'POLL' | 'ANNOUNCEMENT';
  content: string | null;
  visibility: string;
  status: 'published' | 'hidden' | 'deleted';
  isPinned: boolean;
  pinnedAt: string | null;
  pinOrder: number;
  commentsLocked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  media?: Array<{
    id: string;
    url: string;
    mediaType: string;
    width?: number | null;
    height?: number | null;
    order: number;
  }>;
  hashtags?: Array<{ hashtag: { name: string } }>;
  viewerHasReacted?: boolean;
  viewerHasSaved?: boolean;
  poll?: Poll | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPosts {
  data: Post[];
  meta: PaginatedMeta;
}

export interface MediaUpload {
  url: string;
  name: string;
  size?: number;
}

export interface PostMediaItem {
  url: string;
  mediaType?: string;
  size?: number;
}

export interface CreatePostPayload {
  type?: string;
  content: string;
  visibility?: string;
  media?: PostMediaItem[];
  poll?: { question: string; options: string[] };
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  order: number;
}

export interface Poll {
  id: string;
  question: string;
  expiresAt: string | null;
  options: PollOption[];
  viewerOptionId: string | null;
}

export interface PostAnalytics {
  totalPosts: number;
  publishedPosts: number;
  hiddenPosts: number;
  totalComments: number;
  totalReactions: number;
  totalReports: number;
  pendingReports: number;
  engagement: {
    likeCount: number | null;
    commentCount: number | null;
    shareCount: number | null;
    viewCount: number | null;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  replies?: Comment[];
}

export interface PaginatedComments {
  data: Comment[];
}

export interface InteractionResult {
  liked?: boolean;
  saved?: boolean;
  shared?: boolean;
}

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'MISINFORMATION'
  | 'FRAUD'
  | 'OTHER';

export interface PostReport {
  id: string;
  targetType: 'POST' | 'COMMENT';
  reason: ReportReason;
  description: string | null;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: { id: string; fullName: string };
  post?: {
    id: string;
    content: string | null;
    status: string;
    author: { fullName: string };
  } | null;
  comment?: {
    id: string;
    postId: string;
    content: string;
    status: string;
    author: { fullName: string };
  } | null;
}

export interface PaginatedReports {
  data: PostReport[];
  meta: PaginatedMeta;
}
