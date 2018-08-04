// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, shell} = require('electron')
const path = require('path')
const Crypter = require(path.join(__dirname, 'crypter.js'))
const Loader = require(path.join(__dirname, 'loader.js'))
const Logger = require(path.join(__dirname, 'logger.js'))
const Proxy = require(path.join(__dirname, 'proxy.js'))
const Sharer = require(path.join(__dirname, 'sharer.js'))
const Transformer = require(path.join(__dirname, 'transformer.js'))

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Create logger
const logger = new Logger("main")

// Create sharer
const sharer = new Sharer(logger, "main")

// Create crypter
const crypter = new Crypter(logger, sharer)

// Create loader
const loader = new Loader(logger)

// Create transformer
const transformer = new Transformer(crypter)

// Create proxy
const proxy = new Proxy(crypter, loader, logger, sharer, transformer)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    // Create menu
    createMenu()

    // Listen proxy
    proxy.listen(createWindow)
})

function createMenu() {
    const template = [
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'delete'},
                {role: 'selectall'}
            ]
        },
        {
            label: 'View',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {role: 'toggledevtools'},
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click () { shell.openExternal('https://github.com/asticode/asticrypt') }
                }
            ]
        }
    ]

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        })

        // Edit menu
        template[1].submenu.push(
            {type: 'separator'},
            {
                label: 'Speech',
                submenu: [
                    {role: 'startspeaking'},
                    {role: 'stopspeaking'}
                ]
            }
        )

        // Window menu
        template[3].submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ]
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        width: 1500
    })

    // Proxy window
    proxy.handleWindow(mainWindow)

    // and load the index.html of the app.
    mainWindow.loadURL("https://slack.com/signin", {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0"
    })

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
