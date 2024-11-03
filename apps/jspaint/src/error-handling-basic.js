/* eslint-disable no-useless-concat */
/* eslint-disable no-alert */

// use only ES5 syntax for this script
// set up basic global error handling, which we can override later
window.onerror = function (msg, url, lineNo, columnNo, error) {
	var string = msg.toLowerCase();
	var substring = "script error";
	if (string.indexOf(substring) > -1) {
		top.madAlert('Script Error: See Browser Console for Detail', null, 'error', { title: 'Paint' });
	} else {
		// try {
		// 	// try-catch in case of circular references or old browsers without JSON.stringify
		// 	error = JSON.stringify(error);
		// } catch (e) {}
		top.madAlert('Internal application error: ' + msg + '\n\n' + 'URL: ' + url + '\n' + 'Line: ' + lineNo + '\n' + 'Column: ' + columnNo, null, 'error', { title: 'Paint' });
	}
	return false;
};

window.onunhandledrejection = function (event) {
	top.madAlert('Unhandled Rejection: ' + event.reason, null, 'error', { title: 'Paint' });
}
