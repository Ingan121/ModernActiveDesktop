// caching.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    if (!window.madIdb) {
        // Caching is not used in standalone (non-MAD) mode
        console.error("MadIdb is not loaded. Caching will not work.");
        return;
    }

    window.lrcCache = {
        add: addCache,
        get: getCache,
        delete: deleteCache,
        exists: cacheExists,
        count: countCache,
        clear: clearCache
    };

    async function addCache(hash, lyrics, preferUnsynced) {
        if (localStorage.madesktopVisLyricsNoCache) {
            return;
        }
        const max = parseInt(localStorage.madesktopVisLyricsCacheMax) || 500;
        const count = await countCache();
        if (count >= max) {
            log(`Cache is full. Deleting ${count - max + 1} oldest caches.`, "log", "MADVisLrc");
            await deleteOldestCache(count - max + 1);
        }

        const db = await madIdb.init();
        let estimate = await navigator.storage.estimate();
        let ratio = estimate.usage / estimate.quota;
        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            if (lyrics === null) {
                resolve();
                return;
            }
            lyrics.preferredUnsynced = preferUnsynced;
            if (ratio > 0.9) {
                log("Cache is full. Deleting 10 oldest caches. Cannot add a new cache.", "error", "MADVisLrc");
                deleteOldestCache(10);
                resolve();
                return;
            }
            const request = store.add({
                hash,
                lyrics,
                createdAt: Date.now()
            });
            request.onsuccess = function () {
                log("Cache added: " + hash, "log", "MADVisLrc");
                resolve();
            };
            request.onerror = function () {
                if (request.error.name === "ConstraintError") {
                    log("Cache already exists: " + hash, "log", "MADVisLrc");
                    resolve();
                } else {
                    console.error(request.error);
                    reject(request.error);
                }
            };
        });
    }

    async function getCache(hash) {
        const db = await madIdb.init();
        const expiryDays = parseInt(localStorage.madesktopVisLyricsCacheExpiry) || 31;
        const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const request = store.get(hash);
            request.onsuccess = function () {
                if (request.result && Date.now() - request.result.createdAt <= expiryTime) {
                    resolve(request.result.lyrics);
                } else {
                    store.delete(hash);
                    resolve(null);
                }
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    async function deleteCache(hash) {
        const db = await madIdb.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const request = store.delete(hash);
            request.onsuccess = function () {
                resolve();
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    async function cacheExists(hash) {
        const db = await madIdb.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readonly");
            const store = transaction.objectStore("lrccache");
            const request = store.get(hash);
            request.onsuccess = function () {
                resolve(request.result !== undefined);
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    // Delete an oldest cache if the cache limit is reached
    async function deleteOldestCache(num = 1) {
        const db = await madIdb.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const index = store.index("createdAtIndex");
            const request = index.openCursor();
            let cnt = 0;
            request.onsuccess = function () {
                const cursor = request.result;
                if (cursor) {
                    store.delete(cursor.value.hash);
                    cnt++;
                    if (cnt < num) {
                        cursor.continue();
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    async function cleanExpiredCache() {
        const db = await madIdb.init();
        const expiryDays = parseInt(localStorage.madesktopVisLyricsCacheExpiry) || 21;
        const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const index = store.index("createdAtIndex");
            const request = index.openCursor();
            request.onsuccess = function () {
                const cursor = request.result;
                if (cursor) {
                    if (Date.now() - cursor.value.createdAt > expiryTime) {
                        store.delete(cursor.value.hash);
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    async function countCache() {
        const db = await madIdb.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readonly");
            const store = transaction.objectStore("lrccache");
            const request = store.count();
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    async function clearCache() {
        const db = await madIdb.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const request = store.clear();
            request.onsuccess = function () {
                resolve();
            };
            request.onerror = function () {
                console.error(request.error);
                reject(request.error);
            };
        });
    }

    if (localStorage.madesktopVisLyricsLastClean) {
        const lastClean = parseInt(localStorage.madesktopVisLyricsLastClean);
        if (Date.now() - lastClean >= 86400000) {
            cleanExpiredCache();
            localStorage.madesktopVisLyricsLastClean = Date.now();
        }
    } else {
        localStorage.madesktopVisLyricsLastClean = Date.now();
    }
})();