// Using standard Date objects instead of Firebase Timestamps
export type Timestamp = Date;

export type PostStatus = 'draft' | 'scheduled' | 'posted';
export type ViewMode = 'list' | 'calendar';

export interface SocialMediaPosts {
  [platform: string]: string;
}

export interface GeneratedImages {
  [prompt: string]: string[];
}

export interface Post {
  id: string;
  topic: string;
  idea: string;
  content: string;
  status: PostStatus;
  tags: string[];
  socialMediaPosts: SocialMediaPosts;
  socialMediaTones?: { [key: string]: string };
  socialMediaAudiences?: { [key: string]: string };
  scheduleDate?: Date;
  createdAt?: Date;
  postedAt?: Date;
  selectedImage?: string;
  summary?: string;
  headlines?: string[];
}

export interface DatabasePost {
  id: string;
  user_id: string;
  topic: string;
  idea: string;
  content: string;
  status: PostStatus;
  tags: string[];
  social_media_posts: SocialMediaPosts;
  social_media_tones?: { [key: string]: string };
  social_media_audiences?: { [key: string]: string };
  schedule_date?: string; // ISO string
  created_at?: string; // ISO string
  posted_at?: string; // ISO string
  selected_image?: string;
  summary?: string;
  headlines?: string[];
}

export interface LoadingState {
  [key: string]: boolean;
}