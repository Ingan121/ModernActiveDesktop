if (window.self == window.top) {
    const ActiveChannelItems = document.getElementsByClassName('ActiveChannelItem');
    for (let i = 0; i < ActiveChannelItems.length; i++) { // remove proxy when not running in iframe, as it is not required
        if (ActiveChannelItems[i].href.startsWith('https://via.hypothes.is/')) ActiveChannelItems[i].href = ActiveChannelItems[i].href.substring(24);
    }
}