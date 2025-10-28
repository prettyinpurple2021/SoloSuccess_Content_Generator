// Client-safe API service that uses HTTP endpoints instead of direct database access
// This replaces the server-side apiService for client-side components

const API_BASE_URL = '/api'; // This will be handled by Vercel serverless functions

export const apiService = {
  // Posts
  async getPosts(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },

  async addPost(userId: string, post: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, userId }),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return await response.json();
    } catch (error) {
      console.error('Failed to create post:', error);
      throw new Error('Failed to create post');
    }
  },

  async updatePost(userId: string, postId: string, updates: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return await response.json();
    } catch (error) {
      console.error('Failed to update post:', error);
      throw new Error('Failed to update post');
    }
  },

  async deletePost(userId: string, postId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return await response.json();
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw new Error('Failed to delete post');
    }
  },

  // Brand Voices
  async getBrandVoices(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/brand-voices?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch brand voices');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch brand voices:', error);
      throw new Error('Failed to fetch brand voices');
    }
  },

  async addBrandVoice(userId: string, brandVoice: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/brand-voices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...brandVoice, userId }),
      });
      if (!response.ok) throw new Error('Failed to create brand voice');
      return await response.json();
    } catch (error) {
      console.error('Failed to create brand voice:', error);
      throw new Error('Failed to create brand voice');
    }
  },

  async updateBrandVoice(userId: string, brandVoiceId: string, updates: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/brand-voices/${brandVoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (!response.ok) throw new Error('Failed to update brand voice');
      return await response.json();
    } catch (error) {
      console.error('Failed to update brand voice:', error);
      throw new Error('Failed to update brand voice');
    }
  },

  async deleteBrandVoice(userId: string, brandVoiceId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/brand-voices/${brandVoiceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete brand voice');
      return await response.json();
    } catch (error) {
      console.error('Failed to delete brand voice:', error);
      throw new Error('Failed to delete brand voice');
    }
  },

  // Audience Profiles
  async getAudienceProfiles(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/audience-profiles?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch audience profiles');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch audience profiles:', error);
      throw new Error('Failed to fetch audience profiles');
    }
  },

  async addAudienceProfile(userId: string, profile: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/audience-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, userId }),
      });
      if (!response.ok) throw new Error('Failed to create audience profile');
      return await response.json();
    } catch (error) {
      console.error('Failed to create audience profile:', error);
      throw new Error('Failed to create audience profile');
    }
  },

  async updateAudienceProfile(userId: string, profileId: string, updates: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/audience-profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (!response.ok) throw new Error('Failed to update audience profile');
      return await response.json();
    } catch (error) {
      console.error('Failed to update audience profile:', error);
      throw new Error('Failed to update audience profile');
    }
  },

  async deleteAudienceProfile(userId: string, profileId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/audience-profiles/${profileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete audience profile');
      return await response.json();
    } catch (error) {
      console.error('Failed to delete audience profile:', error);
      throw new Error('Failed to delete audience profile');
    }
  },

  // Campaigns
  async getCampaigns(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      throw new Error('Failed to fetch campaigns');
    }
  },

  async addCampaign(userId: string, campaign: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, userId }),
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return await response.json();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw new Error('Failed to create campaign');
    }
  },

  async updateCampaign(userId: string, campaignId: string, updates: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      return await response.json();
    } catch (error) {
      console.error('Failed to update campaign:', error);
      throw new Error('Failed to update campaign');
    }
  },

  async deleteCampaign(userId: string, campaignId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      return await response.json();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      throw new Error('Failed to delete campaign');
    }
  },

  // Integrations
  async getIntegrations(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  },

  async addIntegration(userId: string, integration: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...integration, userId }),
      });
      if (!response.ok) throw new Error('Failed to create integration');
      return await response.json();
    } catch (error) {
      console.error('Failed to create integration:', error);
      throw new Error('Failed to create integration');
    }
  },

  async updateIntegration(userId: string, integrationId: string, updates: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/${integrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId }),
      });
      if (!response.ok) throw new Error('Failed to update integration');
      return await response.json();
    } catch (error) {
      console.error('Failed to update integration:', error);
      throw new Error('Failed to update integration');
    }
  },

  async deleteIntegration(userId: string, integrationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to delete integration');
      return await response.json();
    } catch (error) {
      console.error('Failed to delete integration:', error);
      throw new Error('Failed to delete integration');
    }
  },

  async testConnection(userId: string, integrationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to test connection');
      return await response.json();
    } catch (error) {
      console.error('Failed to test connection:', error);
      throw new Error('Failed to test connection');
    }
  },
};
