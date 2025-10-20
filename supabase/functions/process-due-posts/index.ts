/* eslint-disable no-undef, @typescript-eslint/no-explicit-any */
// Supabase Edge Function: process-due-posts
// Picks due jobs from post_jobs, posts to providers, updates status with retries/backoff.
// Note: This function runs on Supabase Edge Runtime (Deno) and requires Deno globals

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Job = {
  id: string;
  user_id: string;
  post_id: string | null;
  platform: string;
  run_at: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  idempotency_key: string | null;
  content: string;
  media_urls: string[] | null;
  payload: Record<string, any> | null;
};

type Integration = {
  id: string;
  user_id: string;
  platform: string;
  is_active: boolean;
  credentials: Record<string, any> | null;
  configuration: Record<string, any> | null;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const MAX_BATCH = 20;

function backoffDelayMs(attempts: number): number {
  const base = Math.min(60, 2 ** attempts) * 1000; // up to 60s
  const jitter = Math.floor(Math.random() * 1000);
  return base + jitter;
}

async function fetchDueJobs(): Promise<Job[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('post_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', nowIso)
    .order('run_at', { ascending: true })
    .limit(MAX_BATCH);
  if (error) throw error;
  return (data || []) as Job[];
}

async function markProcessing(jobId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .single();
  if (error) return false;
  return !!data;
}

async function setSucceeded(jobId: string) {
  await supabase.from('post_jobs').update({ status: 'succeeded', error: null }).eq('id', jobId);
}

async function setFailedOrRetry(job: Job, reason: string) {
  const attempts = job.attempts + 1;
  if (attempts >= job.max_attempts) {
    await supabase
      .from('post_jobs')
      .update({ status: 'failed', attempts, error: reason })
      .eq('id', job.id);
    return;
  }
  const delay = backoffDelayMs(attempts);
  const nextRun = new Date(Date.now() + delay).toISOString();
  await supabase
    .from('post_jobs')
    .update({ status: 'pending', attempts, run_at: nextRun, error: reason })
    .eq('id', job.id);
}

async function getIntegrations(userId: string): Promise<Record<string, Integration>> {
  const { data, error } = await supabase
    .from('integrations')
    .select('id,user_id,platform,is_active,credentials,configuration')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
  const map: Record<string, Integration> = {};
  (data || []).forEach((it: any) => {
    map[(it.platform || '').toLowerCase()] = it as Integration;
  });
  return map;
}

// Provider posting implementations
async function postToFacebook(content: string, integ: Integration): Promise<{ ok: boolean; error?: string }> {
  const token = integ.credentials?.accessToken || integ.credentials?.pageAccessToken;
  const pageId = integ.configuration?.pageId;
  if (!token || !pageId) return { ok: false, error: 'Missing Facebook page token or pageId' };
  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const params = new URLSearchParams({ message: content, access_token: token });
  const res = await fetch(url, { method: 'POST', body: params });
  if (!res.ok) return { ok: false, error: `Facebook: ${res.status}` };
  return { ok: true };
}

async function postToLinkedIn(content: string, integ: Integration): Promise<{ ok: boolean; error?: string }> {
  const token = integ.credentials?.accessToken;
  const owner = integ.configuration?.ownerUrn; // e.g. urn:li:person:xxx or urn:li:organization:xxx
  if (!token || !owner) return { ok: false, error: 'Missing LinkedIn accessToken or ownerUrn' };
  const body = {
    author: owner,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) return { ok: false, error: `LinkedIn: ${await res.text()}` };
  return { ok: true };
}

async function postToReddit(content: string, integ: Integration): Promise<{ ok: boolean; error?: string }> {
  const { clientId, clientSecret, username, password, userAgent } = integ.credentials || {};
  const subreddit = integ.configuration?.subreddit;
  if (!clientId || !clientSecret || !username || !password || !userAgent || !subreddit) {
    return { ok: false, error: 'Missing Reddit credentials or subreddit' };
  }
  // Get token
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    },
    body: new URLSearchParams({ grant_type: 'password', username, password })
  });
  if (!tokenRes.ok) return { ok: false, error: `Reddit token: ${tokenRes.status}` };
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  // Submit self post with title = first 100 chars
  const title = content.slice(0, 100) || 'Post';
  const postRes = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    },
    body: new URLSearchParams({ sr: subreddit, kind: 'self', title, text: content })
  });
  if (!postRes.ok) return { ok: false, error: `Reddit post: ${postRes.status}` };
  return { ok: true };
}

