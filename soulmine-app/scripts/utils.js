// utils.js — Глобальные функции и состояние (Senior Dev Edition)

const appState = {
  userAddress: null,
  isCalling: false,
  callStartTime: null,
  callTimer: null,
  miningInterval: null,
  localStream: null,
  peerConnection: null,
  dataChannel: null,
  ws: null,
  callPartnerAddress: null,
  isSearching: false,
  currentFilter: 'none',
  sharedMoment: false,

  // Прогресс SoulAI
  soulAI: {
    emotions: { happy: 0, neutral: 0, surprised: 0, focused: 0 },
    compatibility: 50,
    adviceCooldown: false
  },

  // Поведение пользователя
  userBehavior: {
    messagesSent: 0,
    responseTime: [],
    initiatedChats: 0,
    usedVoice: false,
    usedVideo: false
  },

  // Прогресс пары
  coupleProgress: {
    messages: 0,
    days_active: 0,
    compatibility: 50
  },

  // История звонков
  callHistory: [],

  // TonConnect
  connector: null,

  // Кэш
  cache: {
    loveBalance: null,
    nfts: [],
    coupleNFTs: []
  },

  // Квесты
  quests: [
    { id: "connect_wallet", title: "Подключите кошелёк", description: "Станьте частью движения #LoveOnTON", goal: 1, progress: 0, reward: { love: 50, nft: "Апостол Любви" }, completed: false },
    { id: "first_call", title: "Совершите первый звонок", description: "Получите 100 $LOVE и NFT Гражданина", goal: 1, progress: 0, reward: { love: 100, nft: "Гражданин SoulMine" }, completed: false },
    { id: "swipe_like", title: "Свайпните вправо", description: "Найдите свою AI-совместимость", goal: 5, progress: 0, reward: { love: 10, nft: null }, completed: false },
    { id: "complete_call", title: "Завершите звонок", description: "Каждая минута = $LOVE", goal: 10, progress: 0, reward: { love: 50, nft: "Мастер Звонков" }, completed: false },
    { id: "vote_in_dao", title: "Проголосуйте в DAO", description: "Ваш голос = ваше влияние", goal: 3, progress: 0, reward: { love: 30, nft: "Демократ Любви" }, completed: false },
    { id: "share_achievement", title: "Поделитесь достижением", description: "Станьте апостолом движения", goal: 1, progress: 0, reward: { love: 25, nft: "Проповедник Любви" }, completed: false }
  ],

  // Контакты
  contacts: {
    telegram: [],
    ton: []
  },

  // DAO
  dao: {
    proposals: [],
    userVotes: {},
    userNFT: null
  }
};

const CONFIG = {
  JETTON_MASTER_ADDRESS: 'EQAf1n9pHB4gITeBj4VA6jYKa4QKAs7e1z5SSQY3DnYme-Yj',
  DAO_CONTRACT_ADDRESS: 'EQB...', // Заменить на реальный адрес DAO
  SIGNALING_SERVER_URL: 'wss://soulmine-signaling.fly.dev',
  TON_MANIFEST_URL: 'https://soulmine-web.vercel.app/tonconnect-manifest.json', // ✅ УБРАНЫ ПРОБЕЛЫ
  STORAGE_KEYS: {
    USER_ADDRESS: 'soulmine_user_address',
    SOUL_AI: 'soulmine_soul_ai',
    USER_BEHAVIOR: 'soulmine_user_behavior',
    QUESTS: 'soulmine_quests',
    CALL_HISTORY: 'soulmine_call_history_',
    ACHIEVEMENTS: 'soulmine_achievements',
    DAO: 'soulmine_dao',
    CONTACTS: 'soulmine_contacts'
  }
};

// ========================
// 💾 ХЕЛПЕРЫ ДЛЯ localStorage
// ========================

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('❌ Не удалось сохранить в localStorage', key, e);
  }
}

function loadFromStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.warn('❌ Не удалось загрузить из localStorage', key, e);
    return fallback;
  }
}

