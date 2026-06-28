const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: true
  })
  
  win.loadURL('data:text/html,<h1>Test Window</h1><p>Electron is working!</p>')
  
  win.webContents.openDevTools()
  
  console.log('Window created and shown')
})
