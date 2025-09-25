// ton.js — Интеграция TON + Telegram Web App (Production-Ready)

import { appState, CONFIG, updateQuestProgress, checkHasNFT, checkSentTransaction, showViralToast, unlockAchievement } from './utils.js';

// ========================
// 🌐 ИНИЦИАЛИЗАЦИЯ TONCONNECT
// ========================

let connector;
try {
  connector = new window.TonConnect.UI.Connector({
    manifestUrl: CONFIG.TON_MANIFEST_URL,
    buttonRootId: 'ton-connect-button-container'
  });

  // Настраиваем UI для Telegram Web App — чистый URL без пробелов
  connector.uiOptions = {
    twaReturnUrl: 'https://t.me/LoveSoulMine_Bot'
  };
} catch (error) {
  console.error('❌ Ошибка инициализации TonConnect:', error);
}

appState.connector = connector;
window.connector = connector; // Экспорт для глобального доступа (если нужно)

// ========================
// 🎯 UI ЭЛЕМЕНТЫ
// ========================

const walletInfo = document.getElementById('wallet-info');
const profileBalance = document.getElementById('profile-balance');

// ========================
// 🔄 ОБНОВЛЕНИЕ СОСТОЯНИЯ ПОДКЛЮЧЕНИЯ
// ========================

async function updateConnectionState() {
  if (!connector) return;

  if (connector.connected && connector.wallet?.account?.address) {
    const address = connector.wallet.account.address.toLowerCase();
    appState.userAddress = address;

    if (walletInfo) {
      walletInfo.style.display = 'block';
      walletInfo.innerHTML = `<strong>Адрес:</strong> ${address.slice(0, 8)}...${address.slice(-6)}`;
    }

    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) {
      addressDisplay.textContent = `${address.slice(0, 8)}...${address.slice(-6)}`;
    }

    try {
      const balanceStr = await getLoveBalance(address);
      const balanceNum = parseFloat(balanceStr.replace(/,/g, '')) || 0;
      appState.cache.loveBalance = balanceNum;
      if (profileBalance) profileBalance.textContent = `${balanceStr} $LOVE`;
    } catch (error) {
      console.error('❌ Ошибка обновления баланса:', error);
      if (profileBalance) profileBalance.textContent = '— $LOVE';
    }

    updateQuestProgress('connect_wallet');

    // Отложенные проверки
    setTimeout(() => {
      checkSentTransaction(address);
      checkHasNFT(address);
    }, 1000);

    // Подключение к сигнализации, если функция доступна
    if (typeof connectToSignalingServer === 'function') {
      connectToSignalingServer();
    }

    // Отправка данных в Telegram Web App
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: 'wallet_connected',
        address,
        balance: appState.cache.loveBalance,
        timestamp: Date.now()
      }));
    }

    // Логика первого логина
    const isFirstLoginKey = `soulmine_first_login_${address}`;
    if (!localStorage.getItem(isFirstLoginKey)) {
      localStorage.setItem(isFirstLoginKey, '1');
      handleFirstLogin(address);
    }

    // Генерация и обработка реферальной ссылки
    setTimeout(() => handleReferralLink(address), 10000);
  } else {
    resetDisconnectedState();
  }
}

