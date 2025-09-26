import { 
  Post, 
  TimeSlot, 
  SchedulingSuggestion, 
  ConflictAnalysis, 
  ContentConflict,
  AnalyticsData,
  EngagementData
} from '../types';
import { db } from './supabaseService';
import { analyticsService } from './analyticsService';

/**
 * Enhanced Scheduling Service for optimal timing analysis, timezone management,
 * and content conflict prevention
 */
export class SchedulingService {

  // Platform-specific optimal posting times (default fallbacks)
  private readonly defaultOptimalTimes: { [platform: string]: TimeSlot[] } = {
    'Twitter': [
      { time: '09:00', dayOfWeek: 1, engagementScore: 85, confidence: 0.8 },
      { time: '15:00', dayOfWeek: 2, engagementScore: 82, confidence: 0.8 },
      { time: '12:00', dayOfWeek: 3, engagementScore: 80, confidence: 0.7 }
    ],
    'LinkedIn': [
      { time: '08:00', dayOfWeek: 2, engagementScore: 90, confidence: 0.9 },
      { time: '17:00', dayOfWeek: 3, engagementScore: 88, confidence: 0.8 },
      { time: '12:00', dayOfWeek: 4, engagementScore: 85, confidence: 0.8 }
    ],
    'Facebook': [
      { time: '13:00', dayOfWeek: 2, engagementScore: 87, confidence: 0.8 },
      { time: '15:00', dayOfWeek: 3, engagementScore: 85, confidence: 0.8 },
      { time: '19:00', dayOfWeek: 6, engagementScore: 83, confidence: 0.7 }
    ],
    'Instagram': [
      { time: '11:00', dayOfWeek: 2, engagementScore: 88, confidence: 0.8 },
      { time: '14:00', dayOfWeek: 3, engagementScore: 86, confidence: 0.8 },
      { time: '17:00', dayOfWeek: 5, engagementScore: 84, confidence: 0.7 }
    ]
  };

