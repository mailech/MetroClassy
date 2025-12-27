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

    // Return as is if it's already a full URL or data URI
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }

    // Get API URL from env or default
    // Check if VITE_API_URL is set, otherwise fallback
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Normalize path separators (replace Windows \ with /)
    const cleanPath = path.replace(/\\/g, '/');

    // Remove leading slash if present to avoid double slashes with API_URL
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;

    // Ensure API_URL doesn't end with slash if we're engaging (it usually doesn't, but safe to handle)
    // Actually, cleanPath assumption: "uploads/image.jpg"
    // API URL: "https://api.com"
    // Result: "https://api.com/uploads/image.jpg"

    // Check if API_URL ends with slash
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    return `${baseUrl}/${normalizedPath}`;
};
