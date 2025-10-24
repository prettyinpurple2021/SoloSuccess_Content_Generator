// Frontend API service that uses fetch to communicate with the backend
const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://solosuccess-ai.fly.dev'
    : 'http://localhost:3001';

export const apiService = {
  // Posts
  async getPosts(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/posts?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  async addPost(userId: string, post: any) {
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, post }),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  },

  // Brand Voices
  async getBrandVoices(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/brand-voices?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch brand voices');
    return response.json();
  },

  async addBrandVoice(userId: string, brandVoice: any) {
    const response = await fetch(`${API_BASE_URL}/api/brand-voices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, brandVoice }),
    });
    if (!response.ok) throw new Error('Failed to create brand voice');
    return response.json();
  },

  // Audience Profiles
  async getAudienceProfiles(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/audience-profiles?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch audience profiles');
    return response.json();
  },

  async addAudienceProfile(userId: string, audienceProfile: any) {
    const response = await fetch(`${API_BASE_URL}/api/audience-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, audienceProfile }),
    });
    if (!response.ok) throw new Error('Failed to create audience profile');
    return response.json();
  },

  // Campaigns
  async getCampaigns(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/campaigns?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    return response.json();
  },

  async addCampaign(userId: string, campaign: any) {
    const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, campaign }),
    });
    if (!response.ok) throw new Error('Failed to create campaign');
    return response.json();
  },
};
