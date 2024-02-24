// Channels.js for ModernActiveDesktop ChannelViewer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const activeChannelItems = document.getElementsByClassName("ActiveChannelItem");
for (const activeChannelItem of activeChannelItems) {
    activeChannelItem.addEventListener('click', function () {
        parent.go(this.dataset.url);
    });
}

document.addEventListener('pointerdown', function () {
    parent.madBringToTop();
});