import { readFileSync, statSync, unlinkSync } from "fs"

export class Downloaded {
    public path: string
    public filename: string
    public thumbnail: string
    public count: number
    public maxCount: number
    public size: number
    public mime: string

    constructor(path, filename, thumbnail, count, maxCount) {
        this.path = path
        this.filename = filename
        this.thumbnail = thumbnail
        this.count = count
        this.maxCount = maxCount
        const stat = statSync(path)
        this.size = stat.size
        // this.mime = mimeTypes.contentType(path.extname(path))
    }

    delete(): void {
        unlinkSync(this.path)
    }

    get(encode: boolean = false): Buffer {
        // @ts-ignore
        return readFileSync(this.path, { ...encode && { encoding: 'base64' } });
    }

    toJSON() {
        return {
            file: readFileSync(this.path, { encoding: 'base64' }),
            filename: this.filename,
            thumbnail: this.thumbnail,
            count: this.count,
            size: this.size,
            // mime: this.mime,
        }
    }
}
