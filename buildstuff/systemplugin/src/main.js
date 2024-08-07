// main.js for ModernActiveDesktop System Plugin
// Made by Ingan121
// Licensed under the MIT License

'use strict';

// Modules to control application life and create native browser window
const { app, BrowserView, BrowserWindow, ipcMain, shell, dialog, session, clipboard, systemPreferences, protocol, Menu, Tray } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');
const args = require('minimist')(process.argv);
const { spawn, execSync } = require('child_process');

if (args.help) {
  console.log(`ModernActiveDesktop System Plugin ${app.getVersion()}`);
  console.log("Made by Ingan121");
  console.log("Licensed under the MIT License");
  console.log("https://github.com/Ingan121/ModernActiveDesktop/tree/master/buildstuff/systemplugin\n");
  console.log("Usage: MADSysPlug.exe [options]");
  console.log("--open: Open a URL on startup");
  console.log("--maximize: Maximize the window on startup");
  console.log("--showui: Show the main UI on startup");
  console.log("--port: Port to listen on (default: 3031)");
  console.log("--listen: IP address to listen on (default: 127.0.0.1)");
  console.log("--cors: CORS origin to allow (default: https://www.ingan121.com)");
  console.log("--metrics: Get window metrics (border size, title height), for internal use only")
  console.log("--help: Show this help message\n");
  console.log("Warning: Using --cors=* or --listen=0.0.0.0 is considered insecure. Please only use these options for testing.\n");
  process.exit();
}

const gotTheLock = !!args.metrics || app.requestSingleInstanceLock();
let tray = null;
let mainWindow = null;
let cvNumber = 0;
let mcc = null;

const metrics = {
  // Windows 10 default metrics
  borderSize: 8,
  titleHeight: 22
};

const configPath = app.getPath('userData') + '/config.json';
const tempFilePath = app.getPath('temp') + '/madsp-uploaded.dat';

if (!fs.existsSync(configPath)) { // Setup initial config
  fs.writeFileSync(configPath, '{"theme":"98"}');
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 640,
    height: 240,
    icon: process.platform === 'win32' ? path.join(__dirname, 'icon.ico') : null,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      enableRemoteModule: true
    },
    resizable: true,
    show: false
  });

  // Remove the menu bar
  mainWindow.removeMenu();

  if (args.metrics) {
    const borderSize = (mainWindow.getSize()[0] - mainWindow.getContentSize()[0]) / 2;
    const titleHeight = mainWindow.getSize()[1] - mainWindow.getContentSize()[1] - borderSize * 2 - 1;
    console.log(borderSize, titleHeight);
    app.quit();
    return;
  }

  if (args.cors === "*") {
    showErrorMsg(mainWindow, "WARNING: You're running ModernActiveDesktop System Plugin with a wildcard CORS option. This is considered insecure, as any webpage can access your system with this plugin. Please only use this option for testing.", "warning");
  }
  if (args.listen === "0.0.0.0") {
    showErrorMsg(mainWindow, "WARNING: You're running ModernActiveDesktop System Plugin with a listen option to allow any remote access. This is considered insecure, as anyone on your network can access your system with this plugin. NEVER USE THIS OPTION if your device is connected directly to internet (i.e. you aren't using a router.)", "warning");
  }

  // and load the index.html of the app.
  mainWindow.loadURL(path.join(__dirname, 'index.html') + '?configPath=' + configPath);

  // Handle ChannelViewer creation
  mainWindow.webContents.on('did-create-window', processNewWindow);

  mainWindow.webContents.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        webPreferences: {
          preload: path.join(__dirname, 'preload.js')
        }
      }
    }
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript('const style=document.createElement("style");style.id="schemeStyle";style.textContent=`'+generateCssScheme()+'`;document.head.appendChild(style);');

    if (args.open) {
      mainWindow.webContents.executeJavaScript(`openPage("${args.open}");`);
    } else if (args.showui) {
      mainWindow.show();
    }
  });

  mainWindow.on('close', () => {
    app.quit();
  });

  systemPreferences.on('accent-color-changed', () => {
    mainWindow.webContents.reload();
  });

  systemPreferences.on('color-changed', () => {
    getMetrics();
    mainWindow.webContents.reload();
  });
}

