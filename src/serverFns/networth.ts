import * as fs from 'node:fs'
import * as path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import type { NetworthData } from '../types/networth'

const DATA_FILE = path.resolve('data/networth.json')

export const getNetworthData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<NetworthData> => {
    const raw = await fs.promises.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as NetworthData
  },
)
