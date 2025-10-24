import express from 'express';
import cors from 'cors';
import { db } from './services/supabaseService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Posts API
app.get('/api/posts', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const posts = await db.getPosts(userId);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { userId, post } = req.body;
    if (!userId || !post) {
      return res.status(400).json({ error: 'User ID and post data are required' });
    }
    const newPost = await db.addPost(userId, post);
    res.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Brand Voices API
app.get('/api/brand-voices', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const brandVoices = await db.getBrandVoices(userId);
    res.json(brandVoices);
  } catch (error) {
    console.error('Error fetching brand voices:', error);
    res.status(500).json({ error: 'Failed to fetch brand voices' });
  }
});

app.post('/api/brand-voices', async (req, res) => {
  try {
    const { userId, brandVoice } = req.body;
    if (!userId || !brandVoice) {
      return res.status(400).json({ error: 'User ID and brand voice data are required' });
    }
    const newBrandVoice = await db.addBrandVoice(userId, brandVoice);
    res.json(newBrandVoice);
  } catch (error) {
    console.error('Error creating brand voice:', error);
    res.status(500).json({ error: 'Failed to create brand voice' });
  }
});

// Audience Profiles API
app.get('/api/audience-profiles', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const audienceProfiles = await db.getAudienceProfiles(userId);
    res.json(audienceProfiles);
  } catch (error) {
    console.error('Error fetching audience profiles:', error);
    res.status(500).json({ error: 'Failed to fetch audience profiles' });
  }
});

app.post('/api/audience-profiles', async (req, res) => {
  try {
    const { userId, audienceProfile } = req.body;
    if (!userId || !audienceProfile) {
      return res.status(400).json({ error: 'User ID and audience profile data are required' });
    }
    const newAudienceProfile = await db.addAudienceProfile(userId, audienceProfile);
    res.json(newAudienceProfile);
  } catch (error) {
    console.error('Error creating audience profile:', error);
    res.status(500).json({ error: 'Failed to create audience profile' });
  }
});

// Campaigns API
app.get('/api/campaigns', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const campaigns = await db.getCampaigns(userId);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { userId, campaign } = req.body;
    if (!userId || !campaign) {
      return res.status(400).json({ error: 'User ID and campaign data are required' });
    }
    const newCampaign = await db.addCampaign(userId, campaign);
    res.json(newCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
