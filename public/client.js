var socket = io();

var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
var username = document.getElementById("username");
var imageInput = document.getElementById("imageInput");
var password = document.getElementById("password");

// CONSOLE ONLY COMMANDS
// (var) = true/false
var distinguish = false;

var soundJoin = document.getElementById("join");
var soundLeave = document.getElementById("leave");
var soundSend = document.getElementById("send");
var soundAnnounce = document.getElementById("announceSfx");

// COMMANDS

function refreshcommands() {
  document.getElementById("refreshCMD").disabled = true;
  socket.emit("refreshCommands", password.value);
}

function deleteMessage() {
  var message = prompt("What message do you want to delete- must be msgID.");
  socket.emit("admincommand", [
    "deleteMessage",
    password.value,
    username.value,
    message,
  ]);
}

function forceRefresh() {
  socket.emit("admincommand", ["refreshEveryone", password.value]);
}

function announce() {
  var msg = prompt("What do you want the message to be?");
  socket.emit("admincommand", [
    "announce",
    password.value,
    username.value,
    msg,
  ]);
}

function lockchat() {
  socket.emit("admincommand", ["lockChat", password.value, username.value]);
}

function jumpscare() {
  socket.emit("admincommand", ["jumpscare", password.value])
}

function jumpscareNice() {
  socket.emit("admincommand", ["jumpscareNice", password.value])
}

function universeReset() {
  socket.emit("admincommand", ["universeReset", password.value])
}

function distinguishToggle() {
  if (distinguish) {
    distinguish = false;
    alert('Distinguish has been disabled.')
  } else {
    distinguish = true;
    alert('Distinguish has been enabled- you will now show up as a regular user.')
  }
}

function toggleConnectMsg() {
  socket.emit('admincommand', ["toggleConnectMSG", password.value, username.value])
}

function developmentSend() {
  socket.emit('admincommand', ["lockanddevelop", password.value])
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (username.value == "") {
    alert("You need to put a username first to chat.");
    return;
  }
  if (username.value.length >= 15) {
    alert("Your username is too long.")
    return;
  }

  var message = input.value;
  var file = imageInput.files[0];

  if (message === "" && !file) {
    alert("You need to type a message or upload an image before you send.");
    return;
  }

  var msgData = [username.value, message, password.value, "", "", 0, distinguish];

  if (file) {
    var reader = new FileReader();
    reader.onload = function (event) {
      msgData[3] = event.target.result; // Add the base64 image data
      socket.emit("chat message", msgData);
      username.style.display = "none";
      input.value = "";
      imageInput.value = ""; // Clear the file input
    };
    reader.readAsDataURL(file); // Convert the image to base64
  } else {
    socket.emit("chat message", msgData);
    username.style.display = "none";
    input.value = "";
  }
});

socket.on("chat message", function (msg) {
  soundSend.play();

  var item = document.createElement("li");
  item.id = "msg_"+msg[5];
  item.classList.add('message')
  item.classList.add("fade-in");

  // Create a span for the username
  var usernameSpan = document.createElement("span");
  usernameSpan.style.fontWeight = "bold"; // Make the username bold
  usernameSpan.style.color = msg[4];
  usernameSpan.textContent = `${msg[0]}:`; // Set the username text

  // Create a span for the message text
  var messageSpan = document.createElement("span");
  messageSpan.style.color = "white";
  messageSpan.textContent = ` ${msg[1]}`; // Set the message text with a space before

  var messageidSpan = document.createElement("span");
  messageidSpan.style.color = "gray";
  messageidSpan.style.fontSize = "smaller";
  messageidSpan.textContent = ` id: ${msg[5]}`;

  // Append the username and message to the list item
  item.appendChild(usernameSpan);
  item.appendChild(messageSpan);
  item.appendChild(messageidSpan);

  if (msg[3]) {
    // Check if there is an image
    var img = document.createElement("img");
    img.src = msg[3]; // Set image source to the base64 data
    img.style.maxWidth = "200px"; // Set image size
    img.style.display = "block"; // Make image a block element
    item.appendChild(img);
  }

  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);

  requestAnimationFrame(() => {
    item.classList.add("show"); // Add show class after item is appended
  });
});

