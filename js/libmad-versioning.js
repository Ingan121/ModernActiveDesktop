// libmad-versioning.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

class MadVersion {
    constructor(ver) {
        const split = ver.split(" ");
        const verSplit = split[0].split(".");
        this.major = parseInt(verSplit[0]);
        this.minor = parseInt(verSplit[1]);
        this.patch = parseInt(verSplit[2]);
        this.extra = split[1] || "";
    }

    toString(level = 1) {
        switch (parseInt(level)) {
            case 0:
                return `${this.major}.${this.minor}.${this.patch}${this.extra ? ` ${this.extra}` : ""}`;
            case 1:
                return `${this.major}.${this.minor}.${this.patch}`;
            case 2:
                return `${this.major}.${this.minor}`;
            case 3:
                return `${this.major}`;
            default:
                return this.toString(1);
        }
    }

    compare(verString, noExtra) {
        // Returns 1 if this version is newer, -1 if older, 0 if equal
        const ver = new MadVersion(verString);
        if (this.major !== ver.major) {
            return this.major - ver.major > 0 ? 1 : -1;
        }
        if (this.minor !== ver.minor) {
            return this.minor - ver.minor > 0 ? 1 : -1;
        }
        if (this.patch !== ver.patch) {
            return this.patch - ver.patch > 0 ? 1 : -1;
        }
        if (noExtra) {
            return 0;
        }
        if (this.extra && ver.extra) {
            return 0; // Extra versions are considered equal cuz I'm lazy
        }
        if (this.extra) {
            return -1; // Version with extra is considered older (cuz its a pre-release version)
        }
        if (ver.extra) {
            return 1;
        }
        return 0;
    }
}
window.MadVersion = MadVersion;