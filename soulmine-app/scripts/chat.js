// chat.js

function openChat() {
  showScreen('chat-screen');
}

function sendMsg(e) {
  if (e && e.key !== 'Enter') return;
  const input = document.querySelector('.chat-input input');
  const value = input.value.trim();
  if (!value) return;

  appendChatMessage(value, 'you');

  input.value = '';
  window.userBehavior.messagesSent++;
  window.coupleProgress.messages++;
  incrementQuest("50_messages", 1);
  addLove(0.2);

  if (window.dataChannel && window.dataChannel.readyState === 'open') {
    window.dataChannel.send(JSON.stringify({
      type: 'chat_message',
      text: value
    }));
  }
}

window.openChat = openChat;
window.sendMsg = sendMsg;