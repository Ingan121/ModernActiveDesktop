// lrcparse.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    window.LRC = {
        parse,
        parseMetadata,
        toPlain,
        isTextLrc
    };

    function parse(string) {
        // Copilot did this!
        const lines = string.split('\n');
        const lyrics = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const time = line.match(/\[\d+:\d+\.\d+\]/g);
            if (time) {
                const text = line.replace(/\[\d+:\d+\.\d+\]/g, '');
                for (let j = 0; j < time.length; j++) {
                    const t = time[j].match(/\d+/g);
                    const seconds = parseInt(t[0]) * 60 + parseFloat(t[1]);
                    lyrics.push({
                        time: seconds,
                        text: text.trim()
                    });
                }
            }
        }
        return lyrics;
    }

    function parseMetadata(string) {
        let artist = '';
        let title = '';
        let albumTitle = '';
        let duration = 0;
        for (const line of string.split('\n')) {
            if (line.startsWith('[ar:')) {
                artist = line.substring(4, line.length - 1);
            } else if (line.startsWith('[ti:')) {
                title = line.substring(4, line.length - 1);
            } else if (line.startsWith('[al:')) {
                albumTitle = line.substring(4, line.length - 1);
            } else if (line.startsWith('[length:')) {
                const value = line.substring(8, line.length - 1).trim().split(':');
                if (value.length === 2) {
                    duration = parseInt(value[0]) * 60 + parseInt(value[1]);
                } else if (value.length === 3) {
                    duration = parseInt(value[0]) * 3600 + parseInt(value[1]) * 60 + parseInt(value[2]);
                } else {
                    duration = parseInt(value[0]);
                }
            }
        }
        return { artist, title, albumTitle, duration };
    }

    function toPlain(string) {
        return string.replace(/\[\d+:\d+\.\d+\]/g, '').replace(/\[.*?:.*?\]/g, '').trim().split('\n').map(line => line.trim()).join('\n');
    }

    function isTextLrc(string) {
        return string.match(/\[\d+:\d+\.\d+\]/g) !== null;
    }
})();