  /**
   * Analyze optimal posting times based on historical engagement data
   */
  async analyzeOptimalTimes(
    platform: string, 
    audienceTimezone?: string,
    lookbackDays: number = 90
  ): Promise<TimeSlot[]> {
    try {
      // Get historical analytics data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - lookbackDays);

      const analyticsData = await db.getAnalyticsByTimeframe(startDate, endDate, platform);

      if (analyticsData.length < 10) {
        // Not enough data, return platform defaults adjusted for timezone
        return this.adjustTimeslotsForTimezone(
          this.defaultOptimalTimes[platform] || this.defaultOptimalTimes['Twitter'],
          audienceTimezone
        );
      }

      // Analyze engagement patterns by hour and day of week
      const engagementByTime: { [key: string]: { total: number; count: number; impressions: number } } = {};

      analyticsData.forEach(data => {
        const hour = data.recordedAt.getHours();
        const dayOfWeek = data.recordedAt.getDay();
        const key = `${dayOfWeek}-${hour}`;
        
        const engagement = data.likes + data.shares + data.comments + data.clicks;
        
        if (!engagementByTime[key]) {
          engagementByTime[key] = { total: 0, count: 0, impressions: 0 };
        }
        
        engagementByTime[key].total += engagement;
        engagementByTime[key].count += 1;
        engagementByTime[key].impressions += data.impressions;
      });

      // Calculate engagement scores and create time slots
      const timeSlots: TimeSlot[] = Object.entries(engagementByTime)
        .map(([key, data]) => {
          const [dayOfWeek, hour] = key.split('-').map(Number);
          const avgEngagement = data.total / data.count;
          const engagementRate = data.impressions > 0 ? (data.total / data.impressions) * 100 : 0;
          
          // Combine absolute engagement and engagement rate for scoring
          const engagementScore = (avgEngagement * 0.6) + (engagementRate * 0.4);
          
          // Confidence based on sample size
          const confidence = Math.min(data.count / 20, 1);

          return {
            time: `${hour.toString().padStart(2, '0')}:00`,
            dayOfWeek,
            engagementScore,
            confidence
          };
        })
        .filter(slot => slot.confidence > 0.3) // Only include slots with reasonable confidence
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10); // Top 10 time slots

      // Adjust for timezone if provided
      return audienceTimezone ? 
        this.adjustTimeslotsForTimezone(timeSlots, audienceTimezone) : 
        timeSlots;

    } catch (error) {
      console.error('Error analyzing optimal times:', error);
      // Return platform defaults as fallback
      return this.defaultOptimalTimes[platform] || this.defaultOptimalTimes['Twitter'];
    }
  }

  /**
   * Prevent content conflicts and suggest optimal spacing
   */
  async preventContentConflicts(posts: Post[]): Promise<ConflictAnalysis> {
    try {
      const conflicts: ContentConflict[] = [];
      const suggestions: string[] = [];

      // Group posts by platform and scheduled time
      const scheduledPosts = posts.filter(post => post.scheduleDate);
      
      // Check for timing conflicts (posts scheduled too close together)
      for (let i = 0; i < scheduledPosts.length; i++) {
        for (let j = i + 1; j < scheduledPosts.length; j++) {
          const post1 = scheduledPosts[i];
          const post2 = scheduledPosts[j];
          
          if (!post1.scheduleDate || !post2.scheduleDate) continue;

          const timeDiff = Math.abs(post1.scheduleDate.getTime() - post2.scheduleDate.getTime());
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          // Check for conflicts on same platform
          const sharedPlatforms = this.getSharedPlatforms(post1, post2);
          
          if (sharedPlatforms.length > 0 && hoursDiff < 2) {
            conflicts.push({
              postId1: post1.id,
              postId2: post2.id,
              platform: sharedPlatforms[0],
              conflictType: 'timing',
              severity: hoursDiff < 1 ? 'high' : 'medium',
              resolution: `Space posts at least 2-3 hours apart on ${sharedPlatforms[0]}`
            });
          }

          // Check for topic conflicts (similar content too close together)
          if (hoursDiff < 24 && this.areTopicsSimilar(post1.topic, post2.topic)) {
            conflicts.push({
              postId1: post1.id,
              postId2: post2.id,
              platform: 'all',
              conflictType: 'topic',
              severity: 'medium',
              resolution: 'Consider spacing similar topics by at least 24 hours'
            });
          }

          // Check for audience conflicts
          if (post1.audienceProfileId && post2.audienceProfileId && 
              post1.audienceProfileId === post2.audienceProfileId && hoursDiff < 4) {
            conflicts.push({
              postId1: post1.id,
              postId2: post2.id,
              platform: 'all',
              conflictType: 'audience',
              severity: 'low',
              resolution: 'Consider varying content for the same audience within 4 hours'
            });
          }
        }
      }

      // Generate suggestions based on conflicts found
      if (conflicts.length === 0) {
        suggestions.push('No scheduling conflicts detected');
      } else {
        const timingConflicts = conflicts.filter(c => c.conflictType === 'timing').length;
        const topicConflicts = conflicts.filter(c => c.conflictType === 'topic').length;
        
        if (timingConflicts > 0) {
          suggestions.push(`${timingConflicts} timing conflicts found. Consider spacing posts 2-3 hours apart.`);
        }
        
        if (topicConflicts > 0) {
          suggestions.push(`${topicConflicts} topic conflicts found. Vary content themes throughout the day.`);
        }
        
        suggestions.push('Use the bulk scheduling feature to automatically resolve conflicts.');
      }

      return { conflicts, suggestions };

    } catch (error) {
      console.error('Error preventing content conflicts:', error);
      throw new Error('Failed to analyze content conflicts');
    }
  }

  /**
   * Suggest optimal posting times for multiple posts
   */
  async suggestOptimalSpacing(
    posts: Post[], 
    platforms: string[],
    startDate?: Date,
    audienceTimezone?: string
  ): Promise<SchedulingSuggestion[]> {
    try {
      const suggestions: SchedulingSuggestion[] = [];
      const baseDate = startDate || new Date();

      // Get optimal times for each platform
      const platformOptimalTimes: { [platform: string]: TimeSlot[] } = {};
      
      for (const platform of platforms) {
        platformOptimalTimes[platform] = await this.analyzeOptimalTimes(platform, audienceTimezone);
      }

      // Create scheduling suggestions for each post
      let currentDateOffset = 0;
      
      for (const post of posts) {
        const postPlatforms = platforms.filter(platform => 
          post.socialMediaPosts && post.socialMediaPosts[platform]
        );

        if (postPlatforms.length === 0) {
          // If no platform-specific content, suggest for all platforms
          postPlatforms.push(...platforms);
        }

        for (const platform of postPlatforms) {
          const optimalTimes = platformOptimalTimes[platform] || [];
          
          if (optimalTimes.length > 0) {
            // Select best time slot for this post
            const timeSlot = optimalTimes[currentDateOffset % optimalTimes.length];
            
            // Calculate suggested date
            const suggestedDate = new Date(baseDate);
            suggestedDate.setDate(baseDate.getDate() + Math.floor(currentDateOffset / optimalTimes.length));
            
            // Set time based on optimal slot
            const [hour, minute] = timeSlot.time.split(':').map(Number);
            suggestedDate.setHours(hour, minute, 0, 0);
            
            // Adjust day of week if needed
            const targetDayOfWeek = timeSlot.dayOfWeek;
            const currentDayOfWeek = suggestedDate.getDay();
            const dayDiff = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
            suggestedDate.setDate(suggestedDate.getDate() + dayDiff);

            suggestions.push({
              postId: post.id,
              platform,
              suggestedTime: suggestedDate,
              reason: `Optimal engagement time for ${platform} (${timeSlot.engagementScore.toFixed(1)} score)`,
              confidence: timeSlot.confidence
            });
          }
        }

        currentDateOffset++;
      }

      // Sort suggestions by confidence and engagement score
      return suggestions.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Error suggesting optimal spacing:', error);
      throw new Error('Failed to suggest optimal spacing');
    }
  }

  /**
   * Adjust posting times for different timezones
   */
  adjustForTimezones(
    scheduleDate: Date, 
    targetTimezones: string[]
  ): { timezone: string; adjustedTime: Date }[] {
    try {
      return targetTimezones.map(timezone => {
        const adjustedTime = new Date(scheduleDate.toLocaleString("en-US", { timeZone: timezone }));
        return { timezone, adjustedTime };
      });
    } catch (error) {
      console.error('Error adjusting for timezones:', error);
      throw new Error('Failed to adjust for timezones');
    }
  }

  /**
   * Bulk schedule posts with optimal timing
   */
  async bulkSchedulePosts(
    postIds: string[],
    platforms: string[],
    startDate: Date,
    options: {
      spacing: 'optimal' | 'even' | 'custom';
      customInterval?: number; // hours
      audienceTimezone?: string;
      avoidWeekends?: boolean;
      avoidConflicts?: boolean;
    }
  ): Promise<{ postId: string; platform: string; scheduledTime: Date }[]> {
    try {
      const posts = await db.getPosts();
      const targetPosts = posts.filter(post => postIds.includes(post.id));
      
      const scheduledItems: { postId: string; platform: string; scheduledTime: Date }[] = [];

      if (options.spacing === 'optimal') {
        // Use optimal timing analysis
        const suggestions = await this.suggestOptimalSpacing(
          targetPosts, 
          platforms, 
          startDate, 
          options.audienceTimezone
        );

        suggestions.forEach(suggestion => {
          let scheduledTime = suggestion.suggestedTime;

          // Avoid weekends if requested
          if (options.avoidWeekends) {
            scheduledTime = this.adjustToAvoidWeekends(scheduledTime);
          }

          scheduledItems.push({
            postId: suggestion.postId,
            platform: suggestion.platform,
            scheduledTime
          });
        });

      } else if (options.spacing === 'even') {
        // Even spacing
        const intervalHours = options.customInterval || 4;
        let currentTime = new Date(startDate);

        targetPosts.forEach((post, index) => {
          platforms.forEach(platform => {
            let scheduledTime = new Date(currentTime);
            scheduledTime.setHours(scheduledTime.getHours() + (index * intervalHours));

            // Avoid weekends if requested
            if (options.avoidWeekends) {
              scheduledTime = this.adjustToAvoidWeekends(scheduledTime);
            }

            scheduledItems.push({
              postId: post.id,
              platform,
              scheduledTime
            });
          });
        });
      }

      // Check for conflicts if requested
      if (options.avoidConflicts) {
        const conflictAnalysis = await this.preventContentConflicts(targetPosts);
        
        if (conflictAnalysis.conflicts.length > 0) {
          // Adjust scheduling to resolve conflicts
          scheduledItems.forEach(item => {
            const hasConflict = conflictAnalysis.conflicts.some(conflict => 
              conflict.postId1 === item.postId || conflict.postId2 === item.postId
            );
            
            if (hasConflict) {
              // Add 2 hours to resolve timing conflicts
              item.scheduledTime.setHours(item.scheduledTime.getHours() + 2);
            }
          });
        }
      }

      // Update posts with scheduled times
      for (const item of scheduledItems) {
        await db.updatePost(item.postId, {
          schedule_date: item.scheduledTime.toISOString()
        });
      }

      return scheduledItems;

    } catch (error) {
      console.error('Error bulk scheduling posts:', error);
      throw new Error('Failed to bulk schedule posts');
    }
  }

  /**
   * Get scheduling recommendations for a specific post
   */
  async getPostSchedulingRecommendations(
    postId: string,
    platforms: string[]
  ): Promise<{
    recommendations: SchedulingSuggestion[];
    conflicts: ContentConflict[];
    optimalTimes: { [platform: string]: TimeSlot[] };
  }> {
    try {
      const posts = await db.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Get optimal times for each platform
      const optimalTimes: { [platform: string]: TimeSlot[] } = {};
      for (const platform of platforms) {
        optimalTimes[platform] = await this.analyzeOptimalTimes(platform);
      }

      // Generate recommendations
      const recommendations = await this.suggestOptimalSpacing([post], platforms);

      // Check for conflicts with other scheduled posts
      const conflictAnalysis = await this.preventContentConflicts(posts);
      const postConflicts = conflictAnalysis.conflicts.filter(conflict => 
        conflict.postId1 === postId || conflict.postId2 === postId
      );

      return {
        recommendations,
        conflicts: postConflicts,
        optimalTimes
      };

    } catch (error) {
      console.error('Error getting post scheduling recommendations:', error);
      throw new Error('Failed to get scheduling recommendations');
    }
  }

  // Private helper methods

  private adjustTimeslotsForTimezone(timeSlots: TimeSlot[], timezone?: string): TimeSlot[] {
    if (!timezone) return timeSlots;

    try {
      return timeSlots.map(slot => {
        const [hour, minute] = slot.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        
        // Convert to target timezone
        const adjustedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
        
        return {
          ...slot,
          time: `${adjustedDate.getHours().toString().padStart(2, '0')}:${adjustedDate.getMinutes().toString().padStart(2, '0')}`
        };
      });
    } catch (error) {
      console.error('Error adjusting timeslots for timezone:', error);
      return timeSlots;
    }
  }

  private getSharedPlatforms(post1: Post, post2: Post): string[] {
    const platforms1 = Object.keys(post1.socialMediaPosts || {});
    const platforms2 = Object.keys(post2.socialMediaPosts || {});
    
    return platforms1.filter(platform => platforms2.includes(platform));
  }

  private areTopicsSimilar(topic1: string, topic2: string): boolean {
    // Simple similarity check - in a real implementation, you might use NLP
    const words1 = topic1.toLowerCase().split(' ').filter(word => word.length > 3);
    const words2 = topic2.toLowerCase().split(' ').filter(word => word.length > 3);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity > 0.3; // 30% similarity threshold
  }

  private adjustToAvoidWeekends(date: Date): Date {
    const adjustedDate = new Date(date);
    const dayOfWeek = adjustedDate.getDay();
    
    // If it's Saturday (6) or Sunday (0), move to Monday
    if (dayOfWeek === 6) {
      adjustedDate.setDate(adjustedDate.getDate() + 2);
    } else if (dayOfWeek === 0) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }
    
    return adjustedDate;
  }

  /**
   * Get scheduling analytics and insights
   */
  async getSchedulingAnalytics(): Promise<{
    averageEngagementByHour: { hour: number; engagement: number }[];
    bestPerformingDays: { day: string; engagement: number }[];
    platformOptimalTimes: { [platform: string]: TimeSlot[] };
    schedulingEfficiency: number;
  }> {
    try {
      // Get all analytics data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3); // Last 3 months

      const analyticsData = await db.getAnalyticsByTimeframe(startDate, endDate);

      // Calculate average engagement by hour
      const hourlyEngagement: { [hour: number]: number[] } = {};
      analyticsData.forEach(data => {
        const hour = data.recordedAt.getHours();
        const engagement = data.likes + data.shares + data.comments + data.clicks;
        
        if (!hourlyEngagement[hour]) {
          hourlyEngagement[hour] = [];
        }
        hourlyEngagement[hour].push(engagement);
      });

      const averageEngagementByHour = Object.entries(hourlyEngagement).map(([hour, engagements]) => ({
        hour: parseInt(hour),
        engagement: engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length
      }));

      // Calculate best performing days
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyEngagement: { [day: number]: number[] } = {};
      
      analyticsData.forEach(data => {
        const day = data.recordedAt.getDay();
        const engagement = data.likes + data.shares + data.comments + data.clicks;
        
        if (!dailyEngagement[day]) {
          dailyEngagement[day] = [];
        }
        dailyEngagement[day].push(engagement);
      });

      const bestPerformingDays = Object.entries(dailyEngagement).map(([day, engagements]) => ({
        day: dayNames[parseInt(day)],
        engagement: engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length
      }));

      // Get platform optimal times
      const platforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'];
      const platformOptimalTimes: { [platform: string]: TimeSlot[] } = {};
      
      for (const platform of platforms) {
        platformOptimalTimes[platform] = await this.analyzeOptimalTimes(platform);
      }

      // Calculate scheduling efficiency (posts scheduled at optimal times vs total posts)
      const posts = await db.getPosts();
      const scheduledPosts = posts.filter(post => post.scheduleDate);
      let optimallyScheduled = 0;

      for (const post of scheduledPosts) {
        if (post.scheduleDate && post.socialMediaPosts) {
          const postPlatforms = Object.keys(post.socialMediaPosts);
          const isOptimal = postPlatforms.some(platform => {
            const optimalTimes = platformOptimalTimes[platform] || [];
            const postHour = post.scheduleDate!.getHours();
            const postDay = post.scheduleDate!.getDay();
            
            return optimalTimes.some(slot => {
              const [slotHour] = slot.time.split(':').map(Number);
              return Math.abs(slotHour - postHour) <= 1 && slot.dayOfWeek === postDay;
            });
          });
          
          if (isOptimal) optimallyScheduled++;
        }
      }

      const schedulingEfficiency = scheduledPosts.length > 0 ? 
        (optimallyScheduled / scheduledPosts.length) * 100 : 0;

      return {
        averageEngagementByHour,
        bestPerformingDays,
        platformOptimalTimes,
        schedulingEfficiency
      };

    } catch (error) {
      console.error('Error getting scheduling analytics:', error);
      throw new Error('Failed to get scheduling analytics');
    }
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();