// Загрузка состояния при старте
appState.userAddress = loadFromStorage(CONFIG.STORAGE_KEYS.USER_ADDRESS);
appState.soulAI = loadFromStorage(CONFIG.STORAGE_KEYS.SOUL_AI, appState.soulAI);
appState.userBehavior = loadFromStorage(CONFIG.STORAGE_KEYS.USER_BEHAVIOR, appState.userBehavior);
appState.quests = loadFromStorage(CONFIG.STORAGE_KEYS.QUESTS, appState.quests);
appState.callHistory = loadFromStorage(`${CONFIG.STORAGE_KEYS.CALL_HISTORY}${appState.userAddress}`, []);
appState.dao = loadFromStorage(CONFIG.STORAGE_KEYS.DAO, appState.dao);
appState.contacts = loadFromStorage(CONFIG.STORAGE_KEYS.CONTACTS, appState.contacts);

// ========================
// 💬 ЛОГИКА: $LOVE, ЧАТ, ПОДЕЛИТЬСЯ
// ========================

function getShareText() {
  const refLink = `https://t.me/LoveSoulMine_Bot?start=ref_${encodeURIComponent(appState.userAddress || '')}`;
  return `Я заработал ${appState.cache.loveBalance} $LOVE в SoulMine! 💜\nМоя AI-совместимость: ${appState.coupleProgress.compatibility.toFixed(0)}%\nПрисоединяйся → ${refLink}`;
}

async function tryShare(shareText) {
  if (!shareText) return false;

  try {
    // ✅ Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink('https://t.me/LoveSoulMine_Bot'); // ✅ УБРАНЫ ПРОБЕЛЫ
      showViralToast("🔗 Ссылка открыта в Telegram! Поделись и получи +5 $LOVE!");
      localStorage.setItem('shared_love', '1');
      updateQuestProgress("share_achievement");
      return true;
    }

    // ✅ Современные браузеры
    if (navigator.share) {
      await navigator.share({ text: shareText });
      localStorage.setItem('shared_love', '1');
      updateQuestProgress("share_achievement");
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Share API failed:', err);
  }

  // ✅ Fallback: копирование в буфер
  try {
    await navigator.clipboard.writeText(shareText);
    showViralToast("🔗 Ссылка скопирована! Поделись в соцсетях и получи +5 $LOVE!");
    localStorage.setItem('shared_love', '1');
    updateQuestProgress("share_achievement");
    return true;
  } catch (err) {
    console.error('❌ Не удалось скопировать в буфер:', err);
    showViralToast("❌ Не удалось скопировать ссылку. Попробуйте вручную.");
    return false;
  }
}

function showLove(amount) {
  if (amount <= 0) return;
  addLove(amount);

  if (
    appState.userAddress &&
    appState.cache.loveBalance >= 10 &&
    localStorage.getItem('shared_love') !== '1'
  ) {
    setTimeout(() => tryShare(getShareText()), 5000);
  }
}

function addLove(amount) {
  if (!appState.userAddress) return;

  getLoveBalance(appState.userAddress)
    .then(current => {
      const clean = current.replace('—', '0').replace(/,/g, '');
      const currentNum = parseFloat(clean) || 0;
      const newBalance = currentNum + amount;
      appState.cache.loveBalance = Math.max(0, newBalance);
      updateUIBalance(newBalance.toFixed(4));
    })
    .catch(err => {
      console.error('❌ Ошибка получения баланса:', err);
      appState.cache.loveBalance = (appState.cache.loveBalance || 0) + amount;
      updateUIBalance(appState.cache.loveBalance.toFixed(4));
    });
}

function updateUIBalance(balanceStr) {
  const elements = [
    document.getElementById('profile-balance'),
    document.getElementById('profile-balance-profile')
  ];
  elements.forEach(el => {
    if (el) el.textContent = `${balanceStr} $LOVE`;
  });
}

function appendChatMessage(text, sender) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  const msg = document.createElement('div');
  msg.className = sender === 'you' ? 'msg msg-you' : 'msg msg-partner';
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;

  appState.userBehavior.messagesSent++;
  appState.coupleProgress.messages++;
  updateQuestProgress("swipe_like");
}

// ========================
// 🎮 СИСТЕМА КВЕСТОВ
// ========================

