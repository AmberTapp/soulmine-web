// main.js
function initTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready(); // Сообщаем Telegram, что приложение готово
    webApp.expand(); // Разворачиваем приложение на весь экран

    // Получаем данные пользователя
    const user = webApp.initDataUnsafe?.user;
    if (user) {
      console.log('👤 Пользователь Telegram:', user);
      // Можно сохранить ID пользователя для последующей идентификации
      localStorage.setItem('telegram_user_id', user.id);
    }

    // Настройка темы
    webApp.setBackgroundColor('#0f0f33');
    webApp.setHeaderColor('#00005B');

    // Показать главный экран
    showScreen('main-screen');
  }
}
window.addEventListener('load', async () => {
  const splashScreen = document.getElementById('splash-screen');

  try {
    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }

    loadQuests();
    loadCallHistory();
    loadCitizenNFT();
    updateConnectionState();
    setTimeout(showPartnerPreview, 1000);

  } catch (error) {
    console.error('Ошибка при инициализации:', error);
    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }
  }
});

const COUPLE_NFTS = [
  { id: "first_night", name: "Первая ночь", required_messages: 50, image: "🌙" },
  { id: "couple_month", name: "Пара месяца", required_days: 30, image: "🏆" },
  { id: "eternal_match", name: "Вечная совместимость", required_compatibility: 99, image: "⚡" }
];

function checkCoupleNFTs() {
  COUPLE_NFTS.forEach(nft => {
    if (localStorage.getItem(`soulmine_couple_nft_${nft.id}`)) return;
    let earned = false;
    if (nft.required_messages && window.coupleProgress.messages >= nft.required_messages) earned = true;
    if (nft.required_days && window.coupleProgress.days_active >= nft.required_days) earned = true;
    if (nft.required_compatibility && window.coupleProgress.compatibility >= nft.required_compatibility) earned = true;
    if (earned) {
      localStorage.setItem(`soulmine_couple_nft_${nft.id}`, '1');
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

function loadCallHistory() {
  if (!window.userAddress) return;
  const saved = localStorage.getItem(`soulmine_call_history_${window.userAddress}`);
  if (saved) {
    window.callHistory = JSON.parse(saved);
  }
}

function saveCallHistory() {
  if (!window.userAddress) return;
  localStorage.setItem(`soulmine_call_history_${window.userAddress}`, JSON.stringify(window.callHistory));
  if (window.callHistory.length % 5 === 0) {
    saveToTonStorage(window.callHistory, `call_history_${window.userAddress}.json`);
  }
}

function renderCallHistory() {
  const container = document.getElementById('call-history-list');
  if (!container) return;
  container.innerHTML = '';
  if (window.callHistory.length === 0) {
    container.innerHTML = '<p>История пуста</p>';
    return;
  }
  window.callHistory.slice().reverse().forEach(call => {
    const div = document.createElement('div');
    div.className = 'call-record';
    div.innerHTML = `
      <p><strong>Собеседник:</strong> ${call.partner.slice(0, 6)}...${call.partner.slice(-4)}</p>
      <p><strong>Длительность:</strong> ${call.duration} мин</p>
      <p><strong>Совместимость:</strong> ${call.compatibility.toFixed(1)}%</p>
      <p><strong>Заработано:</strong> ${call.earnedLove.toFixed(2)} $LOVE</p>
      <p><strong>Дата:</strong> ${new Date(call.startTime).toLocaleString()}</p>
      <hr>
    `;
    container.appendChild(div);
  });
}

window.checkCoupleNFTs = checkCoupleNFTs;
window.loadCallHistory = loadCallHistory;
window.saveCallHistory = saveCallHistory;
window.renderCallHistory = renderCallHistory;