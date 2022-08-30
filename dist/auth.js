"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCookie = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = require("path");
const fs_1 = require("fs");
const COOKIE_FILE = (0, path_1.join)(__dirname, '../storage/cookie');
axios_1.default.defaults.withCredentials = true;
function setCookie(value) {
    if ((0, fs_1.existsSync)(COOKIE_FILE)) {
        (0, fs_1.unlinkSync)(COOKIE_FILE);
    }
    (0, fs_1.writeFileSync)(COOKIE_FILE, value);
    console.info("Cookie set successfully");
    axios_1.default.interceptors.request.use((config) => {
        // @ts-ignore
        config.headers.Cookie = (0, fs_1.readFileSync)(COOKIE_FILE);
        return config;
    }, function (error) {
        // Do something with request error
        return Promise.reject(error);
    });
    return "Cookie set successfully";
}
exports.setCookie = setCookie;
//# sourceMappingURL=auth.js.map