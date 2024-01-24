document.onkeydown = function (e) {
	switch (e.code) {
		case 'F11':
			e.preventDefault();
			if (document.fullscreen) document.exitFullscreen();
			else document.body.requestFullscreen();
			break;
		
		case 'F12':
			browserViewCtl('devtools');
			break;
	}
}

function browserViewCtl(cmd) {
	window.postMessage({
		type : 'cvbvctl' + ipc.cvNumber, // ChannelViewer BrowserView Control
		command : cmd
	}, "*");
}

function go(url) {
	if (!url.startsWith('http')) url = 'http://' + url;
	window.postMessage({
		type : 'cvbvurl' + ipc.cvNumber, // ChannelViewer BrowserView Control
		command : url
	}, "*");
}

function minimize() {
	window.postMessage({
		type: 'cvwndctl' + ipc.cvNumber, // ChannelViewer Window Control
		command: 'minimize'
	}, "*");
}