if (!gotTheLock) {
  app.exit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', function () {
    createWindow();

    if (!args.metrics) {
      getMetrics();
    } else {
      return;
    }

    tray = new Tray(path.join(__dirname, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Exit', type: 'normal', click: () => { app.exit(); } }
    ])
    tray.setToolTip(`ModernActiveDesktop System Plugin ${app.getVersion()}`);
    tray.setContextMenu(contextMenu);
    
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function processNewWindow(childWindow, details) {
  childWindow.removeMenu();
  if (args.maximize) childWindow.maximize(); 
  childWindow.setIcon(path.join(__dirname, 'icon.ico'));

  mainWindow.webContents.executeJavaScript('const style=document.createElement("style");style.id="schemeStyle";style.textContent=`'+generateCssScheme()+'`;document.head.appendcChild(style);');

  let url = details.url;
  let pageUrl = '';
  
  childWindow.setSize(1280, 720);
  const searchParams = new URL(url).searchParams;
  pageUrl = searchParams.get('page');
  
  if (searchParams.get('fullscreen')) {
    childWindow.webContents.executeJavaScript('document.body.requestFullscreen()', true);
  }

  let cvNumberPrivate = cvNumber;
  childWindow.webContents.send('cvNumber', cvNumberPrivate);
  childWindow.webContents.executeJavaScript('const style=document.createElement("style");style.textContent=`'+generateCssScheme()+'`;document.head.appendChild(style);');

  if (pageUrl) {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false
      }
    });
    childWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 26, width: childWindow.getBounds().width, height: childWindow.getBounds().height - 26 });
    view.setAutoResize({ width: true, height: true });
    view.setBackgroundColor('#fff');
    view.webContents.loadURL(pageUrl);
    childWindow.webContents.send("cvbvurl" + cvNumberPrivate, pageUrl);
    ipcMain.on('cvbvctl' + cvNumberPrivate, processCvBvIpc);
    
    function processCvBvIpc(event, message) {
      console.log("cvbvctl:", message);
      switch (message) {
        case 'back':
          view.webContents.goBack();
          break;
        case 'forward':
          view.webContents.goForward();
          break;
        case 'refresh':
          view.webContents.reload();
          break;
        case 'stop':
          view.webContents.stop();
          break;
        case 'devtools':
          view.webContents.openDevTools();
          break;
      }
    }

    ipcMain.on('cvbvurl' + cvNumberPrivate, (event, url) => {
      console.log("cvbvurl: ", url);
      view.webContents.loadURL(url);
      childWindow.webContents.send("cvbvurl" + cvNumberPrivate, view.webContents.getURL());
    });

    childWindow.on('close', () => {
      console.log("Removing BrowserViewCtl IPC listener for ChannelViewer", cvNumberPrivate);
      ipcMain.removeListener('cvbvctl', processCvBvIpc);
      childWindow.setBrowserView(null);
      view.webContents.destroy();
      if (args.open) app.quit();
    });

    view.webContents.on('page-title-updated', (event, title, explicitSet) => {
      childWindow.setTitle(explicitSet ? title + ' - ChannelViewer' : 'ChannelViewer');
    })

    view.webContents.on('did-start-loading', (event) => {
      childWindow.webContents.send("cvbvurl" + cvNumberPrivate, view.webContents.getURL());
      childWindow.webContents.send("loadStart" + cvNumberPrivate, true);
      childWindow.webContents.send("canGoBack" + cvNumberPrivate, view.webContents.canGoBack());
      childWindow.webContents.send("canGoForward" + cvNumberPrivate, view.webContents.canGoForward());
    })

    view.webContents.on('did-stop-loading', (event) => {
      childWindow.webContents.send("cvbvurl" + cvNumberPrivate, view.webContents.getURL());
      childWindow.webContents.send("loadComplete" + cvNumberPrivate, true);
      childWindow.webContents.send("canGoBack" + cvNumberPrivate, view.webContents.canGoBack());
      childWindow.webContents.send("canGoForward" + cvNumberPrivate, view.webContents.canGoForward());
    })

    view.webContents.on('will-navigate', (event, url) => {
      childWindow.webContents.send("cvbvurl" + cvNumberPrivate, url);
      childWindow.webContents.send("canGoBack" + cvNumberPrivate, view.webContents.canGoBack());
      childWindow.webContents.send("canGoForward" + cvNumberPrivate, view.webContents.canGoForward());
    })

    view.webContents.on('did-navigate-in-page', (event, url) => {
      childWindow.webContents.send("cvbvurl" + cvNumberPrivate, url);
      childWindow.webContents.send("canGoBack" + cvNumberPrivate, view.webContents.canGoBack());
      childWindow.webContents.send("canGoForward" + cvNumberPrivate, view.webContents.canGoForward());
    })

    // Handle ChannelViewer creation
    view.webContents.on('did-create-window', processNewWindow);
    
    ipcMain.on('cvwndctl' + cvNumberPrivate, processCvWndIpc);
    childWindow.on('close', () => {
      console.log("Removing WindowCtl IPC listener for ChannelViewer", cvNumberPrivate);
      ipcMain.removeListener('cvwndctl', processCvWndIpc);
    });
    
    console.log("Created ChannelViewer", cvNumberPrivate);
    cvNumber++;
  }

  function processCvWndIpc(event, message) {
    console.log("cvwndctl:", message);
    switch (message) {
      case 'minimize':
        childWindow.minimize();
      break;
    }
  }
}

