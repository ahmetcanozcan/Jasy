const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron');

const path = require('path');

let mainWindow;


// const handleSquirrelEvent = require('./squirell');
// if (handleSquirrelEvent(app)) {
//   // squirrel event handled and app will exit in 1000ms, so don't do anything else
//   return;
// }


function createWindow() {
  let width = 1024,
    height = 840;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true
    },
    transparent: true,
    frame: false
  });

  mainWindow.loadFile(path.join('src', 'index.html'));


  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  let x, y;

  ipcMain.on('minimize-main-window', (e, arg) => mainWindow.minimize());
  ipcMain.on('togglize-main-window', (e, arg) => {
    if (arg === false) {
      [width, height] = mainWindow.getSize();
      [x, y] = mainWindow.getPosition();
      mainWindow.maximize();
    } else {
      mainWindow.setSize(width, height, true);
      mainWindow.setPosition(x, y, true);
    }
  });

  ipcMain.on('saveAsDialog', (e, arg) => {
    dialog.showSaveDialog(mainWindow, path => {
      e.reply('saveAsDialog', path);
    })
  })

}



app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  if (mainWindow === null) createWindow()
});