function updateQuestProgress(questId, increment = 1) {
  const quest = appState.quests.find(q => q.id === questId);
  if (!quest || quest.completed) return;

  quest.progress = Math.min(quest.goal, quest.progress + increment);

  if (quest.progress >= quest.goal && !quest.completed) {
    completeQuest(quest);
  }

  saveQuests();
}

function completeQuest(quest) {
  quest.completed = true;

  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }

  if (quest.reward.love > 0) {
    showLove(quest.reward.love);
  }

  if (quest.reward.nft) {
    showNFTModal({ name: quest.reward.nft, image: "🏆" });
    unlockAchievement(quest.id, quest.reward.nft, quest.description, "🏆");
  }

  saveQuests();

  if (document.getElementById('quests-list')) {
    renderQuests();
  }
}

function saveQuests() {
  saveToStorage(CONFIG.STORAGE_KEYS.QUESTS, appState.quests);
}

function renderQuests() {
  const container = document.getElementById('quests-list');
  if (!container) return;

  container.innerHTML = '';

  appState.quests.forEach(quest => {
    const progressPercent = Math.min(100, Math.floor((quest.progress / quest.goal) * 100));
    const isCompleted = quest.completed;
    const rewardText = `🎁 +${quest.reward.love} $LOVE${quest.reward.nft ? `, NFT "${quest.reward.nft}"` : ''}`;

    const div = document.createElement('div');
    div.className = `quest-item ${isCompleted ? 'completed' : ''}`;
    div.innerHTML = `
      <h3>${quest.title} ${isCompleted ? '✅' : ''}</h3>
      <p>${quest.description}</p>
      <div class="quest-progress-bar">
        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <p class="quest-progress-text">${quest.progress}/${quest.goal}</p>
      ${isCompleted ? `<div class="quest-reward">${rewardText}</div>` : ''}
    `;
    container.appendChild(div);
  });
}

// ========================
// 🏆 СИСТЕМА ДОСТИЖЕНИЙ
// ========================

function unlockAchievement(id, title, description, icon) {
  const achievements = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS) || '[]');
  if (achievements.includes(id)) return;

  achievements.push(id);
  localStorage.setItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
    z-index: 10000; font-family: system-ui, sans-serif;
  `;
  modal.innerHTML = `
    <div class="modal-content" style="
      background: linear-gradient(135deg, #0a0a2a, #1a1a4a);
      color: #fff; padding: 30px; border-radius: 16px; text-align: center;
      max-width: 90%; box-shadow: 0 12px 40px rgba(0, 209, 178, 0.3);
    ">
      <div style="font-size: 4rem; margin-bottom: 20px;">${icon}</div>
      <h2 style="color: #00D1B2; margin-bottom: 10px;">${title}</h2>
      <p style="margin-bottom: 25px; line-height: 1.5;">${description}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary" style="
        width: 100%; padding: 12px; border: none; border-radius: 8px;
        background: linear-gradient(135deg, #00D1B2, #00F0E9); color: #000; font-weight: bold;
      ">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  setTimeout(() => {
    if (modal.parentElement) modal.parentElement.remove();
  }, 5000);
}

// ========================
// 💞 ПАРНЫЕ NFT
// ========================

function checkCoupleNFTs() {
  const COUPLE_NFTS = [
    { id: "first_night", name: "Первая ночь", required_messages: 50, image: "🌙" },
    { id: "couple_month", name: "Пара месяца", required_days: 30, image: "🏆" },
    { id: "eternal_match", name: "Вечная совместимость", required_compatibility: 99, image: "⚡" }
  ];

  COUPLE_NFTS.forEach(nft => {
    const key = `soulmine_couple_nft_${nft.id}`;
    if (localStorage.getItem(key)) return;

    let earned = false;
    if (nft.required_messages && appState.coupleProgress.messages >= nft.required_messages) earned = true;
    if (nft.required_days && appState.coupleProgress.days_active >= nft.required_days) earned = true;
    if (nft.required_compatibility && appState.coupleProgress.compatibility >= nft.required_compatibility) earned = true;

    if (earned) {
      localStorage.setItem(key, '1');
      showNFTModal(nft);
      saveCoupleNFT(nft);
    }
  });
}

