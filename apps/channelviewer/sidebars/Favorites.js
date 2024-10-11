// Favorites.js for ModernActiveDesktop ChannelViewer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (!parent.favorites) {
    document.body.textContent = "Loading...";
    parent.favorites = [];
}

const dummyItem = document.getElementById('dummyFavoriteItem');

for (const favorite of parent.favorites) {
    const newItem = dummyItem.cloneNode(true);
    newItem.id = '';
    newItem.querySelector('.FavoriteItemText').textContent = favorite[1];
    newItem.addEventListener('click', function () {
        parent.go(favorite[0]);
    });
    if (favorite[2]) {
        newItem.style.backgroundImage = "url(" + URL.createObjectURL(favorite[2]) + ")";
    }
    document.body.appendChild(newItem);
}

document.addEventListener('pointerdown', function () {
    parent.madBringToTop();
});