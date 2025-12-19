import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Applies security headers to the response.
 * Implementation inspired by Helmet but lightweight for Vercel Functions.
 */
export const securityHeaders = (req: VercelRequest, res: VercelResponse, next: () => void) => {
    // 1. Strict-Transport-Security (HSTS)
    // Enforce HTTPS for 1 year, include subdomains
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // 2. X-Content-Type-Options
    // Prevent MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 3. X-Frame-Options
    // Prevent Clickjacking (Deny for now, or ALLOW-FROM if needed)
    res.setHeader('X-Frame-Options', 'DENY');

    // 4. X-XSS-Protection
    // Audit: Browser support is waning, but still good for legacy
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 5. Referrer-Policy
    // Control how much referrer info is sent
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Content-Security-Policy (CSP)
    // Strict CSP for API: Fail closed.
    // APIs typically don't serve HTML, images, or scripts.
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
    );

    next();
};
