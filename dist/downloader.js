"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadByUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const path_1 = require("path");
const ID_PATTERN = /\d+?(?=\.htm)/;
function downloadByUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlObject = new URL(url);
        const [id] = urlObject.pathname.match(ID_PATTERN);
        if (!id) {
            throw "Invalid URL";
        }
        try {
            // const location = await axios.get('https://www.freepik.com/download-file/' + id).then(res => {
            //   console.log(res.status)
            //   console.log(res.headers)
            //   return res.headers.location
            // })
            return yield axios_1.default.get('https://www.freepik.com/download-file/' + id, {
                responseType: 'stream'
            }).then(res => {
                // if (!res.headers["content-disposition"]) {
                //   throw "Download failed"
                // }
                // const filename = res.headers["content-disposition"].split('filename=')[1].split(';')[0]
                const filename = id;
                return new Promise((resolve, reject) => {
                    const path = (0, path_1.join)(__dirname, '../download/', filename);
                    const writer = (0, fs_1.createWriteStream)(path);
                    res.data.pipe(writer);
                    let error = null;
                    writer.on('error', err => {
                        error = err;
                        writer.close();
                        reject(err);
                    });
                    writer.on('close', () => {
                        if (!error) {
                            resolve(new Downloaded(path));
                        }
                    });
                });
            });
        }
        catch (e) {
            console.log(e);
            throw "Download failed";
        }
    });
}
exports.downloadByUrl = downloadByUrl;
class Downloaded {
    constructor(path) {
        this.path = path;
    }
    delete() {
        (0, fs_1.unlinkSync)(this.path);
    }
    get() {
        return (0, fs_1.readFileSync)(this.path);
    }
}
//# sourceMappingURL=downloader.js.map