async function postToBluesky(content: string, integ: Integration): Promise<{ ok: boolean; error?: string }> {
  const identifier = integ.credentials?.identifier;
  const appPassword = integ.credentials?.password;
  const serviceUrl = integ.credentials?.serviceUrl || 'https://bsky.social';
  if (!identifier || !appPassword) return { ok: false, error: 'Missing Bluesky identifier or app password' };
  const sessionRes = await fetch(`${serviceUrl}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: appPassword })
  });
  if (!sessionRes.ok) return { ok: false, error: `Bluesky login: ${sessionRes.status}` };
  const session = await sessionRes.json();
  const did = session.did;
  const now = new Date().toISOString();
  const record = {
    $type: 'app.bsky.feed.post',
    text: content,
    createdAt: now
  };
  const postRes = await fetch(`${serviceUrl}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessJwt}`
    },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record })
  });
  if (!postRes.ok) return { ok: false, error: `Bluesky post: ${postRes.status}` };
  return { ok: true };
}

async function postToPinterest(content: string, integ: Integration, mediaUrls: string[] | null): Promise<{ ok: boolean; error?: string }> {
  const token = integ.credentials?.accessToken;
  const boardId = integ.configuration?.boardId;
  const imageUrl = mediaUrls?.[0];
  if (!token || !boardId || !imageUrl) return { ok: false, error: 'Missing Pinterest token, boardId, or image URL' };
  const body = {
    board_id: boardId,
    title: content.slice(0, 80) || 'Post',
    description: content.slice(0, 500),
    media_source: { source_type: 'image_url', url: imageUrl }
  };
  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) return { ok: false, error: `Pinterest: ${await res.text()}` };
  return { ok: true };
}

async function postToTwitter(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Twitter/X requires OAuth 1.0a server implementation (pending credentials).' };
}

async function postToInstagram(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Instagram Graph API requires media publishing flow and image URL.' };
}

async function postToBlogger(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Blogger server-side posting requires OAuth 2.0 refresh token credentials.' };
}

async function handleJob(job: Job, integrations: Record<string, Integration>) {
  const platform = job.platform.toLowerCase();
  const integ = integrations[platform];
  if (!integ) {
    await setFailedOrRetry(job, `No active integration for ${platform}`);
    return;
  }
  let result: { ok: boolean; error?: string } = { ok: false, error: 'Unsupported platform' };
  try {
    switch (platform) {
      case 'facebook':
        result = await postToFacebook(job.content, integ);
        break;
      case 'linkedin':
        result = await postToLinkedIn(job.content, integ);
        break;
      case 'reddit':
        result = await postToReddit(job.content, integ);
        break;
      case 'bluesky':
        result = await postToBluesky(job.content, integ);
        break;
      case 'pinterest':
        result = await postToPinterest(job.content, integ, job.media_urls);
        break;
      case 'twitter':
        result = await postToTwitter();
        break;
      case 'instagram':
        result = await postToInstagram();
        break;
      case 'blogger':
        result = await postToBlogger();
        break;
      default:
        result = { ok: false, error: `Unsupported platform ${platform}` };
    }
  } catch (e) {
    result = { ok: false, error: (e as Error).message };
  }

  if (result.ok) {
    await setSucceeded(job.id);
  } else {
    await setFailedOrRetry(job, result.error || 'Unknown error');
  }
}

// HTTP handler
Deno.serve(async () => {
  try {
    const jobs = await fetchDueJobs();
    if (jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Claim in parallel safely
    const claimed: Job[] = [];
    for (const job of jobs) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await markProcessing(job.id);
      if (ok) claimed.push(job);
    }

    // Group by user and fetch integrations per user
    const byUser: Record<string, Job[]> = {};
    claimed.forEach(j => { (byUser[j.user_id] ||= []).push(j); });

    await Promise.all(Object.entries(byUser).map(async ([userId, userJobs]) => {
      const integrations = await getIntegrations(userId);
      for (const job of userJobs) {
        // eslint-disable-next-line no-await-in-loop
        await handleJob(job, integrations);
      }
    }));

    return new Response(JSON.stringify({ processed: claimed.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