function handleFirstLogin(address) {
  // Создание модалки ритуала
  setTimeout(() => {
    const ritualModal = document.createElement('div');
    ritualModal.className = 'modal';
    ritualModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
      z-index: 10001; font-family: system-ui, sans-serif;
    `;
    ritualModal.innerHTML = `
      <div class="modal-content" style="
        background: linear-gradient(135deg, #0a0a2a, #1a1a4a);
        color: #fff; padding: 30px; border-radius: 16px; text-align: center;
        max-width: 90%; box-shadow: 0 12px 40px rgba(0, 209, 178, 0.4);
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">💜</div>
        <h2 style="color: #00D1B2; margin-bottom: 15px;">Добро пожаловать, Апостол Любви!</h2>
        <p style="margin-bottom: 25px;">Ты сделал первый шаг во Вселенной SoulMine.</p>
        <div style="background: rgba(0, 209, 178, 0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
          <p><strong>🎁 Твой дар:</strong></p>
          <p>+50 $LOVE</p>
          <p>NFT: "Апостол Любви"</p>
        </div>
        <button class="btn btn-primary" style="
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #00D1B2, #00F0E9); color: #000; font-weight: bold;
          font-size: 16px; cursor: pointer;
        ">✨ Принять посвящение</button>
      </div>
    `;
    document.body.appendChild(ritualModal);

    // Обработчик кнопки (без inline onclick)
    const button = ritualModal.querySelector('button');
    button.addEventListener('click', () => {
      document.body.removeChild(ritualModal);
      showLove(50); // Здесь должна быть реальная транзакция в продакшене
      unlockAchievement('apostle', 'Апостол Любви', 'Первый шаг во Вселенной SoulMine', '💜');
    });

    // Автозакрытие через 15 сек
    setTimeout(() => {
      if (ritualModal.parentElement) ritualModal.parentElement.remove();
    }, 15000);
  }, 3000);

  // Отправка события в Telegram
  if (window.Telegram?.WebApp?.sendData) {
    window.Telegram.WebApp.sendData(JSON.stringify({
      type: 'first_login',
      address,
      source: 'tonconnect'
    }));
  }
}

function handleReferralLink(address) {
  const refLink = `https://t.me/LoveSoulMine_Bot?start=ref_${encodeURIComponent(address)}`;
  const shareText = `Я присоединился к SoulMine — Вселенной Любви на TON! 💜\nПолучил 50 $LOVE за регистрацию!\nПрисоединяйся → ${refLink}`;

  navigator.clipboard.writeText(shareText)
    .then(() => {
      showViralToast('💌 Ссылка для друзей скопирована! Пригласите 3 человек — получите NFT "Амбассадор Любви"!');
    })
    .catch(err => {
      console.error('❌ Не удалось скопировать в буфер:', err);
      showViralToast('❌ Не удалось скопировать ссылку. Откройте меню → «Поделиться»');
    });

  if (window.Telegram?.WebApp?.openLink) {
    setTimeout(() => {
      window.Telegram.WebApp.openLink(refLink);
    }, 2000);
  }
}

function resetDisconnectedState() {
  appState.userAddress = null;
  if (walletInfo) walletInfo.style.display = 'none';
  if (profileBalance) profileBalance.textContent = 'Загрузка...';

  const nftContainer = document.getElementById('nft-container');
  if (nftContainer) nftContainer.innerHTML = '<div class="nft-empty">Подключите кошелёк</div>';

  const coupleNftSection = document.getElementById('couple-nft-section');
  if (coupleNftSection) coupleNftSection.style.display = 'none';

  appState.cache.loveBalance = null;
  appState.cache.nfts = [];
}

connector.onStatusChange(updateConnectionState);

// ========================
// 💰 РАБОТА С JETTON ($LOVE)
// ========================

async function getLoveBalance(address) {
  if (!address || typeof address !== 'string') return '0.0000';

  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SoulMineBot/1.0 (WebApp)'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const balances = Array.isArray(data.balances) ? data.balances : [];

    const jetton = balances.find(j => j.jetton?.address?.toLowerCase() === CONFIG.JETTON_MASTER_ADDRESS.toLowerCase());
    if (!jetton) return '0.0000';

    const amount = BigInt(jetton.balance || '0');
    const decimals = jetton.jetton?.decimals ?? 9;
    const balance = Number(amount) / (10 ** decimals);
    return balance.toFixed(4);
  } catch (error) {
    console.error('❌ Ошибка получения баланса $LOVE:', error);
    return '—';
  }
}

async function getLoveBalanceRaw(address) {
  const balanceStr = await getLoveBalance(address);
  return parseFloat(balanceStr.replace('—', '0').replace(/,/g, '')) || 0;
}

// ========================
// 🖼️ ЗАГРУЗКА NFT
// ========================

async function loadNFTs(address) {
  if (!address) return;

  const container = document.getElementById('nft-container-profile') || document.getElementById('nft-container');
  if (!container) return;

  container.innerHTML = '<div class="nft-empty">Загрузка NFT...</div>';

  try {
    const response = await fetch(`https://tonapi.io/v2/nfts?account=${address}&limit=50`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SoulMineBot/1.0 (WebApp)'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const nfts = Array.isArray(data.nft_items) ? data.nft_items : [];

    if (nfts.length === 0) {
      container.innerHTML = '<div class="nft-empty">У вас пока нет NFT</div>';
      appState.cache.nfts = [];
      return;
    }

    container.innerHTML = '';
    appState.cache.nfts = nfts;

    nfts.forEach(nft => {
      const preview = nft.previews?.find(p => p.resolution === '100x100') || nft.previews?.[0];
      const imageUrl = preview?.url || 'https://via.placeholder.com/100';
      const name = nft.metadata?.name || 'Без имени';
      const collection = nft.collection?.name || 'Неизвестная коллекция';

      const div = document.createElement('div');
      div.className = 'nft-item';
      div.innerHTML = `
        <img 
          src="${imageUrl}" 
          class="nft-img" 
          alt="${name} — ${collection}" 
          onerror="this.src='https://via.placeholder.com/100'; this.onerror=null;"
        >
        <div class="nft-overlay">${name}</div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки NFT:', error);
    container.innerHTML = '<div class="nft-empty">Ошибка загрузки NFT</div>';
  }
}

// ========================
// 🔍 АВТОМАТИЧЕСКАЯ ПРОВЕРКА КВЕСТОВ
// ========================

async function checkSentTransaction(address) {
  if (!address) return;

  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/events?limit=10`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];

    const hasOutgoing = events.some(event => 
      Array.isArray(event.actions) && 
      event.actions.some(action => 
        action.type === 'TonTransfer' && 
        action.sender?.address?.toLowerCase() === address.toLowerCase()
      )
    );

    if (hasOutgoing) {
      updateQuestProgress('send_first_transaction');
    }
  } catch (error) {
    console.warn('⚠️ Не удалось проверить транзакции:', error);
  }
}

async function checkHasNFT(address) {
  if (!address) return;

  try {
    const response = await fetch(`https://tonapi.io/v2/nfts?account=${address}&limit=50`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const nfts = Array.isArray(data.nft_items) ? data.nft_items : [];

    const realNFTs = nfts.filter(nft => nft.collection && nft.collection.address);

    if (realNFTs.length > 0) {
      updateQuestProgress('buy_nft');
    }
  } catch (error) {
    console.warn('⚠️ Не удалось проверить NFT:', error);
  }
}

// ========================
// 📤 ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ========================

window.getLoveBalance = getLoveBalance;
window.getLoveBalanceRaw = getLoveBalanceRaw;
window.loadNFTs = loadNFTs;

if (window.DEBUG) {
  window.connector = connector;
  window.updateConnectionState = updateConnectionState;
}