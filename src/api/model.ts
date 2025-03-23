import * as Database from 'better-sqlite3'
import { existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { v4 as uuidv4 } from 'uuid'

const DB_PATH = resolve('./queue.db')

// Ensure the database file exists
if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, '')
}

const db = new Database(DB_PATH)

db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
        id VARCHAR(500) NOT NULL,
        webhook_url TEXT NOT NULL,
        download_url TEXT NOT NULL,
        filename TEXT,
        status TEXT CHECK(status IN ('queued', 'downloading', 'completed', 'failed')) DEFAULT 'queued',
        garbaged TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`)

export type QueueStatus = 'queued' | 'downloading' | 'completed' | 'failed'

export const Queue = {
    enqueue: (webhook_url: string, download_url: string) => {
        const stmt = db.prepare(`INSERT INTO queue (id, webhook_url, download_url) VALUES (?, ?, ?)`)
        return stmt.run(uuidv4(), webhook_url, download_url)
    },
    updateStatus: (id: string, status: QueueStatus) => {
        const stmt = db.prepare(`UPDATE queue SET id = ? WHERE status = ?`)
        return stmt.run(id, status)
    },
    findAll: () => {
        return db.prepare(`SELECT * FROM queue`).all()
    },
    findById: (id: string) => {
        return db.prepare(`SELECT * FROM queue WHERE id = ?`).get(id)
    },
    dequeue: (id: string, filename: string) => {
        const stmt = db.prepare(`UPDATE queue SET filename = ?, status = 'completed' WHERE id = ?`)
        return stmt.run(filename, id)
    },
    peek: () => {
        return db.prepare(`SELECT * FROM queue WHERE status = 'queued' ORDER BY created_at ASC`).get()
    },
    isDownloading: () => {
        return db.prepare(`SELECT COUNT(*) AS count FROM queue WHERE status = 'downloading'`).get().count > 0
    },
    countQueued: () => {
        return db.prepare(`SELECT COUNT(*) AS count FROM queue WHERE status = 'queued'`).get().count
    },
    setGarbage: (id: string) => {
        const stmt = db.prepare(`UPDATE queue SET garbaged = 1 WHERE id = ?`)
        return stmt.run(id)
    },
    getGarbage: () => {
        return db.prepare(`SELECT * FROM queue WHERE garbaged = 1`).all()
    }
};

(async () => {
    Queue.updateStatus('downloading', 'queued')
})()

console.log('SQLite database setup complete')
