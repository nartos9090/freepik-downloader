export type WebhookPayload = {
    id: string
    download_url: string
    token: string
    status: string | null
    size: number | null
    filename: string | null
    thumbnail: string | null
    count: number | null
}