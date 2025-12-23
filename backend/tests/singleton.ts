// backend/src/__tests__/singleton.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'
import { beforeEach, vi } from 'vitest'
import { db as prisma } from '../src/lib/db.js'

vi.mock('../src/lib/db.js', () => ({
    __esModule: true,
    db: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
    mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>