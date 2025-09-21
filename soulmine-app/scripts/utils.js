// utils.js

// Глобальные переменные
window.userAddress = null;
window.isCalling = false;
window.callStartTime = null;
window.callTimer = null;
window.miningInterval = null;
window.localStream = null;
window.peerConnection = null;
window.dataChannel = null;
window.ws = null;
window.callPartnerAddress = null;
window.isSearching = false;
window.currentFilter = 'none';

// Константы
window.JETTON_MASTER_ADDRESS = 'EQAf1n9pHB4gITeBj4VA6jYKa4QKAs7e1z5SSQY3DnYme-Yj';
window.DAO_CONTRACT_ADDRESS = 'EQB...';
window.SIGNALING_SERVER_URL = 'wss://soulmine-signaling.fly.dev';
window.TON_MANIFEST_URL = 'https://soulmine-web.vercel.app/tonconnect-manifest.json';

// Прогресс пользователя
window.soulAI = {
  emotions: { happy: 0, neutral: 0, surprised: 0, focused: 0 },
  compatibility: 50,
  adviceCooldown: false
};

// Поведение пользователя
window.userBehavior = {
  messagesSent: 0,
  responseTime: [],
  initiatedChats: 0,
  usedVoice: false,
  usedVideo: false
};

// Прогресс пары
window.coupleProgress = {
  messages: 0,
  days_active: 0,
  compatibility: 50
};

// История звонков
window.callHistory = [];

// Функции
function showLove(amount) {
  addLove(amount);
}

function addLove(amount) {
  if (window.userAddress) {
    getLoveBalance(window.userAddress).then(current => {
      const currentNum = parseFloat(current.replace('—', '0'));
      const newBalance = currentNum + amount;
      const balanceEl = document.getElementById('profile-balance');
      if (balanceEl) balanceEl.textContent = `${newBalance.toFixed(4)} $LOVE`;
      const profileBalanceEl = document.getElementById('profile-balance-profile');
      if (profileBalanceEl) profileBalanceEl.textContent = `${newBalance.toFixed(4)} $LOVE`;
    });
  }
}

function showNFTModal(nft) {
  const modal = document.getElementById('nft-modal');
  if (!modal) return;
  document.getElementById('nft-name').textContent = `"${nft.name}"`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('nft-modal');
  if (modal) modal.style.display = 'none';
}

function triggerMiningEffect(text) {
  const effect = document.createElement('div');
  effect.textContent = text;
  effect.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    color: #6a0dad; font-weight: bold; font-size: 20px; z-index: 1000;
    opacity: 0; pointer-events: none; text-shadow: 0 0 5px rgba(106, 13, 173, 0.5);
    transition: opacity 0.3s ease-out;
  `;
  document.body.appendChild(effect);
  setTimeout(() => { effect.style.opacity = '1'; }, 10);
  setTimeout(() => { effect.style.opacity = '0'; }, 2000);
  setTimeout(() => { effect.remove(); }, 2500);
}

function appendChatMessage(text, sender) {
  const messages = document.getElementById('messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = sender === 'you' ? 'msg msg-you' : 'msg msg-partner';
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

window.showScreen = function(id) {
  const screens = ['main-screen', 'chat-screen', 'profile', 'quests', 'history', 'dao'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[onclick="showScreen('${id}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Загрузка данных для экрана
  if (id === 'profile' && window.connector?.connected && window.userAddress) {
    getLoveBalance(window.userAddress).then(b => {
      const balanceEl = document.getElementById('profile-balance-profile');
      if (balanceEl) balanceEl.textContent = `${b} $LOVE`;
    });
    loadNFTs(window.userAddress);
    checkCoupleNFTs();
  }
  if (id === 'quests') renderQuests();
  if (id === 'history') renderCallHistory();
  if (id === 'dao') {
    loadCitizenNFT();
    loadProposals();
  }
};