function showErrorMsg(win, msg, type) {
  const options = {
    message: msg,
    type: type,
    title: 'ModernActiveDesktop System Plugin',
    buttons: ['OK'],
    noLink: true
  }
  dialog.showMessageBox(win, options);
}

function getMetrics() {
  if (process.platform === 'win32') {
    // DPI unaware mode is required to get the correct window metrics in 100% DPI (as MAD operates in virtual pixels)
    // Electron / Chromium also operates in virtual pixels, but its pretty inaccurate regarding window sizes
    process.env.__COMPAT_LAYER = "DPIUNAWARE";
    const result = execSync(`"${process.execPath}" "${__filename}" --metrics`).toString();
    process.env.__COMPAT_LAYER = undefined;
    const [ borderSize, titleHeight ] = result.split(' ').map(Number);
    console.log({ borderSize, titleHeight });
    metrics.borderSize = borderSize;
    metrics.titleHeight = titleHeight;
  }
}

function generateCssScheme() {
  const accent = '#' + systemPreferences.getAccentColor();

  let schemeStyle = '';
  if (process.platform === 'win32') {
    schemeStyle = 
      `:root {
        --active-border: ${systemPreferences.getColor('active-border')};
        --active-title: ${systemPreferences.getColor('active-caption')};
        --app-workspace: ${systemPreferences.getColor('app-workspace')};
        --background: ${systemPreferences.getColor('desktop')};
        --button-alternate-face: ${getButtonAlternateFace()};
        --button-dk-shadow: ${systemPreferences.getColor('3d-dark-shadow')};
        --button-face: ${systemPreferences.getColor('3d-face')};
        --button-hilight: ${systemPreferences.getColor('3d-highlight')};
        --button-light: ${systemPreferences.getColor('3d-light')};
        --button-shadow: ${systemPreferences.getColor('3d-shadow')};
        --button-text: ${systemPreferences.getColor('button-text')};
        --gradient-active-title: ${systemPreferences.getColor('active-caption-gradient')};
        --gradient-inactive-title: ${systemPreferences.getColor('inactive-caption-gradient')};
        --gray-text: ${systemPreferences.getColor('disabled-text')};
        --hilight: ${systemPreferences.getColor('highlight')};
        --hilight-text: ${systemPreferences.getColor('highlight-text')};
        --hot-tracking-color: ${systemPreferences.getColor('hotlight')};
        --inactive-border: ${systemPreferences.getColor('inactive-border')};
        --inactive-title: ${systemPreferences.getColor('inactive-caption')};
        --inactive-title-text: ${systemPreferences.getColor('inactive-caption-text')};
        --info-text: ${systemPreferences.getColor('info-text')};
        --info-window: ${systemPreferences.getColor('info-background')};
        --menu: ${systemPreferences.getColor('menu')};
        --menu-bar: ${systemPreferences.getColor('menubar')};
        --menu-hilight: ${systemPreferences.getColor('menu-highlight')};
        --menu-text: ${systemPreferences.getColor('menu-text')};
        --scrollbar: ${systemPreferences.getColor('scrollbar')};
        --title-text: ${systemPreferences.getColor('caption-text')};
        --window: ${systemPreferences.getColor('window')};
        --window-frame: ${systemPreferences.getColor('window-frame')};
        --window-text: ${systemPreferences.getColor('window-text')};
        --accent: ${accent};
        --accent-dark: ${shadeColor(accent.substring(0, 6), -27)};
        --ui-font: "Segoe UI", "SegoeUI", "Noto Sans", sans-serif;
      }
      .window {
        --extra-border-size: ${metrics.borderSize - 3}px;
        --extra-title-height: ${metrics.titleHeight - 20}px;
      }`;
  } else {
    schemeStyle = 
      `:root {
        --accent: ${accent};
        --accent-dark: ${shadeColor(accent.substring(0, 6), -27)};
      }`;
  }
  return schemeStyle;
}

