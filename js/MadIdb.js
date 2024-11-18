// MadIdb.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    // Use indexedDB for storing images and JSON
    window.madIdb = window.madIdb || new Proxy({}, {
        get(target, prop) {
            // handle it like localStorage
            switch (prop) {
                case "init":
                    return initMadIdb;
                case "getItem":
                    return madIdbGetItem;
                case "setItem":
                    return madIdbSetItem;
                case "deleteItem":
                    return madIdbDeleteItem;
                case "itemExists":
                    return madIdbItemExists;
                default:
                    return madIdbGetItem(prop);
            }
        },
        // Using madIdb's setter is not recommended
        // as it's hard to handle async operations
        // Use madIdb.setItem() instead
        set(target, prop, value) {
            return madIdbSetItem(prop, value);
        },
        deleteProperty(target, prop) {
            return madIdbDeleteItem(prop);
        }
    });

    function initMadIdb() {
        return new Promise((resolve, reject) => {
            const db = indexedDB.open("madesktop", 1);
            db.onupgradeneeded = function () {
                db.result.createObjectStore("config");
                const lrcCacheStore = db.result.createObjectStore("lrccache", { keyPath: "hash" });
                lrcCacheStore.createIndex("createdAtIndex", "createdAt", { unique: false });
            };
            db.onsuccess = function () {
                resolve(db.result);
            };
            db.onerror = function () {
                reject(db.error);
            };
        });
    }

    async function madIdbGetItem(key) {
        const db = await initMadIdb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("config", "readwrite");
            const store = transaction.objectStore("config");
            const request = store.get(key);
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function madIdbSetItem(key, value) {
        const db = await initMadIdb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("config", "readwrite");
            const store = transaction.objectStore("config");
            store.put(value, key);
            transaction.oncomplete = function () {
                resolve();
            };
            transaction.onerror = function () {
                reject(transaction.error);
            };
        });
    }

    async function madIdbDeleteItem(key) {
        const db = await initMadIdb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("config", "readwrite");
            const store = transaction.objectStore("config");
            store.delete(key);
            transaction.oncomplete = function () {
                resolve();
            };
            transaction.onerror = function () {
                reject(transaction.error);
            };
        });
    }

    async function madIdbItemExists(key) {
        const db = await initMadIdb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("config", "readwrite");
            const store = transaction.objectStore("config");
            const request = store.getKey(key);
            request.onsuccess = function () {
                resolve(request.result !== undefined);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
    }
})();