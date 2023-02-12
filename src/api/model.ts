import mongoose from 'mongoose'
import {MONGO_URI} from './config'

mongoose.connect(MONGO_URI).then(r => console.log('Connected to MongoDB'))
    .catch(e => console.log('Error connecting to MongoDB'))

export const Queue = mongoose.model('Queue', new mongoose.Schema({
        webhook_url: {
            type: String,
            required: true
        },
        download_url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ['queued', 'downloading', 'completed', 'failed'],
            default: 'queued'
        }
    }, {
        versionKey: false,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: function (doc, ret) {
                delete ret._id
            }
        }
    }))

;(async () => {
    await Queue.updateMany({status: 'downloading'}, {$set: {status: 'queued'}})
})()
