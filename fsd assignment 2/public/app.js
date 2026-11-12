const socket = io();

const homeScreen = document.getElementById("homeScreen");
const waitingScreen = document.getElementById("waitingScreen");
const chatScreen = document.getElementById("chatScreen");
const endedScreen = document.getElementById("endedScreen");

const findButton = document.getElementById("findButton");
const cancelButton = document.getElementById("cancelButton");
const endButton = document.getElementById("endButton");
const againButton = document.getElementById("againButton");
const homeButton = document.getElementById("homeButton");
const homeError = document.getElementById("homeError");
const waitingInterests = document.getElementById("waitingInterests");
const sharedTopics = document.getElementById("sharedTopics");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let currentRoom = null;
let selectedInterests = [];

function showScreen(screen) {
  [homeScreen, waitingScreen, chatScreen, endedScreen].forEach((item) => {
    item.classList.add("hidden");
  });
  screen.classList.remove("hidden");
}

function getSelectedInterests() {
  return [...document.querySelectorAll(".interest input:checked")]
    .map((input) => input.value);
}

function startSearch() {
  selectedInterests = getSelectedInterests();
  homeError.textContent = "";

  if (selectedInterests.length === 0) {
    homeError.textContent = "Please choose at least one interest.";
    return;
  }

  waitingInterests.innerHTML = "";
  selectedInterests.forEach((interest) => {
    const tag = document.createElement("span");
    tag.textContent = interest;
    waitingInterests.appendChild(tag);
  });

  showScreen(waitingScreen);
  socket.emit("find-match", selectedInterests);
}

function addMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `message ${sender === "You" ? "you" : "stranger"}`;

  const label = document.createElement("small");
  label.textContent = sender;
  const content = document.createElement("div");
  content.textContent = text;

  bubble.append(label, content);
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

findButton.addEventListener("click", startSearch);

cancelButton.addEventListener("click", () => {
  socket.emit("cancel-search");
  showScreen(homeScreen);
});

socket.on("waiting", () => {
  showScreen(waitingScreen);
});

socket.on("matched", (data) => {
  currentRoom = data.roomId;
  sharedTopics.textContent = `You both like: ${data.sharedInterests.join(", ")}`;
  messages.innerHTML = '<div class="system-message">You are now connected. Say hello!</div>';
  showScreen(chatScreen);
  messageInput.focus();
});

socket.on("match-error", (message) => {
  showScreen(homeScreen);
  homeError.textContent = message;
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message || !currentRoom) return;

  socket.emit("send-message", { roomId: currentRoom, message });
  messageInput.value = "";
  messageInput.focus();
});

socket.on("message-sent", (data) => {
  addMessage(data.message, "You");
});

socket.on("new-message", (data) => {
  addMessage(data.message, "Stranger");
});

function endChat() {
  if (currentRoom) {
    socket.emit("end-chat", currentRoom);
  }
  currentRoom = null;
  showScreen(endedScreen);
}

endButton.addEventListener("click", endChat);

socket.on("chat-ended", () => {
  currentRoom = null;
  showScreen(endedScreen);
});

againButton.addEventListener("click", startSearch);
homeButton.addEventListener("click", () => {
  document.querySelectorAll(".interest input").forEach((input) => {
    input.checked = false;
  });
  showScreen(homeScreen);
});