// idk why but button-alternate-face is not supported by Electron
function getButtonAlternateFace() {
  if (process.platform === 'win32') {
    const output = execSync('reg query "HKCU\\Control Panel\\Colors" /v ButtonAlternateFace').toString();
    return `rgb(${output.match(/REG_SZ    (.*)\r\n/)[1].replaceAll(' ', ', ')})`;
  } else {
    return '#000000';
  }
}

// https://stackoverflow.com/a/13532993
function shadeColor(color, percent) {
  var R = parseInt(color.substring(1,3),16);
  var G = parseInt(color.substring(3,5),16);
  var B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  var RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
  var GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
  var BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

if (!args.metrics) {
  http.createServer(onRequest).listen(args.port || 3031, args.listen || '127.0.0.1');
}

function onRequest(req, res) {
  console.log('serve: ' + req.url);
  const cors = args.cors || 'https://www.ingan121.com';
  res.setHeader('Access-Control-Allow-Origin', cors);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Use-ChannelViewer, X-Fullscreen, X-Format-Name, X-Format-Extension');

  if (req.headers.origin && req.headers.origin !== 'null') {
    // Allow CORS for localhost and Lively Wallpaper
    if (new URL(req.headers.origin).hostname.match(/^(localhost|127(.[0-9]{1,3}){3})$/) || req.headers.origin.startsWith('localfolder://')) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    } else if (args.cors !== "*" && req.headers.origin !== cors && req.headers.origin !== 'file://') {
      // (Last one is what Wallpaper Engine sends)
      // Abort if CORS is not allowed
      // This is to prevent arbitrary website from accessing your system
      // Request can proceed even if CORS is not allowed
      // (JS can't get the response but system changes like MediaControl will still be made)
      // So explicitly abort the request if CORS is not allowed
      res.writeHead(403);
      res.end('403 Forbidden', 'utf-8');
      return;
    }
  }

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  switch (req.url) {
    case '/open':
      if (req.method === 'POST') {
        processPost(req, res, function (body) {
          if (!body.startsWith('http') && !body.startsWith('file')) {
            body = url.pathToFileURL(path.normalize(`${__dirname}/../../../${body}`)).toString();
          }

          if (req.headers['x-use-channelviewer']) {
            if (req.headers['x-fullscreen']) {
              mainWindow.webContents.executeJavaScript(`openPage("${body}", true);`);
            } else {
              mainWindow.webContents.executeJavaScript(`openPage("${body}");`);
            }
          } else {
            shell.openExternal(body);
          }
        });
      } else {
        res.writeHead(405, {'Content-Type': 'text/html'});
        res.end('<h1>405 Method Not Allowed</h1><p>Usage: send a POST request with a URL in the request body</p>')
      }
      break;

    case '/save':
      if (req.method === 'POST') {
        try {
          const stream = fs.createWriteStream(tempFilePath);
          req.pipe(stream);
          stream.on('finish', () => {
            const options = {
              defaultPath : app.getPath('pictures'),
              filters : [
                  {name: req.headers['x-format-name'], extensions: req.headers['x-format-extension'].split(',')},
                  {name: 'All Files', extensions: ['*']}
              ]
            };
            console.log(req.headers);
            const savePath = dialog.showSaveDialogSync(null, options);
            if (!savePath) {
              res.writeHead(500);
              res.end('Aborted');
              return;
            }
            fs.copyFileSync(tempFilePath, savePath);
            res.end(path.basename(savePath));
          });
        } catch (e) {
          res.writeHead(500)
          res.end(e);
        }
      } else {
        res.writeHead(405, {'Content-Type': 'text/html'});
        res.end('<h1>405 Method Not Allowed</h1><p>Usage: send a POST request with a file in the request body</p>')
      }
      break;

    case '/systemscheme':
      res.writeHead(200, {'Content-Type':'text/css'});
      res.end(generateCssScheme());
      break;

    case '/playpause':
      if (req.method === 'POST') {
        processPost(req, res, function (body) {
          runMccCmd('playpause', body);
        });
      } else {
        runMccCmd('playpause');
        res.end('OK');
      }
      break;

    case '/stop':
      if (req.method === 'POST') {
        processPost(req, res, function (body) {
          runMccCmd('stop', body);
        });
      } else {
        runMccCmd('stop');
        res.end('OK');
      }
      break;

    case '/prev':
      if (req.method === 'POST') {
        processPost(req, res, function (body) {
          runMccCmd('prev', body);
        });
      } else {
        runMccCmd('prev');
        res.end('OK');
      }
      break;

    case '/next':
      if (req.method === 'POST') {
        processPost(req, res, function (body) {
          runMccCmd('next', body);
        });
      } else {
        runMccCmd('next');
        res.end('OK');
      }
      break;

    case '/connecttest':
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(app.getVersion());
      break;

    case '/debugger':
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end('<span style="font-family:monospace">debugger</span> statement activated (if a node debugger has been attached)');
      debugger;
      break;

    case '/favicon.ico':
      res.writeHead(200, {'Content-Type':'image/vnd.microsoft.icon'});
      res.end(fs.readFileSync(path.join(__dirname, 'icon.ico')));
      break;

    case '/':
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(`<h1>ModernActiveDesktop System Plugin ${app.getVersion()} Web Interface</h1>
      <p>Available pages:<br>
      <a href="/open">/open</a><br>
      <a href="/save">/save</a><br>
      <a href="/systemscheme">/systemscheme</a><br>
      <a href="/playpause">/playpause</a><br>
      <a href="/stop">/stop</a><br>
      <a href="/prev">/prev</a><br>
      <a href="/next">/next</a><br>
      <a href="/connecttest">/connecttest</a><br>
      <a href="/debugger">/debugger</a></p>`)
      break;

    default:
      res.writeHead(404);
      res.end('404 Not Found', 'utf-8');
  }
}

function processPost(req, res, callback) {
  let body = '';

  req.on('data', function (data) {
    body += data;

    // Too much POST data, kill the connection!
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6)
      req.connection.destroy();
  });

  req.on('end', function () {
    callback(body);
    res.end('OK');
  });
}

function initMcc() {
  mcc = spawn(path.join(__dirname, '../MediaControlCLI.exe'), ['utf8']);
  mcc.stdin.setEncoding('utf-8');
  mcc.stdout.setEncoding('utf-8');
  mcc.stderr.setEncoding('utf-8');
  mcc.stdout.pipe(process.stdout);

  mcc.on('error', (err) => {
    console.error(err);
    showErrorMsg(mainWindow, "Failed to run media control helper.\n" + err.toString(), "error");
    mcc = null;
  });

  mcc.on('exit', (code) => {
    console.log(`Media control helper exited with code ${code}`);
    if (code === 2) {
      showErrorMsg(mainWindow, "Media controls are not supported on this system.", "error");
    }
    mcc = null;
  });
}

function runMccCmd(command, title = "") {
  const args = command + " " + title;
  console.log(args);
  if (!mcc) {
    initMcc();
  }
  mcc.stdin.write(args + "\n");
}