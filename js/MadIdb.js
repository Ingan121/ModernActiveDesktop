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

    function madIdbGetItem(key) {
        return new Promise((resolve, reject) => {
            const db = indexedDB.open("madesktop", 1);
            db.onupgradeneeded = function () {
                db.result.createObjectStore("config");
            };
            db.onsuccess = function () {
                const transaction = db.result.transaction("config", "readwrite");
                const store = transaction.objectStore("config");
                const request = store.get(key);
                request.onsuccess = function () {
                    resolve(request.result);
                };
                request.onerror = function () {
                    reject(request.error);
                };
            };
            db.onerror = function () {
                reject(db.error);
            };
        });
    }

    function madIdbSetItem(key, value) {
        return new Promise((resolve, reject) => {
            const db = indexedDB.open("madesktop", 1);
            db.onupgradeneeded = function () {
                db.result.createObjectStore("config");
            };
            db.onsuccess = function () {
                const transaction = db.result.transaction("config", "readwrite");
                const store = transaction.objectStore("config");
                store.put(value, key);
                transaction.oncomplete = function () {
                    resolve();
                };
                transaction.onerror = function () {
                    reject(transaction.error);
                };
            };
            db.onerror = function () {
                reject(db.error);
            };
        });
    }

    function madIdbDeleteItem(key) {
        return new Promise((resolve, reject) => {
            const db = indexedDB.open("madesktop", 1);
            db.onupgradeneeded = function () {
                db.result.createObjectStore("config");
            };
            db.onsuccess = function () {
                const transaction = db.result.transaction("config", "readwrite");
                const store = transaction.objectStore("config");
                store.delete(key);
                transaction.oncomplete = function () {
                    resolve();
                };
                transaction.onerror = function () {
                    reject(transaction.error);
                };
            };
            db.onerror = function () {
                reject(db.error);
            };
        });
    }

    function madIdbItemExists(key) {
        return new Promise((resolve, reject) => {
            const db = indexedDB.open("madesktop", 1);
            db.onupgradeneeded = function () {
                db.result.createObjectStore("config");
            };
            db.onsuccess = function () {
                const transaction = db.result.transaction("config", "readwrite");
                const store = transaction.objectStore("config");
                const request = store.getKey(key);
                request.onsuccess = function () {
                    resolve(request.result !== undefined);
                };
                request.onerror = function () {
                    reject(request.error);
                };
            };
            db.onerror = function () {
                reject(db.error);
            };
        });
    }
})();