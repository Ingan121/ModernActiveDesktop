// ChannelBar.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const activeChannelItems = document.getElementsByClassName("ActiveChannelItem");
for (const activeChannelItem of activeChannelItems) {
    activeChannelItem.addEventListener('click', function () {
        parent.openExternal(this.dataset.url, true);
    });
}