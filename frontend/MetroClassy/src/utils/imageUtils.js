/**
 * Standardizes image URLs for the application.
 * Handles:
 * 1. Absolute URLs (http/https)
 * 2. Data URLs (data:image/...)
 * 3. Relative paths with Windows backslashes
 * 4. Missing base URLs
 * 
 * @param {string} path - The image path or URL from the database
 * @returns {string} The fully qualified, browser-ready URL
 */
export const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x300?text=No+Image';

    // Fix: Handle incorrectly saved localhost URLs or nested absolute URLs (e.g. /https://)
    if (typeof path === 'string') {
        // Strip localhost prefix (including optional trailing slash)
        if (path.includes('localhost')) {
            path = path.replace(/https?:\/\/localhost:\d+\/?/i, '');
        }

        // Strip leading slashes if the remaining path starts with http
        // This handles cases like "/https://res.cloudinary..."
        if (path.match(/^\/+https?:\/\//)) {
            path = path.replace(/^\/+/, '');
        }
    }

    // Return as is if it's already a full URL or data URI
    if ((path.startsWith('http') && !path.includes('localhost')) || path.startsWith('data:')) {
        return path;
    }

    // Get API URL from env or default
    let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Normalize path separators (replace Windows \ with /)
    const cleanPath = path.replace(/\\/g, '/');
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    // FIX: If the path is a local upload (starts with 'uploads/'), it is served from ROOT, not /api
    // So we must strip '/api' suffix if present in the base URL.
    if (normalizedPath.startsWith('uploads/')) {
        // Remove trailing slash if present
        if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

        // Remove '/api' suffix if present
        if (API_URL.endsWith('/api')) {
            API_URL = API_URL.slice(0, -4);
        }
    } else {
        // For other paths, ensure no trailing slash for consistency
        if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
    }

    return `${API_URL}/${normalizedPath}`;
};
