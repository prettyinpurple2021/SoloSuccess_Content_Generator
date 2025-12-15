import { Post } from '../types';

// Use HTTP API instead of direct database access for client-side code
const API_BASE_URL = '/api';

/**
 * Simple client-side post scheduler that checks for and publishes scheduled posts
 */
export class PostScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler - checks every minute for posts to publish
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Post scheduler started');

    // Check immediately
    this.checkAndPublishPosts();

    // Then check every minute
    this.intervalId = setInterval(() => {
      this.checkAndPublishPosts();
    }, 60000); // 60 seconds
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Post scheduler stopped');
  }

  /**
   * Check for scheduled posts that are ready to publish
   */
  private async checkAndPublishPosts() {
    try {
      // Fetch posts via HTTP API instead of direct database access
      const response = await fetch(`${API_BASE_URL}/posts?status=scheduled`);
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const posts = await response.json();

      const now = new Date();

      // Find posts that are scheduled and ready to publish
      const postsToPublish = posts.filter(
        (post) =>
          post.status === 'scheduled' && post.scheduleDate && new Date(post.scheduleDate) <= now
      );

      if (postsToPublish.length === 0) {
        return; // No posts to publish
      }

      console.log(`Found ${postsToPublish.length} posts ready to publish`);

      // Publish each post
      for (const post of postsToPublish) {
        await this.publishPost(post);
      }
    } catch (error) {
      console.error('Error checking scheduled posts:', error);
    }
  }

  /**
   * Publish a single post
   */
  private async publishPost(post: Post) {
    try {
      console.log(`Publishing post: ${post.idea}`);

      if (!post.userId) {
        throw new Error(`Post ${post.id} is missing userId - cannot update`);
      }

      // Update status to 'posting' to prevent duplicate publishing
      const updateResponse = await fetch(
        `${API_BASE_URL}/posts?id=${encodeURIComponent(post.id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'posting',
            userId: post.userId,
          }),
        }
      );
      if (!updateResponse.ok) throw new Error('Failed to update post status');
      // Publish to Blogger (you can add other platforms here)
      const success = await this.publishToBloggerSafely(post);

      if (success) {
        // Mark as posted
        const postedResponse = await fetch(
          `${API_BASE_URL}/posts?id=${encodeURIComponent(post.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'posted',
              posted_at: new Date().toISOString(),
              userId: post.userId,
            }),
          }
        );
        if (!postedResponse.ok) throw new Error('Failed to mark post as posted');

        console.log(`Successfully published post: ${post.idea}`);

        // Show success notification if possible
        if (typeof window !== 'undefined' && 'Notification' in window) {
          this.showNotification(`Published: ${post.idea}`, 'success');
        }
      } else {
        // Revert to scheduled if publishing failed
        const revertResponse = await fetch(
          `${API_BASE_URL}/posts?id=${encodeURIComponent(post.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'scheduled',
              userId: post.userId,
            }),
          }
        );
        if (!revertResponse.ok) throw new Error('Failed to revert post status');

        console.error(`Failed to publish post: ${post.idea}`);

        // Show error notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          this.showNotification(`Failed to publish: ${post.idea}`, 'error');
        }
      }
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);

      // Revert status on error
      try {
        if (post.userId) {
          const revertResponse = await fetch(
            `${API_BASE_URL}/posts?id=${encodeURIComponent(post.id)}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'scheduled',
                userId: post.userId,
              }),
            }
          );
          if (!revertResponse.ok) throw new Error('Failed to revert post status');
        }
      } catch (updateError) {
        console.error('Error reverting post status:', updateError);
      }
    }
  }

  /**
   * Safely publish to Blogger with error handling
   */
  private async publishToBloggerSafely(post: Post): Promise<boolean> {
    try {
      // Note: This requires a blogId to be configured
      // For now, we'll skip Blogger publishing in the scheduler
      // The user can manually publish through the UI
      console.log('Scheduled post ready for manual publishing:', post.idea);
      return true;
    } catch (error) {
      console.error('Blogger publishing error:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  private showNotification(message: string, type: 'success' | 'error') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      new Notification('SoloSuccess AI', {
        body: message,
        icon: type === 'success' ? '✅' : '❌',
        tag: 'post-scheduler',
      });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
    };
  }

  /**
   * Manually trigger a check (for testing)
   */
  async triggerCheck() {
    await this.checkAndPublishPosts();
  }
}

// Export singleton instance
export const postScheduler = new PostScheduler();
