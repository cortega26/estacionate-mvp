import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

async function testCookieFlow() {
    try {
        console.log('🧪 Testing Cookie Authentication Flow...')

        // Setup Axios with Cookie Jar
        const jar = new CookieJar()
        const client = wrapper(axios.create({
            baseURL: 'http://localhost:3000/api',
            jar,
            withCredentials: true
        }))

        // 1. Login
        console.log('1️⃣  Logging in as demo@resident.cl...')
        const loginRes = await client.post('/auth/login', {
            email: 'demo@resident.cl',
            password: '123456'
        })

        if (!loginRes.data.success) throw new Error('Login failed')

        // Check for Set-Cookie header
        // Note: axios-cookiejar-support handles cookies automatically, but we can check the jar
        const cookies = await jar.getCookies('http://localhost:3000')
        const tokenCookie = cookies.find(c => c.key === 'token')

        if (!tokenCookie) {
            console.error('❌ Set-Cookie header missing or no token cookie found!')
            process.exit(1)
        }
        console.log('✅ Cookie received:', tokenCookie.key, 'HttpOnly:', tokenCookie.httpOnly)

        // 2. Protected Request (Booking Creation attempt - expect 400 Schema Error, NOT 401)
        console.log('2️⃣  Attempting protected request with Cookie...')
        try {
            await client.post('/bookings/create', {})
        } catch (error: any) {
            if (error.response?.status === 400 || error.response?.status === 409) {
                console.log('✅ Request authorized! (Got expected validation error instead of 401)')
            } else if (error.response?.status === 401) {
                console.error('❌ Request unauthorized! Cookie login failed.')
                process.exit(1)
            } else {
                console.log('⚠️ Unexpected status:', error.response?.status, error.response?.data)
            }
        }

    } catch (error: any) {
        console.error('❌ Test Failed:', error)
        if (error.code) console.error('Code:', error.code)
        if (error.response) console.error('Response:', error.response.status, error.response.data)
        process.exit(1)
    }
}

testCookieFlow()
