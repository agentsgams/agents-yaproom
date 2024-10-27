const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const RATE_LIMIT = 2000;
const lastMessageTimes = new Map();
let userCount = 0;
let messageID = 0;

// Admin Variables
let locked = false;

// CONFIG
let announceJoinLeave = true;
let roleColors = {
  guest: "green",
  trialmod: "blue",
  moderator: "cyan",
  admin: "orange",
  owner: "#fcd121",
};

// socket.emit()   || ONE CLIENT
// io.emit()       || ALL CLIENTS

app.use(express.static(__dirname + "/public"));

function checkPermission(role, password) {
  switch (role) {
    case "trialmod":
      if (
        password == process.env.OwnerPassword ||
        password == process.env.AdminPassword ||
        password == process.env.ModeratorPassword ||
        password == process.env.TrialModPassword
      ) {
        return true;
      } else {
        return false;
      }
      break;
    case "moderator":
      if (
        password == process.env.OwnerPassword ||
        password == process.env.AdminPassword ||
        password == process.env.ModeratorPassword
      ) {
        return true;
      } else {
        return false;
      }
      break;
    case "admin":
      if (
        password == process.env.OwnerPassword ||
        password == process.env.AdminPassword
      ) {
        return true;
      } else {
        return false;
      }
      break;
    case "owner":
      if (password == process.env.OwnerPassword) {
        return true;
      } else {
        return false;
      }
      break;
  }
}

io.on("connection", (socket) => {
  userCount++;
  console.log("A user connected");
  io.emit("userCount", userCount);
  if (announceJoinLeave) {
    io.emit("userconnect", userCount);
  }

  socket.on("disconnect", () => {
    userCount--;
    console.log("A user disconnected");
    io.emit("userCount", userCount);
    if (announceJoinLeave) {
      io.emit("userdisconnect", userCount);
    }
  });

  socket.on("chat message", (msg) => {
    const username = msg[1];
    const currentTime = Date.now();
    var color = "green";

    // msg[0] = username
    // msg[1] = message
    // msg[2] = password
    // msg[3] = img
    // msg[4] = color
    // msg[5] = msgID
    // msg[6] = distinguish

    if (
      msg[1].includes(process.env.OwnerPassword) ||
      msg[1].includes(process.env.AdminPassword) ||
      msg[1].includes(process.env.ModeratorPassword)
    ) {
      socket.emit("warningadmin");
      return;
    }

    if (locked) {
      if (
        msg[2] == process.env.OwnerPassword ||
        msg[2] == process.env.AdminPassword ||
        msg[2] == process.env.ModeratorPassword ||
        msg[2] == process.env.TrialModPassword
      ) {
      } else {
        socket.emit("lockNotify");
        return;
      }
    }

    if (msg[2] == process.env.OwnerPassword) {
      if (msg[6] == true) {
        color = roleColors.regular;
      } else {
        color = roleColors.owner;
      }
    } else if (msg[2] == process.env.AdminPassword) {
      color = roleColors.admin;
    } else if (msg[2] == process.env.ModeratorPassword) {
      color = roleColors.moderator;
    } else if (msg[2] == process.env.TrialModPassword) {
      color = roleColors.trialmod;
    } else {
      color = roleColors.regular;
    }

    // Check if the user has sent a message recently
    if (lastMessageTimes.has(username)) {
      const lastTime = lastMessageTimes.get(username);
      if (currentTime - lastTime < RATE_LIMIT) {
        return;
      }
    }

    // If the user is not spamming, update the last message time and broadcast the message
    lastMessageTimes.set(username, currentTime);

    messageID++;
    msg[4] = color;
    msg[5] = messageID;

    if (color == "orange" && msg[0] == "agentn86") {
      socket.emit("notagent");
      return;
    }

    io.emit("chat message", msg);
  });

  socket.on("refreshCommands", function (password) {
    console.log("User requested to refresh commands.");
    switch (password) {
      case process.env.OwnerPassword:
        socket.emit("returnCommands", "owner");
        break;
      case process.env.AdminPassword:
        socket.emit("returnCommands", "admin");
        break;
      case process.env.ModeratorPassword:
        socket.emit("returnCommands", "mod");
        break;
      case process.env.TrialModPassword:
        socket.emit("returnCommands", "trialMod");
        break;
      default:
        socket.emit("returnCommands", "regular");
        break;
    }
  });

  socket.on("admincommand", function (list) {
    // list[0] = command
    // list[1] = password
    // list[2] = username
    // list[3] = input

    switch (list[0]) {
      case "deleteMessage":
        var allowed = checkPermission("trialmod", list[1]);
        if (!allowed) {
          socket.emit("missingPerm", "Trial Moderator");
          return;
        }
        console.log("Owner, admin, or moderator deleted message.");
        io.emit("removeMessage", list[3]);
        break;
      case "refreshEveryone":
        var allowed = checkPermission("owner", list[1]);
        if (!allowed) {
          socket.emit("missingPerm", "Owner");
          return;
        }
        console.log("Owner requested to refresh all users in session");
        io.emit("refresh");
        break;
      case "announce":
        var allowed = checkPermission("moderator", list[1]);
        if (!allowed) {
          socket.emit("missingPerm", "Moderator");
          return;
        }
        if (!list[2]) {
          return;
        }
        io.emit("announce", [list[2], list[3]]);
        break;
      case "lockChat":
        var allowed = checkPermission("admin", list[1]);
        if (!allowed) {
          socket.emit("missingPerm", "Admin");
          return;
        }
        if (locked) {
          locked = false;
        } else {
          locked = true;
        }
        io.emit("lockMsg", [list[2], locked]);
        break;
      case "jumpscare":
        var allowed = checkPermission("owner", list[1]);
        if (!allowed) {
          socket.emit("missingPerm", "Owner");
          return;
        }
        io.emit("jumpscare")
        break;
    }
  });
});

server.listen(3000, () => {
  console.log("Listening on *:3000");
});
