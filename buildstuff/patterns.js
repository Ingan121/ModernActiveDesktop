
const testPatterns = [
    [ /* checkered pattern */
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
    ], [ /* all black */
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ], [ /* all white */
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ]
];

// Generate pattern image from pattern
/* pattern: [
    [first row],
    [second row],
    ...
    [eighth row],
    1: black, 0: transparent
] */
function genPatternImage(pattern) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            ctx.fillStyle = pattern[i][j] ? "black" : "transparent";
            ctx.fillRect(j, i, 1, 1);
        }
    }
    return canvas.toDataURL();
}

// Convert pattern to base64 (direct pattern binary to base64, not including any redundant data)
function patternToBase64(pattern) {
    if (pattern.length !== 8) {
        throw new Error("Pattern must be 8x8");
    }
    let hex = new Uint8Array(8);
    let i = 0;
    for (let row of pattern) {
        for (let j = 0; j < 8; j++) {
            hex[i] = hex[i] | (row[j] << (7 - j));
        }
        i++;
    }
    console.log(hex);
    return btoa(String.fromCharCode(...hex));
}

// Convert base64 to pattern
function base64ToPattern(base64) {
    let hex = atob(base64);
    let pattern = [];
    for (let i = 0; i < 8; i++) {
        pattern.push([]);
        for (let j = 0; j < 8; j++) {
            pattern[i].push((hex.charCodeAt(i) >> (7 - j)) & 1);
        }
    }
    return pattern;
}

function dlTest(pattern) {
    const url = genPatternImage(pattern || testPatterns[0]);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test.png";
    a.click();
    URL.revokeObjectURL(url);
}

dlTest();

// console.log(patternToBase64(testPatterns[0]));
// console.log(patternToBase64(testPatterns[1]));
// console.log(patternToBase64(testPatterns[2]));

// console.log(base64ToPattern("qlWqVapVqlU="));
// console.log(base64ToPattern("AAAAAAAAAAA="));
// console.log(base64ToPattern("//////////8="));




// Abandoned idea of generating BMP from pattern directly
// This doesn't support transparency!
// It was a fun experiment though
function genPatternBmp(pattern) {
    /* pattern: [
        [first row],
        [second row],
        ...
        1: white, 0: black
    ] */
    // 8x8 Monochrome BMP header - base64 encoded, 61 bytes
    const bmpCommonHeader = atob("Qk1eAAAAAAAAAD4AAAAoAAAACAAAAAgAAAABAAEAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///w");
    const bmpData = new Uint8Array(94);
    // Fill bmpData with header
    let i;
    for (i = 0; i < 61; i++) {
        bmpData[i] = bmpCommonHeader.charCodeAt(i);
    }
    bmpData[i++] = 0;
    // Fill bmpData with pattern
    for (let row of pattern.reverse()) {
        for (let j = 0; j < 8; j++) {
            bmpData[i] = bmpData[i] | (row[j] << (7 - j));
        }
        i += 4;
    }
    return new Blob([bmpData], {type: "image/bmp"});
}

// 8x8 Monochrome BMP
//Qk1eAAAAAAAAAD4AAAAoAAAACAAAAAgAAAABAAEAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==

//Qk1eAAAAAAAAAD4AAAAoAAAACAAAAAgAAAABAAEAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAA==

//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA== // All black
//D/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAA== // All white