function saveCoupleNFT(nft) {
  const container = document.getElementById('couple-nft-container-profile') || document.getElementById('couple-nft-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'nft-item';
  div.innerHTML = `
    <div style="font-size:2.5em; display:flex; align-items:center; justify-content:center; height:100%;">${nft.image}</div>
    <div class="nft-overlay">${nft.name}</div>
  `;
  container.appendChild(div);

  const section = document.getElementById('couple-nft-section');
  if (section) section.style.display = 'block';
}

// ========================
// 📞 ИСТОРИЯ ЗВОНКОВ
// ========================

function loadCallHistory() {
  if (!appState.userAddress) return;
  const key = `${CONFIG.STORAGE_KEYS.CALL_HISTORY}${appState.userAddress}`;
  const saved = loadFromStorage(key, []);
  appState.callHistory = saved;
}

function saveCallHistory() {
  if (!appState.userAddress) return;
  const key = `${CONFIG.STORAGE_KEYS.CALL_HISTORY}${appState.userAddress}`;
  saveToStorage(key, appState.callHistory);

  if (appState.callHistory.length % 5 === 0 && typeof saveToTonStorage === 'function') {
    saveToTonStorage(appState.callHistory, `call_history_${appState.userAddress}.json`);
  }
}

function renderCallHistory() {
  const container = document.getElementById('call-history-list');
  if (!container) return;

  if (appState.callHistory.length === 0) {
    container.innerHTML = '<p class="empty-state">История звонков пуста</p>';
    return;
  }

  container.innerHTML = '';
  [...appState.callHistory].reverse().forEach(call => {
    const date = new Date(call.startTime).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const partner = call.partner ? `${call.partner.slice(0, 6)}...${call.partner.slice(-4)}` : '—';

    const div = document.createElement('div');
    div.className = 'call-record';
    div.innerHTML = `
      <p><strong>Собеседник:</strong> ${partner}</p>
      <p><strong>Длительность:</strong> ${call.duration || 0} мин</p>
      <p><strong>Совместимость:</strong> ${(call.compatibility || 0).toFixed(1)}%</p>
      <p><strong>Заработано:</strong> ${call.earnedLove?.toFixed(2) || '0.00'} $LOVE</p>
      <p><strong>Дата:</strong> ${date}</p>
      <hr style="margin: 12px 0;">
    `;
    container.appendChild(div);
  });
}

// ========================
// 🖥️ НАВИГАЦИЯ И СКРИНЫ
// ========================

window.showScreen = function(id) {
  const screens = ['main-screen', 'chat-screen', 'profile', 'quests', 'history', 'dao', 'contacts', 'swipe-screen'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(id);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[onclick="showScreen('${id}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  switch (id) {
    case 'main-screen':
      document.querySelector('.movement-banner')?.style.setProperty('display', 'block');
      break;
    case 'profile':
      if (appState.connector?.connected && appState.userAddress) {
        getLoveBalance(appState.userAddress).then(b => updateUIBalance(b));
        loadNFTs(appState.userAddress);
        checkCoupleNFTs();

        const statsEl = document.getElementById('user-stats');
        if (statsEl) {
          statsEl.innerHTML = `
            <p>Сообщений отправлено: ${appState.userBehavior.messagesSent}</p>
            <p>Звонков совершено: ${appState.userBehavior.initiatedChats}</p>
            <p>Квестов выполнено: ${appState.quests.filter(q => q.completed).length}</p>
            <p>$LOVE заработано: ${appState.cache.loveBalance?.toFixed(4) || '0.0000'}</p>
          `;
        }
      }
      break;
    case 'quests':
      renderQuests();
      break;
    case 'history':
      loadCallHistory();
      renderCallHistory();
      break;
    case 'dao':
      loadCitizenNFT();
      loadProposals();
      break;
    case 'contacts':
      loadTelegramContacts();
      break;
  }
};

// ========================
// 🖼️ NFT МОДАЛКА
// ========================

function showNFTModal(nft) {
  const modal = document.getElementById('nft-modal');
  if (!modal) return;

  const name = nft.name || 'Неизвестный NFT';
  const image = nft.image || '🖼️';

  document.getElementById('nft-name')?.textContent = `"${name}"`;
  document.getElementById('nft-image')?.innerHTML = `<div style="font-size: 4rem;">${image}</div>`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('nft-modal');
  if (modal) modal.style.display = 'none';
}

// ========================
// 🌟 ВИРУСНЫЕ UI-ЭЛЕМЕНТЫ
// ========================

function showViralToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #00D1B2, #00F0E9);
    color: #00005B; padding: 15px 20px; border-radius: 12px; z-index: 10000;
    font-weight: bold; box-shadow: 0 4px 20px rgba(0, 209, 178, 0.4);
    animation: slideUp 0.5s ease-out;
    font-family: system-ui, sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

function triggerMiningEffect(text) {
  const effect = document.createElement('div');
  effect.textContent = text;
  effect.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    color: #6a0dad; font-weight: bold; font-size: 20px; z-index: 1000;
    opacity: 0; pointer-events: none; text-shadow: 0 0 5px rgba(106, 13, 173, 0.5);
    transition: opacity 0.3s ease-out;
    font-family: system-ui, sans-serif;
  `;
  document.body.appendChild(effect);
  setTimeout(() => effect.style.opacity = '1', 10);
  setTimeout(() => effect.style.opacity = '0', 2000);
  setTimeout(() => effect.remove(), 2500);
}

// ========================
// 🧩 ЗАГЛУШКИ
// ========================

function getLoveBalance(address) {
  return Promise.resolve("0.0000");
}

function loadNFTs(address) {
  console.log('loadNFTs not implemented', address);
}

function loadCitizenNFT() {
  console.log('loadCitizenNFT not implemented');
}

function loadProposals() {
  console.log('loadProposals not implemented');
}

function saveToTonStorage(data, filename) {
  console.log('saveToTonStorage not implemented', filename, data);
}

function connectToSignalingServer() {
  console.log('connectToSignalingServer not implemented');
}

function showPartnerPreview() {
  const models = ['model01', 'model02', 'model03', 'model04', 'model05', 'model06', 'model11', 'model44', 'model66'];
  const randomModel = models[Math.floor(Math.random() * models.length)];
  const img = document.getElementById('partner-preview');
  if (img) {
    img.src = `https://soulmine-web.vercel.app/assets/models/${randomModel}.png`; // ✅ УБРАНЫ ПРОБЕЛЫ
    img.style.display = 'block';
  }
}

function loadTelegramContacts() {
  console.log('loadTelegramContacts not implemented');
}

// ========================
// 🔄 ЭКСПОРТ
// ========================

window.appState = appState;
window.CONFIG = CONFIG;
window.showLove = showLove;
window.appendChatMessage = appendChatMessage;
window.showScreen = showScreen;
window.updateQuestProgress = updateQuestProgress;
window.completeQuest = completeQuest;
window.renderQuests = renderQuests;
window.checkCoupleNFTs = checkCoupleNFTs;
window.loadCallHistory = loadCallHistory;
window.saveCallHistory = saveCallHistory;
window.renderCallHistory = renderCallHistory;
window.showPartnerPreview = showPartnerPreview;
window.unlockAchievement = unlockAchievement;
window.showViralToast = showViralToast;
window.tryShare = tryShare;
window.getShareText = getShareText;

// ========================
// 🧹 СОХРАНЕНИЕ ПРИ ВЫХОДЕ
// ========================

window.addEventListener('beforeunload', () => {
  saveToStorage(CONFIG.STORAGE_KEYS.USER_ADDRESS, appState.userAddress);
  saveToStorage(CONFIG.STORAGE_KEYS.SOUL_AI, appState.soulAI);
  saveToStorage(CONFIG.STORAGE_KEYS.USER_BEHAVIOR, appState.userBehavior);
  saveToStorage(CONFIG.STORAGE_KEYS.QUESTS, appState.quests);
  saveCallHistory();
});