socket.on("userconnect", function (mem) {
  soundJoin.play();

  var item = document.createElement("li");
  item.style.color = "white";
  item.textContent = `A user has connected, there are now ${mem} member(s).`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on("userdisconnect", function (mem) {
  soundLeave.play();

  var item = document.createElement("li");
  item.style.color = "white";
  item.textContent = `A user has disconnected, there are now ${mem} member(s).`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on("userCount", function (count) {
  document.getElementById("onlineMembers").textContent = count;
});

socket.on("removeMessage", function (id) {
  var item = document.getElementById("msg_"+id);

  if (item) {
    item.remove();
  }
});

socket.on("removeMessage", function (id) {
  var item = document.getElementById(id);
  if (item) {
    item.remove();
  }
});

socket.on("notagent", function () {
  alert(
    "To send messages, fellow admin, change your username to not be agentn86. Thanks"
  );
});

socket.on("refresh", function () {
  location.reload();
});

socket.on("lockMsg", function (lock) {
  // lock[0] = username
  // lock[1] = toggle lock
  var item = document.createElement("li");
  item.style.color = "white";
  item.textContent = `${lock[0]} has made locking the chat ${lock[1]}, only moderators, admins, or owners can talk during lockdown.`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on("warningadmin", function () {
  alert(
    "You are sending senstive data. Remove it, and your message will be sent."
  );
});

socket.on("announce", function (msg) {
  // msg[0] = username
  // msg[1] = content
  document.getElementById("announce_member").textContent = `${msg[0]} sayz: `;
  document.getElementById("announce_message").textContent = msg[1];

  document.getElementById("announce").style.display = "block";
  soundAnnounce.play();

  setTimeout(function () {
    document.getElementById("announce").style.display = "none";
  }, 5000);
});

socket.on("returnCommands", function (role) {
  var deleteMessage = document.getElementById("command_deletemsg");
  var forceRefresh = document.getElementById("command_forcerefresh");
  var announce = document.getElementById("command_announce");
  var lockChat = document.getElementById("command_lockchat");
  var jumpscare = document.getElementById('command_jumpscare');
  var distinguish = document.getElementById('command_distinguish');
  var toggleConnectMsg = document.getElementById('command_toggleConnectMsg');
  var developmentMode = document.getElementById('command_devMode');

  switch (role) {
    case "owner":
      deleteMessage.disabled = false;
      forceRefresh.disabled = false;
      announce.disabled = false;
      lockChat.disabled = false;
      jumpscare.disabled = false;
      distinguish.disabled = false;
      toggleConnectMsg.disabled = false;
      developmentMode.disabled = false;
      break;
    case "coowner":
      deleteMessage.disabled = false;
      forceRefresh.disabled = true;
      announce.disabled = false;
      lockChat.disabled = false;
      jumpscare.disabled = false;
      distinguish.disabled = false;
      toggleConnectMsg.disabled = false;
      developmentMode.disabled = true;
      break;
    case "admin":
      deleteMessage.disabled = false;
      forceRefresh.disabled = true;
      announce.disabled = false;
      lockChat.disabled = false;
      jumpscare.disabled = true;
      distinguish.disabled = true;
      toggleConnectMsg.disabled = false;
      developmentMode.disabled = true;
      break;
    case "mod":
      deleteMessage.disabled = false;
      forceRefresh.disabled = true;
      announce.disabled = false;
      lockChat.disabled = false;
      jumpscare.disabled = true;
      distinguish.disabled = true;
      toggleConnectMsg.disabled = true;
      developmentMode.disabled = true;
      break;
    case "trialMod":
      deleteMessage.disabled = false;
      forceRefresh.disabled = true;
      announce.disabled = true;
      lockChat.disabled = true;
      jumpscare.disabled = true;
      distinguish.disabled = true;
      toggleConnectMsg.disabled = true;
      developmentMode.disabled = true;
      break;
    case "regular":
      deleteMessage.disabled = true;
      forceRefresh.disabled = true;
      announce.disabled = true;
      lockChat.disabled = true;
      jumpscare.disabled = true;
      distinguish.disabled = true;
      toggleConnectMsg.disabled = true;
      developmentMode.disabled = true;
      break;
  }
});

socket.on("missingPerm", function (role) {
  alert(`You do not reach the required permission to use this command- you need to have the "${role}" role to do that.`)
})

socket.on("changeUsernameagent", function() {
  alert("You don't have the required permission to have this username. Refresh, and change it.")
})

socket.on("jumpscare", function() {
  document.getElementById('jumpscare').src = "https://cdn.glitch.global/d7ca64b9-401f-403a-bf38-6a2d5013aacd/eviljuan.png?v=1729887239126"
  document.getElementById('jumpscare').style.display = "block"
  window.location.href = "#j"
  document.getElementById('jumpaudio').play()
  setTimeout(function () { document.getElementById('jumpscare').style.display = "none"; window.location.href= "#top" }, 3000)
})

socket.on("jumpscareNice", function() {
  document.getElementById('jumpscare').src = "https://cdn.glitch.global/d7ca64b9-401f-403a-bf38-6a2d5013aacd/nicejuan.png?v=1730210373981"
  document.getElementById('jumpscare').style.display = "block"
  window.location.href = "#j"
  document.getElementById('jumpNiceaudio').play()
  setTimeout(function () { document.getElementById('jumpscare').style.display = "none"; window.location.href= "#top" }, 10000)
})

1

document.getElementById('command_jumpscare').addEventListener('contextmenu', function() {
  jumpscareNice();
  return false;
});

socket.on("connectmsgToggleMsg", function(lock) {
  var item = document.createElement("li");
  item.style.color = "white";
  item.textContent = `${lock[0]} has made connect/disconnect messages ${lock[1]}.`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
})

socket.on("developSend", function() {
  window.location.replace("https://agentsyaproom.glitch.me/development.html")
})

socket.on("bannedwordMsg", function() {
  alert('Your message contains a censored word, remove it and your message will be sent.')
})

socket.on("messagetoLong", function(char) {
  alert(`Your message is too long, it needs to be ${char} characters less (including spaces).`)
})

socket.on('universeReset', function() {
  let elements = document.getElementsByClassName('message');
  while(elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
  }
})

document.getElementById("image").addEventListener("click", function () {
  var popup = document.getElementById("popup");
  popup.style.display = popup.style.display === "none" ? "block" : "none";
});

function debugMode() {
  var script = document.createElement('script');
  script.src="https://cdn.jsdelivr.net/npm/eruda";
  document.body.append(script);
  script.onload = function () { eruda.init(); };
}

var tips = [
  "The owner's name will show up as GOLD.",
  "Users will know when someone connects or disconnects from the chat.",
  "Images are allowed, click on the plus icon next to the send button.",
  "Anyone pretending to be agentn86 is false- they will not put their real name and their color name will be gold.",
  "Personal information will not be censored, so it is recommended to stay safe.",
  "If you have any suggestions for this website, go to the REQUEST FORM and submit a 'suggestion'. Make sure you signify that you are talking about agents yaproom.",
  "Green is regular, white is a system message, red is an admin, cyan is an moderator, and gold is the owner.",
  "You have to click on 'Refresh Commands' to get your correct commands for that password- you can only click it once though."
];

var tip = tips[Math.floor(Math.random() * tips.length)];
document.getElementById("systemMessageTip").innerText = tip;
