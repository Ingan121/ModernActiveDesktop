// caching.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    if (!window.madIdb) {
        // Caching is not used in standalone (non-MAD) mode
        console.log("MadIdb is not loaded. Caching will not work.");
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
        const estimate = await navigator.storage.estimate();
        const ratio = estimate.usage / estimate.quota;
        if (ratio > 0.9) {
            log("Storage is almost full. Deleting 10 oldest caches. Cannot add a new cache.", "error", "MADVisLrc");
            deleteOldestCache(10);
            resolve();
            return;
        }

        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            if (lyrics === null) {
                resolve();
                return;
            }
            lyrics.preferredUnsynced = preferUnsynced;
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
        if (!db.objectStoreNames.contains("lrccache")) {
            // Not gonna handle this case more than this, versions with old DB structure did not officially release (existed for pretty long time though)
            madAlert("Outdated DB structure from pre-release version detected. Caching will be disabled. Please export the current config, reset hard, and re-import it to fix this issue.", null, "error", { title: "locid:VISLRC_TITLE" });
            localStorage.madesktopVisLyricsNoCache = true;
            madOpenConfig('misc');
            return null;
        }
        const expiryDays = parseInt(localStorage.madesktopVisLyricsCacheExpiry) || 21;
        const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("lrccache", "readwrite");
            const store = transaction.objectStore("lrccache");
            const request = store.get(hash);
            request.onsuccess = function () {
                if (request.result && Date.now() - request.result.createdAt <= expiryTime) {
                    const lyrics = request.result.lyrics;
                    lyrics.cachedAt = request.result.createdAt;
                    resolve(lyrics);
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
        if (!db.objectStoreNames.contains("lrccache")) {
            return;
        }
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
            let cnt = 0;
            request.onsuccess = function () {
                const cursor = request.result;
                if (cursor) {
                    if (Date.now() - cursor.value.createdAt > expiryTime) {
                        store.delete(cursor.value.hash);
                        cnt++;
                    }
                    cursor.continue();
                } else {
                    log(`Deleted ${cnt} expired caches.`, "log", "MADVisLrc");
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

    if (localStorage.madesktopVisLyricsLastCacheClean) {
        const lastClean = parseInt(localStorage.madesktopVisLyricsLastCacheClean);
        if (Date.now() - lastClean >= 86400000) {
            cleanExpiredCache();
            localStorage.madesktopVisLyricsLastCacheClean = Date.now();
        }
    } else {
        localStorage.madesktopVisLyricsLastCacheClean = Date.now();
    }
})();