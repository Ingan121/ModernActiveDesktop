// ChannelBar.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const activeChannelItems = document.getElementsByClassName("ActiveChannelItem");
for (const activeChannelItem of activeChannelItems) {
    activeChannelItem.addEventListener('click', function () {
        parent.openExternal(this.dataset.url);
    });
}