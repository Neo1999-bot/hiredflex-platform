/**
 * Vercel Web Analytics initialization script.
 * 
 * This script sets up the Vercel Web Analytics tracking function (window.va)
 * which queues analytics calls until the main Vercel analytics script is loaded.
 * 
 * When deployed to Vercel with Web Analytics enabled in the dashboard,
 * Vercel automatically injects the tracking script that processes this queue.
 * 
 * For local development or self-hosting, the @vercel/analytics package provides
 * the full analytics implementation.
 */
export const analyticsScript = `
// Initialize Vercel Web Analytics queue
// This function buffers analytics events until the main script loads
window.va = window.va || function () { 
  (window.vaq = window.vaq || []).push(arguments); 
};
`;
