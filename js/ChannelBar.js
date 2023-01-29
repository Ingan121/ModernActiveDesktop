const ActiveChannelItems = document.getElementsByClassName("ActiveChannelItem");
for (let i = 0; i < ActiveChannelItems.length; i++) {
    ActiveChannelItems[i].onclick = function () {
        let url = this.dataset.url;
        if (localStorage.sysplugIntegration) {
            fetch("http://localhost:3031/open", { method: "POST", body: url })
                .then(response => response.text())
                .then(responseText => {
                    if (responseText != "OK") {
                        alert("An error occured!\nSystem plugin response: " + responseText);
                        if (this.dataset.proxy) url = "https://via.hypothes.is/" + url;
                        parent.location.replace("ChannelViewer.html?" + (this.dataset.sandbox ? "sb&page=" : "page=") + url);
                    }
                })
                .catch(error => {
                    alert("System plugin is not running. Please make sure you have installed it properly.");
                    if (this.dataset.proxy) url = "https://via.hypothes.is/" + url;
                    parent.location.replace("ChannelViewer.html?" + (this.dataset.sandbox ? "sb&page=" : "page=") + url);
                });
        } else {
            if (this.dataset.proxy) url = "https://via.hypothes.is/" + url;
            parent.location.replace("ChannelViewer.html?" + (this.dataset.sandbox ? "sb&page=" : "page=") + url);
        }
    };
}