import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bug } from '../constants';

// Simple SVG icon components to replace lucide-react dependencies
const Lightbulb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h4v2h-4v-2zm0-6h4v4h-4v-4zm0-6h4v4h-4V5z" />
  </svg>
);

const Star: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ThumbsUp: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l5.15-12.15c.1-.23.16-.49.16-.77z" />
  </svg>
);

const ThumbsDown: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3H7c-.83 0-1.54.5-1.84 1.22l-5.15 12.15c-.1.23-.16.49-.16.77v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm-4 12h4V3h-4v12z" />
  </svg>
);

const MessageSquare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

const AlertTriangle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const CheckCircle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const X: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

const User: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const Mail: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const Send: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16820253 C3.34915502,0.9110051 2.40734225,1.0681025 1.77946707,1.4754973 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4379088 C3.03521743,10.5950061 3.34915502,10.7521035 3.50612381,10.7521035 L16.6915026,11.5375905 C16.6915026,11.5375905 17.1624089,11.5375905 17.1624089,12.0088826 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
  </svg>
);

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'compliment' | 'question' | 'error';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';

export interface FeedbackData {
  id: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
  userEmail?: string;
  userName?: string;
  context?: {
    url: string;
    userAgent: string;
    timestamp: string;
    errorId?: string;
    featureName?: string;
    userId?: string;
    sessionId?: string;
  };
  attachments?: File[];
  rating?: number; // 1-5 stars
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    feedback: Omit<FeedbackData, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  defaultType?: FeedbackType;
  defaultContext?: Partial<FeedbackData['context']>;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'improvement',
  defaultContext,
  position = 'bottom-right',
}) => {
  const [step, setStep] = useState<'type' | 'details' | 'contact' | 'submitting' | 'success'>(
    'type'
  );
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(defaultType);
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackTypes = [
    {
      type: 'bug' as FeedbackType,
      icon: Bug,
      label: 'Bug Report',
      color: 'text-red-600',
      description: 'Something isn&apos;t working',
    },
    {
      type: 'feature' as FeedbackType,
      icon: Lightbulb,
      label: 'Feature Request',
      color: 'text-blue-600',
      description: 'Suggest a new feature',
    },
    {
      type: 'improvement' as FeedbackType,
      icon: Star,
      label: 'Improvement',
      color: 'text-yellow-600',
      description: 'Make something better',
    },
    {
      type: 'compliment' as FeedbackType,
      icon: ThumbsUp,
      label: 'Compliment',
      color: 'text-green-600',
      description: 'Share positive feedback',
    },
    {
      type: 'question' as FeedbackType,
      icon: MessageSquare,
      label: 'Question',
      color: 'text-purple-600',
      description: 'Ask for help',
    },
    {
      type: 'error' as FeedbackType,
      icon: AlertTriangle,
      label: 'Error Report',
      color: 'text-orange-600',
      description: 'Report an error',
    },
  ];

  const priorityLevels = [
    {
      level: 'low' as FeedbackPriority,
      label: 'Low',
      color: 'text-gray-600',
      description: 'Nice to have',
    },
    {
      level: 'medium' as FeedbackPriority,
      label: 'Medium',
      color: 'text-blue-600',
      description: 'Should be addressed',
    },
    {
      level: 'high' as FeedbackPriority,
      label: 'High',
      color: 'text-orange-600',
      description: 'Important issue',
    },
    {
      level: 'critical' as FeedbackPriority,
      label: 'Critical',
      color: 'text-red-600',
      description: 'Urgent problem',
    },
  ];

  const resetForm = useCallback(() => {
    setStep('type');
    setFeedbackType(defaultType);
    setPriority('medium');
    setTitle('');
    setDescription('');
    setUserEmail('');
    setUserName('');
    setRating(0);
    setAttachments([]);
    setIsSubmitting(false);
  }, [defaultType]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      // Allow common file types
      const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/json'];
      if (!allowedTypes.some((type) => file.type.startsWith(type))) {
        alert(`File ${file.name} is not a supported type.`);
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles].slice(0, 3)); // Max 3 files
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setStep('submitting');

    try {
      const feedbackData: Omit<FeedbackData, 'id' | 'status' | 'createdAt' | 'updatedAt'> = {
        type: feedbackType,
        priority,
        title: title.trim(),
        description: description.trim(),
        userEmail: userEmail.trim() || undefined,
        userName: userName.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...defaultContext,
        },
      };

      await onSubmit(feedbackData);
      setStep('success');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
      setStep('details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 w-96 max-w-[calc(100vw-2rem)]`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              title="Close feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'type' && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">What type of feedback do you have?</h4>
              <div className="space-y-2">
                {feedbackTypes.map(({ type, icon: Icon, label, color, description }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFeedbackType(type);
                      setStep('details');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                      feedbackType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    title={`Select ${label} type`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <div className="font-medium text-gray-900">{label}</div>
                        <div className="text-sm text-gray-600">{description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Tell us more</h4>
                <button
                  onClick={() => setStep('type')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change type
                </button>
              </div>

              {/* Priority for bugs and errors */}
              {(feedbackType === 'bug' || feedbackType === 'error') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="grid grid-cols-2 gap-2">
                    {priorityLevels.map(({ level, label, color }) => (
                      <button
                        key={level}
                        onClick={() => setPriority(level)}
                        className={`p-2 text-sm rounded border transition-colors ${
                          priority === level
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={color}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating for compliments */}
              {feedbackType === 'compliment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate your experience?
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                        title={`Rate ${star} stars`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about your feedback..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters
                </div>
              </div>

              {/* File attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (optional)
                </label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-800"
                        title={`Remove ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {attachments.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 transition-colors"
                    >
                      + Add file (max 5MB)
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,text/*,.pdf,.json"
                  title="Upload attachments"
                  aria-label="File input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('contact')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <button
                  onClick={() => setStep('details')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Back
                </button>
              </div>

              <p className="text-sm text-gray-600">
                Optional: Provide your contact information if you'd like us to follow up with you.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </button>
                <button
                  onClick={() => setStep('details')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 'submitting' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h4 className="font-medium text-gray-900 mb-2">Submitting your feedback...</h4>
              <p className="text-sm text-gray-600">Please wait while we process your submission.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">Thank you for your feedback!</h4>
              <p className="text-sm text-gray-600 mb-4">
                We've received your feedback and will review it shortly.
                {userEmail && " We'll follow up with you via email if needed."}
              </p>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Floating feedback button
 */
export const FeedbackButton: React.FC<{
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}> = ({ onClick, position = 'bottom-right', className = '' }) => {
  const positionClasses = position === 'bottom-left' ? 'bottom-4 left-4' : 'bottom-4 right-4';

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses} z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${className}`}
      title="Send Feedback"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
};

/**
 * Quick feedback component for inline use
 */
export const QuickFeedback: React.FC<{
  onFeedback: (_type: 'positive' | 'negative', _comment?: string) => void;
  className?: string;
}> = ({ onFeedback, className = '' }) => {
  const [showComment, setShowComment] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (showComment === type) {
      onFeedback(type, comment.trim() || undefined);
      setShowComment(null);
      setComment('');
    } else {
      setShowComment(type);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Was this helpful?</span>
        <button
          onClick={() => handleFeedback('positive')}
          className={`p-1 rounded transition-colors ${
            showComment === 'positive'
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:text-green-600'
          }`}
          title="This was helpful"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          className={`p-1 rounded transition-colors ${
            showComment === 'negative'
              ? 'text-red-600 bg-red-50'
              : 'text-gray-400 hover:text-red-600'
          }`}
          title="This was not helpful"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {showComment && (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell us more about your ${showComment} experience...`}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={200}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback(showComment)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowComment(null);
                setComment('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing feedback state
 */
export const useFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackData[]>([]);

  const openFeedback = useCallback(
    (type?: FeedbackType, context?: Partial<FeedbackData['context']>) => {
      setIsOpen(true);
    },
    []
  );

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  const submitFeedback = useCallback(
    async (
      feedbackData: Omit<FeedbackData, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    ): Promise<void> => {
      // In a real app, this would send to your backend
      const feedback: FeedbackData = {
        ...feedbackData,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store locally for demo purposes
      setFeedbackHistory((prev) => [feedback, ...prev]);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Feedback submitted:', feedback);
    },
    []
  );

  return {
    isOpen,
    feedbackHistory,
    openFeedback,
    closeFeedback,
    submitFeedback,
  };
};

export default FeedbackWidget;
