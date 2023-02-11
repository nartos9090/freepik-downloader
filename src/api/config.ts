import * as dotenv from "dotenv";
dotenv.config()
export const API_PORT = process.env.API_PORT || 3000
export const MONGO_URI = (() => {
    return `mongodb://${(process.env.MONGODB_USER && process.env.MONGODB_PASS) ? `${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@` : '' }${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE}`
})()
