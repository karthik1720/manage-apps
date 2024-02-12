const { app, BrowserWindow } = require("electron");
const serve = require("electron-serve");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const kill = require("tree-kill");
const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, "../out"),
    })
  : null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:1234");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
};

app.on("ready", () => {
  createWindow();
  createWs();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const createWs = () => {
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust this to limit access to specific origins
      methods: ["GET", "POST"], // Adjust this to allow specific HTTP methods
    },
  });

  io.on("connection", (socket) => {
    console.log("WebSocket connected");

    const childs = [];

    socket.on("message", (message) => {
      console.log("Received message:", message);
    });

    socket.on("execute-cmd", (dat) => {
      const { msg, pid, cmd, index } = dat;
      if (pid !== "") {
        return;
      }
      var child = spawn(cmd, {
        shell: true,
      });
      console.log(child.pid);
      childs.push(child);
      child.stderr.on("data", function (data) {
        console.error("STDERR:", data.toString());
      });
      child.stdout.on("data", function (data) {
        console.log(data);
        socket.emit("message", {
          pid: child.pid,
          msg: data.toString(),
          index,
          cmd,
        });
      });
      child.on("exit", function (exitCode) {
        console.log("Child exited with code: " + exitCode);
      });
    });

    socket.on("kill-terminal", (message) => {
      childs.forEach((ch) => {
        kill(ch.pid);
      });
    });

    socket.emit("message", "Hello from WebSocket server!");
  });
  server.listen(1235);
};

//cd /Users/karthikn/Dev/portfolio-v2 && npm start
