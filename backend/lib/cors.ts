import { VercelRequest, VercelResponse } from '@vercel/node'
import Cors from 'cors'

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function initMiddleware(middleware: any) {
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
const corsMiddleware = initMiddleware(
    Cors({
        origin: [
            'http://localhost:5173',
            'https://cortega26.github.io'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
)

export default corsMiddleware
