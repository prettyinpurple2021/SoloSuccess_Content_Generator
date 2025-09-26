import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// FIX: Import Timestamp type and rename Timestamp value to avoid name collision.
import { Post, ViewMode, LoadingState, SocialMediaPosts, GeneratedImages } from './types';
import { auth, db, transformPostToDatabasePost, User } from './services/supabaseService';
import * as geminiService from './services/geminiService';
import * as schedulerService from './services/schedulerService';
import * as bloggerService from './services/bloggerService';
import { postScheduler } from './services/postScheduler';
import { CalendarIcon, ListIcon, SparklesIcon, PLATFORMS, TONES, AUDIENCES, Spinner, PLATFORM_CONFIG, CopyIcon } from './constants';
import CalendarView from './components/CalendarView';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    // Core State
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentBlogTopic, setCurrentBlogTopic] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [selectedIdea, setSelectedIdea] = useState('');
    const [blogPost, setBlogPost] = useState('');
    const [postViewMode, setPostViewMode] = useState<'raw' | 'preview'>('preview');
    const [parsedMarkdown, setParsedMarkdown] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [allScheduledPosts, setAllScheduledPosts] = useState<Post[]>([]);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [isLoading, setIsLoading] = useState<LoadingState>({});

    // Unified Post Details Modal State
    const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
    const [selectedPostForDetails, setSelectedPostForDetails] = useState<Post | null>(null);
    const [parsedDetailsContent, setParsedDetailsContent] = useState('');
    
    // AI Feature States
    const [activeCreativeTab, setActiveCreativeTab] = useState('content');
    const [summary, setSummary] = useState('');
    const [headlines, setHeadlines] = useState<string[]>([]);
    const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPosts>({});
    const [socialMediaTones, setSocialMediaTones] = useState<{ [key: string]: string }>({});
    const [socialMediaAudiences, setSocialMediaAudiences] = useState<{ [key: string]: string }>({});
    const [imagePrompts, setImagePrompts] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({});
    const [selectedImageForPost, setSelectedImageForPost] = useState<string | null>(null);
    
    // Repurposing Modal State
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);
    const [repurposingPost, setRepurposingPost] = useState<Post | null>(null);
    const [repurposedContent, setRepurposedContent] = useState('');
    const [parsedRepurposedContent, setParsedRepurposedContent] = useState('');
    
    // Tagging State
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');

    // Blogger Integration State
    const [isBloggerAuthenticated, setIsBloggerAuthenticated] = useState(false);
    const [bloggerBlogs, setBloggerBlogs] = useState<any[]>([]);
    const [selectedBlogId, setSelectedBlogId] = useState<string>('');

    const withLoading = <T extends any[]>(key: string, fn: (...args: T) => Promise<void>) => {
        return async (...args: T) => {
            setIsLoading(prev => ({ ...prev, [key]: true }));
            setErrorMessage('');
            try {
                await fn(...args);
            } catch (error: any) {
                console.error(`Error in ${key}:`, error);
                setErrorMessage(error.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(prev => ({ ...prev, [key]: false }));
            }
        };
    };

    useEffect(() => {
        const { data: { subscription } } = auth.onAuthStateChange(async (user) => {
            if (user) {
                setUser(user);
            } else {
                try {
                    const { user: anonUser, error } = await auth.signInAnonymously();
                    if (error) throw error;
                    setUser(anonUser);
                } catch (error: any) {
                    setErrorMessage(`Authentication failed: ${error.message}.`);
                }
            }
            setIsAuthReady(true);
        });

        const initializeBlogger = async () => {
            if (bloggerService.isBloggerConfigured) {
                try {
                    const isSignedIn = await bloggerService.initClient();
                    setIsBloggerAuthenticated(isSignedIn);
                    if (isSignedIn) {
                        const blogs = await bloggerService.listBlogs();
                        setBloggerBlogs(blogs);
                        if (blogs.length > 0) setSelectedBlogId(blogs[0].id);
                    }
                } catch (error: any) {
                    console.error("Blogger integration error:", error);
                    setErrorMessage("Could not initialize Blogger integration. Ensure API keys are correct.");
                }
            } else {
                console.log("Blogger integration skipped: missing configuration.");
            }
        };

        initializeBlogger();
        
        return () => subscription?.unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!isAuthReady || !user) {
            setAllScheduledPosts([]);
            // Stop scheduler when user is not authenticated
            postScheduler.stop();
            return;
        }

        // Initial load of posts
        const loadPosts = async () => {
            try {
                const posts = await db.getPosts();
                setAllScheduledPosts(posts);
            } catch (error: any) {
                setErrorMessage(`Failed to load posts: ${error.message}`);
            }
        };

        loadPosts();

        // Subscribe to real-time updates
        const subscription = db.subscribeToPosts((posts) => {
            setAllScheduledPosts(posts);
        });

        // Start the post scheduler
        postScheduler.start();

        return () => {
            subscription?.unsubscribe();
            postScheduler.stop();
        };
    }, [isAuthReady, user]);

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    useEffect(() => {
        if (blogPost) {
            Promise.resolve(marked.parse(blogPost)).then(html => setParsedMarkdown(html as string));
        } else {
            setParsedMarkdown('');
        }
    }, [blogPost]);

    useEffect(() => {
        if (selectedPostForDetails?.content) {
            Promise.resolve(marked.parse(selectedPostForDetails.content)).then(html => setParsedDetailsContent(html as string));
        } else {
            setParsedDetailsContent('');
        }
    }, [selectedPostForDetails]);
    
    useEffect(() => {
        if (repurposedContent) {
            Promise.resolve(marked.parse(repurposedContent)).then(html => setParsedRepurposedContent(html as string));
        } else {
            setParsedRepurposedContent('');
        }
    }, [repurposedContent]);

    const clearWorkflow = () => {
        setCurrentBlogTopic('');
        setIdeas([]);
        setSelectedIdea('');
        setBlogPost('');
        setSummary('');
        setHeadlines([]);
        setSuggestedTags([]);
        setSelectedTags([]);
        setSocialMediaPosts({});
        setSocialMediaTones({});
        setSocialMediaAudiences({});
        setImagePrompts([]);
        setGeneratedImages({});
        setSelectedImageForPost(null);
        setEditingPostId(null);
        setPostViewMode('preview');
    };

    const handleGenerateTopic = withLoading('topic', async () => {
        clearWorkflow();
        const topic = await geminiService.generateTopic();
        setCurrentBlogTopic(topic);
    });

    const handleGenerateIdeas = withLoading('ideas', async () => {
        if (!currentBlogTopic) {
            setErrorMessage("Please generate a topic first.");
            return;
        }
        const generatedIdeas = await geminiService.generateIdeas(currentBlogTopic);
        setIdeas(generatedIdeas);
    });

    const handleGeneratePost = withLoading('post', async (idea: string) => {
        setSelectedIdea(idea);
        const postContent = await geminiService.generateBlogPost(idea);
        setBlogPost(postContent);
        setPostViewMode('preview');
        handleGenerateTags(postContent); // Auto-generate tags
    });
    
    const handleGenerateTags = withLoading('tags', async (postContent: string) => {
        if (!postContent) return;
        const tags = await geminiService.generateTags(postContent);
        setSuggestedTags(tags);
        setSelectedTags(tags);
    });

    const handleGenerateSummary = withLoading('summary', async () => {
        const result = await geminiService.generateSummary(blogPost);
        setSummary(result);
    });

    const handleGenerateHeadlines = withLoading('headlines', async () => {
        const results = await geminiService.generateHeadlines(blogPost);
        setHeadlines(results);
    });

    const handleGenerateSocialPost = async (platform: string) => {
        const key = `social-${platform}`;
        setIsLoading(prev => ({ ...prev, [key]: true }));
        setErrorMessage('');
        try {
            const tone = socialMediaTones[platform] || TONES[0];
            const audience = socialMediaAudiences[platform] || AUDIENCES[0];
            const post = await geminiService.generateSocialMediaPost(blogPost, platform, tone, audience);
            setSocialMediaPosts(prev => ({ ...prev, [platform]: post }));
        } catch (error: any) {
            console.error(`Error generating social post for ${platform}:`, error);
            setErrorMessage(error.message || `An unexpected error occurred for ${platform}.`);
        } finally {
            setIsLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleGenerateAllSocialPosts = withLoading('socialAll', async () => {
        const promises = PLATFORMS.map(platform => {
            const tone = socialMediaTones[platform] || TONES[0];
            const audience = socialMediaAudiences[platform] || AUDIENCES[0];
            return geminiService.generateSocialMediaPost(blogPost, platform, tone, audience)
                .then(post => ({ platform, post }))
                .catch(error => {
                    console.error(`Error generating for ${platform} in 'All' mode:`, error);
                    return { platform, post: `Error: Could not generate content for ${platform}.`};
                });
        });
        const results = await Promise.all(promises);
        const newPosts: SocialMediaPosts = {};
        results.forEach(({ platform, post }) => {
            newPosts[platform] = post;
        });
        setSocialMediaPosts(prev => ({ ...prev, ...newPosts }));
    });

    const handleSocialPostChange = (platform: string, value: string) => {
        setSocialMediaPosts(prev => ({...prev, [platform]: value}));
    };
    
    const handleGenerateImagePrompts = withLoading('prompts', async () => {
        const prompts = await geminiService.generateImagePrompts(blogPost);
        setImagePrompts(prompts);
    });

    const handleGenerateImages = withLoading('images', async (prompt: string) => {
        const images = await geminiService.generateImage(prompt);
        setGeneratedImages(prev => ({...prev, [prompt]: images}));
    });

    const handleSaveDraft = withLoading('save', async () => {
        if (!user || !selectedIdea || !blogPost) {
            setErrorMessage("Missing content to save as draft.");
            return;
        }
        const post = {
            topic: currentBlogTopic,
            idea: selectedIdea,
            content: blogPost,
            status: 'draft' as const,
            tags: selectedTags,
            summary,
            headlines,
            socialMediaPosts,
            socialMediaTones,
            socialMediaAudiences,
            createdAt: new Date(),
            selectedImage: selectedImageForPost || undefined,
        };
        
        if (editingPostId) {
            await db.updatePost(editingPostId, transformPostToDatabasePost(post));
            setSuccessMessage("Draft updated successfully!");
        } else {
            await db.addPost(transformPostToDatabasePost(post));
            setSuccessMessage("Draft saved successfully!");
        }
        clearWorkflow();
    });

    const handleSchedulePost = withLoading('schedule', async () => {
        if (!user || !scheduleDate || (!editingPostId && (!selectedIdea || !blogPost))) {
            setErrorMessage("Missing content or schedule date.");
            return;
        }

        // Request notification permission for scheduled posts
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        const scheduledDate = new Date(scheduleDate);
        const postData = editingPostId ? allScheduledPosts.find(p => p.id === editingPostId) : null;
        
        const post = {
            topic: postData?.topic ?? currentBlogTopic,
            idea: postData?.idea ?? selectedIdea,
            content: postData?.content ?? blogPost,
            status: 'scheduled' as const,
            tags: postData?.tags ?? selectedTags,
            summary: postData?.summary ?? summary,
            headlines: postData?.headlines ?? headlines,
            scheduleDate: scheduledDate,
            socialMediaPosts: postData?.socialMediaPosts ?? socialMediaPosts,
            socialMediaTones: postData?.socialMediaTones ?? socialMediaTones,
            socialMediaAudiences: postData?.socialMediaAudiences ?? socialMediaAudiences,
            selectedImage: postData?.selectedImage ?? selectedImageForPost ?? undefined,
            createdAt: postData?.createdAt ?? new Date(),
        };
        
        if (editingPostId) {
            await db.updatePost(editingPostId, transformPostToDatabasePost(post));
            setSuccessMessage("Post rescheduled successfully!");
        } else {
            await db.addPost(transformPostToDatabasePost(post));
            setSuccessMessage("Post scheduled successfully!");
        }
        
        setShowScheduleModal(false);
        setScheduleDate('');
        clearWorkflow();
    });

    const handleDeletePost = withLoading('delete', async (postId: string) => {
        if (!user) return;
        if (window.confirm("Are you sure you want to delete this post?")) {
            await db.deletePost(postId);
            setSuccessMessage("Post deleted.");
            if (showPostDetailsModal) {
              setShowPostDetailsModal(false);
              setSelectedPostForDetails(null);
            }
        }
    });

    const populateFormForEditing = (post: Post) => {
        clearWorkflow();
        setCurrentBlogTopic(post.topic);
        setIdeas([post.idea]);
        setSelectedIdea(post.idea);
        setBlogPost(post.content);
        setPostViewMode('preview');
        setSummary(post.summary || '');
        setHeadlines(post.headlines || []);
        setSelectedTags(post.tags);
        setSuggestedTags(post.tags);
        setSocialMediaPosts(post.socialMediaPosts);
        setSocialMediaTones(post.socialMediaTones || {});
        setSocialMediaAudiences(post.socialMediaAudiences || {});
        setSelectedImageForPost(post.selectedImage || null);
        setEditingPostId(post.id);
        setShowPostDetailsModal(false);
        setSelectedPostForDetails(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePostClick = (post: Post) => {
        setSelectedPostForDetails(post);
        setShowPostDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowPostDetailsModal(false);
        setSelectedPostForDetails(null);
    };
    
    const handleOpenSchedulerForExisting = (post: Post) => {
        setEditingPostId(post.id);
        const now = new Date();
        const schedule = post.scheduleDate && post.scheduleDate > now ? post.scheduleDate : now;
        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const pad = (num: number) => num.toString().padStart(2, '0');
        const formattedDate = `${schedule.getFullYear()}-${pad(schedule.getMonth() + 1)}-${pad(schedule.getDate())}T${pad(schedule.getHours())}:${pad(schedule.getMinutes())}`;
        setScheduleDate(formattedDate);
        setShowScheduleModal(true);
        handleCloseDetailsModal();
    };

    const handleStartRepurposing = () => {
        if (!selectedPostForDetails) return;
        setRepurposingPost(selectedPostForDetails);
        setShowRepurposeModal(true);
        handleCloseDetailsModal();
    };
    
    const handleRepurposeContent = withLoading('repurpose', async (format: string) => {
        if (!repurposingPost) return;
        const content = await geminiService.repurposeContent(repurposingPost.content, format);
        setRepurposedContent(content);
    });

    const handleCopyRepurposed = () => {
        navigator.clipboard.writeText(repurposedContent);
        setSuccessMessage('Content copied to clipboard!');
    };

    const handleBackToFormats = () => {
        setRepurposedContent('');
        setParsedRepurposedContent('');
    };

    const handleCopyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setSuccessMessage(`${type} copied to clipboard!`);
    };

    const handleBloggerAuth = withLoading('bloggerAuth', async () => {
        await bloggerService.handleAuthClick();
        setIsBloggerAuthenticated(true);
        const blogs = await bloggerService.listBlogs();
        setBloggerBlogs(blogs);
        if (blogs.length > 0) setSelectedBlogId(blogs[0].id);
    });
    
    const handlePostToBlogger = withLoading('bloggerPost', async () => {
        if (!selectedBlogId) {
            setErrorMessage("Please select a blog to post to.");
            return;
        }
        await bloggerService.createPost(selectedBlogId, selectedIdea, parsedMarkdown, selectedTags);
        setSuccessMessage("Successfully posted to Blogger!");
    });
    
    const getStatusPill = (status: string) => {
        const baseClasses = "status-pill";
        switch (status) {
            case 'posted': return `${baseClasses} status-posted`;
            case 'scheduled': return `${baseClasses} status-scheduled`;
            case 'draft': return `${baseClasses} status-draft`;
            default: return `${baseClasses} status-draft`;
        }
    };
    
    const creativeTabs = [
      { id: 'content', label: 'Content Tools' },
      { id: 'tags', label: 'SEO & Tags' },
      { id: 'social', label: 'Social Media' },
      { id: 'image', label: 'Image Generation' },
      { id: 'publish', label: 'Publishing' },
    ];
    
    if (!isAuthReady) {
        return <div className="flex justify-center items-center h-screen"><Spinner className="h-12 w-12" /></div>;
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
            {/* Background Sparkles */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="sparkle" style={{top: '10%', left: '10%', animationDelay: '0s'}}></div>
                <div className="sparkle" style={{top: '20%', right: '15%', animationDelay: '0.5s'}}></div>
                <div className="sparkle" style={{bottom: '30%', left: '20%', animationDelay: '1s'}}></div>
                <div className="sparkle" style={{bottom: '10%', right: '10%', animationDelay: '1.5s'}}></div>
                <div className="sparkle" style={{top: '50%', left: '5%', animationDelay: '2s'}}></div>
                <div className="sparkle" style={{top: '70%', right: '25%', animationDelay: '2.5s'}}></div>
            </div>

            <header className="text-center mb-16 relative">
                <div className="relative inline-block">
                    <h1 className="text-6xl sm:text-8xl font-display gradient-text tracking-wider mb-4 relative">
                        SoloSuccess AI
                        <div className="sparkle" style={{top: '10px', right: '10px'}}></div>
                        <div className="sparkle" style={{bottom: '10px', left: '10px'}}></div>
                    </h1>
                </div>
                <h2 className="text-2xl sm:text-3xl font-accent text-white mb-6 font-bold">
                    Your Empire. Your Vision. Your AI DreamTeam.
                </h2>
                <p className="max-w-3xl mx-auto text-lg text-white/90 font-medium leading-relaxed">
                    Your AI-powered partner for building your empire and achieving 
                    <span className="gradient-text font-bold"> extraordinary success</span>
                </p>
                {user && (
                    <div className="mt-4 flex justify-center">
                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                            <div className={`w-2 h-2 rounded-full ${postScheduler.getStatus().isRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-white/80">
                                Scheduler {postScheduler.getStatus().isRunning ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Workflow */}
                <div className="flex flex-col gap-8">
                    {/* Step 1: Topic */}
                    <section className="glass-card relative">
                        <div className="sparkle"></div>
                        <div className="sparkle"></div>
                        <div className="sparkle"></div>
                        <div className="sparkle"></div>
                        <div className="glass-card-inner">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-3xl font-display font-black text-white">✨ Step 1: Discover a Topic</h3>
                                <button 
                                    onClick={handleGenerateTopic} 
                                    disabled={isLoading.topic} 
                                    className="holographic-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading.topic ? <Spinner /> : <SparklesIcon />}
                                    {isLoading.topic ? 'Discovering...' : 'Discover Magic'}
                                </button>
                            </div>
                            {currentBlogTopic && (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/30 backdrop-filter blur-15">
                                    <p className="text-xl font-bold text-white">{currentBlogTopic}</p>
                                </div>
                            )}
                        </div>
                    </section>
                    
                    {/* Step 2: Ideas */}
                    {currentBlogTopic && (
                         <section className="glass-card relative">
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="glass-card-inner">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-3xl font-display font-black text-white">🚀 Step 2: Generate Ideas</h3>
                                    <button 
                                        onClick={handleGenerateIdeas} 
                                        disabled={!currentBlogTopic || isLoading.ideas} 
                                        className="holographic-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading.ideas ? <Spinner /> : <SparklesIcon />}
                                        {isLoading.ideas ? 'Generating...' : 'Generate Ideas'}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {ideas.map((idea, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => handleGeneratePost(idea)} 
                                            disabled={isLoading.post} 
                                            className={`text-left p-4 rounded-xl font-semibold transition-all duration-300 border backdrop-filter blur-15 ${
                                                selectedIdea === idea 
                                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-white shadow-lg glow-pulse' 
                                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30'
                                            }`}
                                        >
                                            {idea}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                    
                    {/* Step 3: Blog Post */}
                    {blogPost && (
                        <section className="glass-card relative">
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="glass-card-inner">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-3xl font-display font-black text-white">📝 Step 3: Your AI-Generated Post</h3>
                                    <div className="flex items-center gap-2 p-2 bg-white/10 rounded-xl border border-white/20 backdrop-filter blur-15">
                                        <button 
                                            onClick={() => setPostViewMode('raw')} 
                                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                                postViewMode === 'raw' 
                                                    ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg' 
                                                    : 'text-white hover:bg-white/10'
                                            }`}
                                        >
                                            Markdown
                                        </button>
                                        <button 
                                            onClick={() => setPostViewMode('preview')} 
                                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                                postViewMode === 'preview' 
                                                    ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg' 
                                                    : 'text-white hover:bg-white/10'
                                            }`}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                </div>
                            {selectedImageForPost && (
                                <div className="mb-4">
                                    <img src={selectedImageForPost} alt="Selected for post" className="rounded-lg w-full object-cover max-h-64" />
                                </div>
                            )}
                            {postViewMode === 'preview' ? (
                                <div className="prose max-w-none h-64 overflow-y-auto p-4 border border-border rounded-lg" dangerouslySetInnerHTML={{ __html: parsedMarkdown }}></div>
                            ) : (
                                <textarea
                                    value={blogPost}
                                    onChange={(e) => setBlogPost(e.target.value)}
                                    className="glass-input w-full h-64 font-mono text-sm resize-none"
                                    aria-label="Blog post markdown content"
                                />
                            )}
                            </div>
                        </section>
                    )}

                    {/* Step 4: Enhance & Distribute */}
                    {blogPost && (
                        <section className="glass-card relative">
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="sparkle"></div>
                            <div className="glass-card-inner">
                                <h3 className="text-3xl font-display font-black text-white mb-6">🎨 Step 4: Enhance &amp; Distribute</h3>
                             <div className="flex flex-wrap border-b border-border mb-4 -mx-2">
                                {creativeTabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveCreativeTab(tab.id)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeCreativeTab === tab.id ? 'text-secondary border-secondary' : 'text-muted-foreground border-transparent hover:text-white'}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Tools Tab */}
                            {activeCreativeTab === 'content' && (
                                <div className="space-y-6">
                                    <div>
                                        <button 
                                            onClick={handleGenerateSummary} 
                                            disabled={isLoading.summary} 
                                            className="holographic-btn disabled:opacity-50 mb-4"
                                        >
                                            {isLoading.summary ? <Spinner /> : <SparklesIcon />} Generate Summary
                                        </button>
                                        {summary && (
                                            <div className="p-4 bg-white/10 border border-white/20 rounded-xl backdrop-filter blur-15">
                                                <p className="text-white font-medium">{summary}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <button 
                                            onClick={handleGenerateHeadlines} 
                                            disabled={isLoading.headlines} 
                                            className="holographic-btn disabled:opacity-50 mb-4"
                                        >
                                            {isLoading.headlines ? <Spinner /> : <SparklesIcon />} Generate Headlines
                                        </button>
                                        {headlines.length > 0 && (
                                            <div className="p-4 bg-white/10 border border-white/20 rounded-xl backdrop-filter blur-15">
                                                <ul className="space-y-2 list-disc list-inside text-white">
                                                    {headlines.map((h, i) => <li key={i} className="font-medium">{h}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tags Tab */}
                            {activeCreativeTab === 'tags' && (
                                <div>
                                    <h4 className="font-semibold mb-2 text-primary-foreground">Suggested Tags</h4>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {suggestedTags.map(tag => (
                                            <button 
                                                key={tag} 
                                                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} 
                                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all border backdrop-filter blur-10 ${
                                                    selectedTags.includes(tag) 
                                                        ? 'bg-gradient-to-r from-purple-500/60 to-pink-500/60 text-white border-purple-400/50 shadow-lg' 
                                                        : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-white/30'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={customTag} 
                                            onChange={e => setCustomTag(e.target.value)} 
                                            placeholder="Add custom tag..." 
                                            className="glass-input w-full" 
                                        />
                                        <button 
                                            onClick={() => { 
                                                if(customTag && !selectedTags.includes(customTag)) 
                                                    setSelectedTags(prev => [...prev, customTag]); 
                                                setCustomTag(''); 
                                            }} 
                                            className="holographic-btn"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Social Media Tab */}
                            {activeCreativeTab === 'social' && (
                                <div className="space-y-6">
                                    <div className="flex justify-end">
                                        <button onClick={handleGenerateAllSocialPosts} disabled={isLoading.socialAll} className="flex items-center gap-2 bg-gradient-to-br from-secondary to-accent hover:shadow-neon-accent transition-all duration-300 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                            {isLoading.socialAll ? <Spinner /> : <SparklesIcon />}
                                            {isLoading.socialAll ? 'Generating All...' : 'Generate For All Platforms'}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {PLATFORMS.map(platform => {
                                            const config = PLATFORM_CONFIG[platform];
                                            const Icon = config.icon;
                                            const post = socialMediaPosts[platform] || '';
                                            const platformLoadingKey = `social-${platform}`;
                                            const isLoadingPlatform = isLoading[platformLoadingKey] || isLoading.socialAll;

                                            return (
                                                <div key={platform} className="glass-card p-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <Icon className="h-8 w-8 text-primary-foreground flex-shrink-0" />
                                                            <h4 className="font-bold text-xl text-primary-foreground">{platform}</h4>
                                                        </div>
                                                        <button onClick={() => handleGenerateSocialPost(platform)} disabled={isLoadingPlatform} className="flex-shrink-0 flex items-center justify-center gap-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 min-w-[110px]">
                                                            {isLoading[platformLoadingKey] ? <Spinner className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                                                            <span>{isLoading[platformLoadingKey] ? 'Generating' : 'Generate'}</span>
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                                                        <select value={socialMediaTones[platform] || TONES[0]} onChange={e => setSocialMediaTones(prev => ({ ...prev, [platform]: e.target.value }))} className="bg-muted border border-border rounded-lg px-2 py-1.5 w-full text-sm">
                                                            {TONES.map(t => <option key={t} value={t}>{t} Tone</option>)}
                                                        </select>
                                                        <select value={socialMediaAudiences[platform] || AUDIENCES[0]} onChange={e => setSocialMediaAudiences(prev => ({ ...prev, [platform]: e.target.value }))} className="bg-muted border border-border rounded-lg px-2 py-1.5 w-full text-sm">
                                                            {AUDIENCES.map(a => <option key={a} value={a}>{a} Audience</option>)}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="mt-2">
                                                        {isLoadingPlatform ? (
                                                            <div className="h-32 flex flex-col items-center justify-center bg-muted/30 rounded-lg text-muted-foreground">
                                                                <Spinner className="h-8 w-8" />
                                                                <span className="mt-2 text-sm">AI is drafting your post...</span>
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={post}
                                                                onChange={(e) => handleSocialPostChange(platform, e.target.value)}
                                                                placeholder={`Click 'Generate' to create content for ${platform}...`}
                                                                className="w-full h-32 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground focus:ring-secondary focus:border-secondary resize-y"
                                                                aria-label={`${platform} post content`}
                                                            />
                                                        )}
                                                        
                                                        {!isLoadingPlatform && (
                                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 px-1">
                                                                {config.charLimit ? (
                                                                    <span className={post.length > config.charLimit ? 'text-red-500 font-bold' : ''}>
                                                                        {post.length} / {config.charLimit}
                                                                    </span>
                                                                ) : <span />}
                                                                {post && (
                                                                    <button onClick={() => handleCopyToClipboard(post, `${platform} post`)} className="font-semibold hover:text-secondary flex items-center gap-1">
                                                                        <CopyIcon className="h-4 w-4" /> Copy
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Image Generation Tab */}
                            {activeCreativeTab === 'image' && (
                                <div className="space-y-4">
                                    <button onClick={handleGenerateImagePrompts} disabled={isLoading.prompts} className="flex items-center gap-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                        {isLoading.prompts ? <Spinner/> : <SparklesIcon/>} Generate Image Ideas
                                    </button>
                                    {imagePrompts.map(prompt => (
                                        <div key={prompt}>
                                            <button onClick={() => handleGenerateImages(prompt)} className="text-left p-3 rounded-lg bg-muted hover:bg-muted/70 w-full mb-2">{prompt}</button>
                                            {isLoading.images && <Spinner/>}
                                            <div className="grid grid-cols-3 gap-2">
                                                {generatedImages[prompt]?.map(imgSrc => (
                                                    <img key={imgSrc} src={imgSrc} onClick={() => setSelectedImageForPost(imgSrc)} className={`rounded-lg cursor-pointer border-4 ${selectedImageForPost === imgSrc ? 'border-accent' : 'border-transparent'}`} alt={prompt} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Publishing Tab */}
                            {activeCreativeTab === 'publish' && (
                                <div className="space-y-4">
                                     <button onClick={() => handleCopyToClipboard(parsedMarkdown, "HTML")} className="bg-secondary/80 hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg w-full">Copy for Blogger (HTML)</button>
                                     <div className="border-t border-border pt-4">
                                         <h4 className="font-semibold mb-2 text-primary-foreground">Post directly to Blogger</h4>
                                         {isBloggerAuthenticated ? (
                                             bloggerBlogs.length > 0 ? (
                                                 <div className="flex gap-2">
                                                     <select value={selectedBlogId} onChange={e => setSelectedBlogId(e.target.value)} className="bg-muted border border-border rounded-lg px-2 py-1 w-full">
                                                         {bloggerBlogs.map(blog => <option key={blog.id} value={blog.id}>{blog.name}</option>)}
                                                     </select>
                                                     <button onClick={handlePostToBlogger} disabled={isLoading.bloggerPost} className="flex items-center justify-center gap-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                                         {isLoading.bloggerPost ? <Spinner/> : 'Post'}
                                                     </button>
                                                 </div>
                                             ) : <p>No blogs found on your Blogger account.</p>
                                         ) : (
                                             <button onClick={handleBloggerAuth} disabled={isLoading.bloggerAuth} className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                                 {isLoading.bloggerAuth ? <Spinner/> : 'Connect to Blogger'}
                                             </button>
                                         )}
                                     </div>
                                </div>
                            )}

                             <div className="flex justify-end gap-4 mt-6 border-t border-border pt-4">
                               <button onClick={handleSaveDraft} disabled={isLoading.save} className="bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{isLoading.save ? 'Saving...' : 'Save Draft'}</button>
                               <button onClick={() => setShowScheduleModal(true)} className="bg-gradient-to-br from-primary to-accent hover:shadow-neon-primary text-white font-bold py-2 px-4 rounded-lg">Schedule</button>
                           </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Content Library */}
                <div className="glass-card relative">
                    <div className="sparkle"></div>
                    <div className="sparkle"></div>
                    <div className="sparkle"></div>
                    <div className="sparkle"></div>
                    <div className="glass-card-inner">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-4xl font-display font-black text-white">📚 Content Library</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 p-2 bg-white/10 rounded-xl border border-white/20 backdrop-filter blur-15">
                                    <button 
                                        onClick={() => setViewMode('list')} 
                                        className={`p-3 rounded-lg transition-all ${
                                            viewMode === 'list' 
                                                ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg' 
                                                : 'text-white hover:bg-white/10'
                                        }`} 
                                        aria-label="List view"
                                    >
                                        <ListIcon />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('calendar')} 
                                        className={`p-3 rounded-lg transition-all ${
                                            viewMode === 'calendar' 
                                                ? 'bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg' 
                                                : 'text-white hover:bg-white/10'
                                        }`} 
                                        aria-label="Calendar view"
                                    >
                                        <CalendarIcon />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => postScheduler.triggerCheck()} 
                                    className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded-lg border border-green-500/30 transition-all"
                                    title="Check for posts to publish now"
                                >
                                    Check Now
                                </button>
                            </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                            {allScheduledPosts.map(post => (
                                <div key={post.id} onClick={() => handlePostClick(post)} className="glass-card p-4 flex justify-between items-center cursor-pointer hover:border-accent transition-all duration-300">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        {post.selectedImage && (
                                            <img src={post.selectedImage} alt={post.idea} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                        )}
                                        <div className="truncate">
                                            <p className="font-bold text-lg text-primary-foreground truncate">{post.idea}</p>
                                            <p className="text-sm text-muted-foreground">{post.scheduleDate ? `Scheduled: ${post.scheduleDate.toLocaleDateString()}` : 'Draft'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                        {getStatusPill(post.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <CalendarView posts={allScheduledPosts} onPostClick={handlePostClick} />
                    )}
                    </div>
                </div>
            </main>

            {/* Post Details Modal */}
            {showPostDetailsModal && selectedPostForDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={handleCloseDetailsModal}>
                    <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border">
                            <h3 className="text-2xl font-display text-secondary">{selectedPostForDetails.idea}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusPill(selectedPostForDetails.status)}
                              {selectedPostForDetails.scheduleDate && <span className="text-sm text-muted-foreground">Scheduled for: {selectedPostForDetails.scheduleDate.toLocaleDateString()}</span>}
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow">
                            {selectedPostForDetails.selectedImage && (
                                <img src={selectedPostForDetails.selectedImage} alt={selectedPostForDetails.idea} className="rounded-lg w-full object-cover max-h-80 mb-6" />
                            )}
                           <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: parsedDetailsContent }}></div>
                        </div>
                        <div className="p-4 bg-muted/30 border-t border-border flex flex-wrap justify-end gap-3">
                           <button onClick={() => handleOpenSchedulerForExisting(selectedPostForDetails)} className="bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg">Reschedule</button>
                           <button onClick={() => populateFormForEditing(selectedPostForDetails)} className="bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg">Edit</button>
                           <button onClick={handleStartRepurposing} className="bg-secondary/80 hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg">Repurpose</button>
                           <button onClick={() => handleDeletePost(selectedPostForDetails.id)} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Delete</button>
                           <button onClick={handleCloseDetailsModal} className="bg-muted hover:bg-muted/70 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Repurpose Modal */}
            {showRepurposeModal && repurposingPost && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={() => setShowRepurposeModal(false)}>
                    <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border">
                            <h3 className="text-2xl font-display text-secondary">Repurpose Content</h3>
                            <p className="text-muted-foreground">Transform your blog post for a new audience.</p>
                        </div>

                       <div className="p-6 overflow-y-auto flex-grow">
                            {isLoading.repurpose ? (
                                <div className="flex flex-col justify-center items-center h-full">
                                    <Spinner className="w-12 h-12" />
                                    <p className="mt-4 text-lg">AI is working its magic...</p>
                                </div>
                            ) : repurposedContent ? (
                                <>
                                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: parsedRepurposedContent }}></div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                    {['Video Script', 'Email Newsletter', 'LinkedIn Article'].map((format) => (
                                        <button key={format} onClick={() => handleRepurposeContent(format)} className="glass-card p-6 rounded-xl border-2 border-transparent hover:border-secondary transition-all group">
                                            <div className="text-5xl mb-3 transition-transform group-hover:scale-110">{format === 'Video Script' ? '🎬' : format === 'Email Newsletter' ? '✉️' : '💼'}</div>
                                            <h4 className="text-lg font-bold text-primary-foreground">{format}</h4>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                         <div className="p-4 bg-muted/30 border-t border-border flex flex-wrap justify-end gap-3">
                            {repurposedContent && (
                                <>
                                    <button onClick={handleBackToFormats} className="bg-muted hover:bg-muted/70 text-white font-bold py-2 px-4 rounded-lg">Back to Formats</button>
                                    <button onClick={handleCopyRepurposed} className="bg-gradient-to-br from-primary to-accent hover:shadow-neon-primary text-white font-bold py-2 px-4 rounded-lg">Copy Content</button>
                                </>
                            )}
                            <button onClick={() => { setShowRepurposeModal(false); setRepurposedContent(''); }} className="bg-muted hover:bg-muted/70 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                         </div>
                    </div>
                 </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={() => setShowScheduleModal(false)}>
                    <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-2xl font-display text-secondary mb-4">Schedule Your Post</h3>
                            <p className="text-muted-foreground mb-6">
                                Select a precise date and time for this post to be published.
                            </p>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="schedule-date" className="font-semibold text-primary-foreground">
                                    Publication Date & Time
                                </label>
                                <input
                                    id="schedule-date"
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="bg-muted border border-border rounded-lg px-3 py-2 w-full text-foreground"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="bg-muted hover:bg-muted/70 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSchedulePost}
                                disabled={isLoading.schedule || !scheduleDate}
                                className="flex items-center justify-center gap-2 w-44 bg-gradient-to-br from-primary to-accent hover:shadow-neon-primary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                {isLoading.schedule ? <Spinner /> : null}
                                {isLoading.schedule ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {(successMessage || errorMessage) && (
                <div className={`fixed bottom-5 right-5 glass-card p-4 rounded-lg border-l-4 ${successMessage ? 'border-secondary' : 'border-red-500'}`}>
                    <p>{successMessage || errorMessage}</p>
                </div>
            )}
        </div>
    );
};

export default App;