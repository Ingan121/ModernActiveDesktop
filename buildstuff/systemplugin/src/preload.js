// preload.js for ModernActiveDesktop System Plugin
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const { ipcRenderer, contextBridge } = require('electron');

process.once('loaded', () => {
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.type.startsWith('cv')) {
      ipcRenderer.send(message.type, message.command);
    }
  });
});

ipcRenderer.on("cvNumber", (event, cvNumber) => {
  contextBridge.exposeInMainWorld("ipc", {cvNumber: cvNumber});
  
  ipcRenderer.on("dlStarted" + cvNumber, (event) => {
    console.log("dlStarted");
    document.getElementById("progress-bar").style.display = "block";
  });
  
  ipcRenderer.on("dlProgress" + cvNumber, (event, progress) => {
    if (!progress) return;
    console.log("dlProgress: " + progress); // Progress in fraction, between 0 and 1
    const progressBar = document.getElementById("progress-bar-inside");
    progressBar.style.width = progress + "%";
    const progressBarLabel = document.getElementById("progress-bar-label");
    progressBarLabel.textContent = progress + "%";
  });
  
  ipcRenderer.on("dlComplete" + cvNumber, (event) => {
    console.log("dlComplete");
    document.getElementById("progress-bar").style.display = "none";
  });
  
  ipcRenderer.on("loadStart" + cvNumber, (event) => {
    console.log("loadStart");
    const refStopBtn = document.getElementById("refresh-stop-button");
    refStopBtn.dataset.status = "stop";
  });
  
  ipcRenderer.on("loadComplete" + cvNumber, (event) => {
    console.log("loadComplete");
    const refStopBtn = document.getElementById("refresh-stop-button");
    refStopBtn.dataset.status = "refresh";
  });
  
  ipcRenderer.on("cvbvurl" + cvNumber, (event, url) => {
    console.log("cvbvurl: " + url);
    document.getElementById("urlbar").value = url;
  });
  
  ipcRenderer.on("canGoBack" + cvNumber, (event, canGoBack) => {
    console.log("canGoBack: " + canGoBack);
    document.getElementById("back-button").dataset.disabled = !canGoBack;
  })
  
  ipcRenderer.on("canGoForward" + cvNumber, (event, canGoForward) => {
    console.log("canGoForward: " + canGoForward);
    document.getElementById("forward-button").dataset.disabled = !canGoForward;
  })
});
