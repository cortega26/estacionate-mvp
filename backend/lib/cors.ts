import { VercelRequest, VercelResponse } from '@vercel/node'
import Cors from 'cors'

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function initMiddleware(middleware: (req: VercelRequest, res: VercelResponse, next: (err?: any) => void) => void) {
    return (req: VercelRequest, res: VercelResponse) =>
        new Promise((resolve, reject) => {
            middleware(req, res, (result: any) => {
                if (result instanceof Error) {
                    return reject(result)
                }
                return resolve(result)
            })
        })
}

// Initialize the cors middleware
const whitelist = [
    'http://localhost:5173',
    'https://cortega26.github.io',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

const corsMiddleware = initMiddleware(
    Cors({
        origin: function (origin, callback) {
            // Strict Regex: only allows https://<subdomain>.vercel.app (escaped dot)
            if (!origin || whitelist.indexOf(origin) !== -1 || origin.match(/^https:\/\/[\w-]+\.vercel\.app$/)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
)

export default corsMiddleware
