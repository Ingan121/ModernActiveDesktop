// iframe-wrap.js for ModernAciiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

// iframe wrapper based on x-frame-bypass
customElements.define('iframe-wrapped', class extends HTMLIFrameElement {
	static get observedAttributes() {
		return ['src']
	}
	constructor () {
		super()
	}
	attributeChangedCallback () {
		this.load(this.src)
	}
	connectedCallback () {
		this.sandbox = '' + this.sandbox || 'allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation' // all except allow-top-navigation
	}
	load (url, options) {
        if (this.getAttribute('bypass-x-frame') && url && url.startsWith('http')) {
            console.log('X-Frame-Bypass loading:', url)
            this.srcdoc = `<html>
    <head>
        <style>
        .loader {
            position: absolute;
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;
            background-color: #333;
            border-radius: 50%;  
            animation: loader 1s infinite ease-in-out;
        }
        @keyframes loader {
            0% {
            transform: scale(0);
            }
            100% {
            transform: scale(1);
            opacity: 0;
            }
        }
        </style>
    </head>
    <body>
        <div class="loader"></div>
    </body>
    </html>`
            this.fetchProxy(url, options, 0).then(res => res.text()).then(data => {
                if (data)
                    this.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1>
        <base href="${url}">
        <script>
        // X-Frame-Bypass navigation event handlers
        document.addEventListener('click', e => {
            if (frameElement && document.activeElement && document.activeElement.href) {
                e.preventDefault()
                frameElement.load(document.activeElement.href)
            }
        })
        document.addEventListener('submit', e => {
            if (frameElement && document.activeElement && document.activeElement.form && document.activeElement.form.action) {
                e.preventDefault()
                if (document.activeElement.form.method === 'post')
                    frameElement.load(document.activeElement.form.action, {method: 'post', body: new FormData(document.activeElement.form)})
                else
                    frameElement.load(document.activeElement.form.action + '?' + new URLSearchParams(new FormData(document.activeElement.form)))
            }
        })
        </script>`)
            }).catch(e => console.error('Cannot load X-Frame-Bypass:', e))
        } else {
            super.src = url;
        }
	}
	fetchProxy (url, options, i) {
		const proxies = (options || {}).proxies || [
            '', // no proxy - will work fine in Wallpaper Engine or any environments with same-origin policy disabled
            'http://localhost:3031/proxy/', // ModernActiveDesktop System Plugin
			// 'https://cors-anywhere.herokuapp.com/', // rate limited
			// 'https://yacdn.org/proxy/', // dead
			'https://api.codetabs.com/v1/proxy/?quest='
		]
		return fetch(proxies[i] + url, options).then(res => {
			if (!res.ok)
				throw new Error(`${res.status} ${res.statusText}`);
			return res
		}).catch(error => {
			if (i === proxies.length - 1)
				throw error
			return this.fetchProxy(url, options, i + 1)
		})
	}
}, {extends: 'iframe'})