// Media utility functions for course lessons

/**
 * Extract YouTube video ID from various URL formats
 * @param url - YouTube URL (full URL, short URL, or embed URL)
 * @returns videoId or null if not found
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtu.be short URLs
  if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/')[1];
    return parts?.split('?')[0] || null;
  }
  
  // Handle embed URLs
  if (url.includes('/embed/')) {
    const parts = url.split('/embed/')[1];
    return parts?.split('?')[0] || null;
  }
  
  // Handle regular watch URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}

/**
 * Generate YouTube embed URL from video ID or URL
 * @param input - YouTube URL or video ID
 * @returns embed URL
 */
export function getYouTubeEmbedUrl(input: string): string {
  const videoId = getYouTubeVideoId(input);
  return videoId 
    ? `https://www.youtube.com/embed/${videoId}` 
    : '';
}

/**
 * Check if a URL is a YouTube URL
 * @param url - URL to check
 * @returns true if YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Check if a URL is a PDF URL
 * @param url - URL to check
 * @returns true if PDF URL
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf') || url.includes('pdf');
}

/**
 * Generate embed URL for PDF
 * @param url - PDF URL
 * @returns Direct PDF URL for browser native viewer
 */
export function getPdfEmbedUrl(url: string): string {
  if (!url) return '';
  // Use direct PDF URL - browsers have built-in PDF viewers
  // This avoids third-party service restrictions
  return url;
}

/**
 * Check if browser supports inline PDF viewing
 * @returns true if browser supports PDF embedding
 */
export function supportsInlinePdf(): boolean {
  // Most modern browsers support PDF embedding
  // Chrome, Firefox, Safari, Edge all support it
  const ua = navigator.userAgent.toLowerCase();
  // Mobile browsers often have issues with PDF embedding
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
  return !isMobile;
}

/**
 * Lesson content validation helpers
 */
export const lessonTypeHints: Record<string, { placeholder: string; example: string }> = {
  Video: {
    placeholder: 'YouTube URL (e.g., https://www.youtube.com/watch?v=...)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  PDF: {
    placeholder: 'PDF URL (e.g., https://example.com/document.pdf)',
    example: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  Link: {
    placeholder: 'External URL (e.g., https://example.com)',
    example: 'https://developer.mozilla.org'
  },
  Text: {
    placeholder: 'Enter text or HTML content...',
    example: '<p>This is a <strong>text lesson</strong> with <a href="#">links</a>.</p>'
  }
};

/**
 * Validate lesson content based on type
 * @param type - Lesson type
 * @param content - Content to validate
 * @returns validation result
 */
export function validateLessonContent(type: string, content: string): { valid: boolean; message?: string } {
  if (!content?.trim()) {
    return { valid: false, message: 'Content is required' };
  }

  switch (type) {
    case 'Video':
      if (!isYouTubeUrl(content)) {
        return { valid: false, message: 'Please enter a valid YouTube URL' };
      }
      break;
    case 'PDF':
      if (!isPdfUrl(content)) {
        return { valid: false, message: 'Please enter a valid PDF URL (must end with .pdf)' };
      }
      break;
    case 'Link':
      try {
        new URL(content);
      } catch {
        return { valid: false, message: 'Please enter a valid URL' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Get a thumbnail URL for a lesson
 * @param type - Lesson type
 * @param content - Lesson content URL
 * @returns thumbnail URL or icon name
 */
export function getLessonThumbnail(type: string, content: string): { type: 'image' | 'icon'; value: string } {
  switch (type) {
    case 'Video':
      const videoId = getYouTubeVideoId(content);
      if (videoId) {
        return { type: 'image', value: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
      }
      return { type: 'icon', value: 'play' };
    
    case 'PDF':
      return { type: 'icon', value: 'file-text' };
    
    case 'Link':
      return { type: 'icon', value: 'external-link' };
    
    case 'Text':
      return { type: 'icon', value: 'align-left' };
    
    default:
      return { type: 'icon', value: 'file' };
  }
}
