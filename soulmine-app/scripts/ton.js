// ton.js — интеграция с TON + поддержка Telegram Web Apps

import { appState, CONFIG, updateQuestProgress, checkHasNFT, checkSentTransaction, showViralToast, unlockAchievement } from './utils.js';

// Инициализация TonConnect UI с поддержкой TWA
const connector = new window.TonConnect.UI.Connector({
  manifestUrl: CONFIG.TON_MANIFEST_URL,
  // Указываем ID элемента, куда встроить кнопку
  buttonRootId: 'ton-connect-button-container'
});

// Настраиваем опции UI для Telegram Web App
connector.uiOptions = {
  twaReturnUrl: 'https://t.me/LoveSoulMine_Bot' // ✅ УБРАЛ ЛИШНИЕ ПРОБЕЛЫ
};

appState.connector = connector;
window.connector = connector;

// ========================
// Остальной код без изменений (ниже — полная версия)
// ========================

// UI элементы (теперь используем container, а не кнопку)
const walletInfo = document.getElementById('wallet-info');
const profileBalance = document.getElementById('profile-balance');

async function updateConnectionState() {
  if (connector.connected && connector.wallet?.account?.address) {
    const address = connector.wallet.account.address;
    appState.userAddress = address;

    // UI
    // Кнопка теперь управляется TonConnect UI — не нужно менять текст вручную
    walletInfo.style.display = 'block';
    walletInfo.innerHTML = `<strong>Адрес:</strong> ${address.slice(0, 8)}...${address.slice(-6)}`;

    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) addressDisplay.textContent = `${address.slice(0, 8)}...${address.slice(-6)}`;

    // Баланс
    const balance = await getLoveBalance(address);
    profileBalance.textContent = `${balance} $LOVE`;
    appState.cache.loveBalance = parseFloat(balance.replace(/,/g, '').replace('—', '0'));

    // Автоматические квесты
    updateQuestProgress("connect_wallet");
    setTimeout(() => {
      checkSentTransaction(address);
      checkHasNFT(address);
    }, 1000);

    // Сигналинг (если реализован)
    if (typeof connectToSignalingServer === 'function') {
      connectToSignalingServer();
    }

    // Telegram WebApp
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: "wallet_connected",
        address: address,
        balance: appState.cache.loveBalance
      }));
    }

    // 🔥 Ритуал посвящения (только при первом подключении)
    const isFirstTime = !localStorage.getItem(`soulmine_first_login_${address}`);
    if (isFirstTime) {
      localStorage.setItem(`soulmine_first_login_${address}`, '1');
      
      setTimeout(() => {
        const ritualModal = document.createElement('div');
        ritualModal.className = 'modal';
        ritualModal.style.display = 'flex';
        ritualModal.innerHTML = `
          <div class="modal-content" style="text-align: center; background: linear-gradient(135deg, #0a0a2a, #1a1a4a);">
            <div style="font-size: 3rem; margin-bottom: 20px;">💜</div>
            <h2 style="color: #00D1B2; margin-bottom: 20px;">Добро пожаловать, Апостол Любви!</h2>
            <p>Ты сделал первый шаг во Вселенной SoulMine.</p>
            <div style="background: rgba(0, 209, 178, 0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
              <p><strong>🎁 Твой дар:</strong></p>
              <p>+50 $LOVE</p>
              <p>NFT: "Апостол Любви"</p>
            </div>
            <button onclick="document.body.removeChild(this.parentElement.parentElement); 
              showLove(50); 
              unlockAchievement('apostle', 'Апостол Любви', 'Первый шаг во Вселенной SoulMine', '💜');
              " class="btn btn-primary" style="width: 100%;">✨ Принять посвящение</button>
          </div>
        `;
        document.body.appendChild(ritualModal);
      }, 3000);

      // Отправляем данные в бота
      if (window.Telegram?.WebApp?.sendData) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: "first_login",
          address: address
        }));
      }
    }

    // 🚀 Вирусный триггер: через 10 сек предложи пригласить друзей
    setTimeout(() => {
      const shareText = `Я присоединился к SoulMine — Вселенной Любви на TON! 💜\nПолучил 50 $LOVE за регистрацию!\nПрисоединяйся → https://t.me/LoveSoulMine_Bot?start=ref_${encodeURIComponent(address)}`;
      navigator.clipboard.writeText(shareText);
      showViralToast("💌 Ссылка для друзей скопирована! Пригласите 3 человек — получите NFT 'Амбассадор Любви'!");
    }, 10000);

  } else {
    appState.userAddress = null;
    walletInfo.style.display = 'none';
    profileBalance.textContent = "Загрузка...";
    const nftContainer = document.getElementById('nft-container');
    if (nftContainer) nftContainer.innerHTML = '<div class="nft-empty">Подключите кошелёк</div>';
    const coupleNftSection = document.getElementById('couple-nft-section');
    if (coupleNftSection) coupleNftSection.style.display = 'none';
  }
}

connector.onStatusChange(updateConnectionState);

// ========================
// 💰 Работа с Jetton ($LOVE)
// ========================
async function getLoveBalance(address) {
  if (!address) return "0.0000";
  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const balances = data.balances || [];
    for (const jet of balances) {
      if (jet.jetton?.address?.toLowerCase() === CONFIG.JETTON_MASTER_ADDRESS.toLowerCase()) {
        const amount = BigInt(jet.balance || "0");
        const decimals = jet.jetton.decimals || 9;
        return (Number(amount) / (10 ** decimals)).toFixed(4);
      }
    }
    return "0.0000";
  } catch (error) {
    console.error("Ошибка получения баланса $LOVE:", error);
    return "—";
  }
}

async function getLoveBalanceRaw(address) {
  const balanceStr = await getLoveBalance(address);
  return parseFloat(balanceStr.replace('—', '0').replace(/,/g, '')) || 0;
}

// ========================
// 🖼️ Загрузка NFT
// ========================
async function loadNFTs(address) {
  const container = document.getElementById('nft-container-profile') || document.getElementById('nft-container');
  if (!container) return;
  container.innerHTML = '<div class="nft-empty">Загрузка NFT...</div>';
  try {
    const response = await fetch(`https://tonapi.io/v2/nfts?account=${address}&limit=50`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const nfts = data.nft_items || [];
    if (nfts.length === 0) {
      container.innerHTML = '<div class="nft-empty">У вас пока нет NFT</div>';
      return;
    }
    container.innerHTML = '';
    nfts.forEach(nft => {
      const preview = nft.previews?.find(p => p.resolution === '100x100') || nft.previews?.[0];
      const image = preview?.url || 'https://via.placeholder.com/100';
      const name = nft.metadata?.name || 'Без имени';
      const div = document.createElement('div');
      div.className = 'nft-item';
      div.innerHTML = `
        <img src="${image}" class="nft-img" alt="${name}" onerror="this.src='https://via.placeholder.com/100'">
        <div class="nft-overlay">${name}</div>
      `;
      container.appendChild(div);
    });
    appState.cache.nfts = nfts;
  } catch (error) {
    container.innerHTML = '<div class="nft-empty">Ошибка загрузки NFT</div>';
    console.error("Ошибка загрузки NFT:", error);
  }
}

// ========================
// 🔍 Автоматическая проверка квестов
// ========================
async function checkSentTransaction(address) {
  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/events?limit=10`);
    const data = await response.json();
    const hasOutgoing = data.events?.some(event => 
      event.actions?.some(action => 
        action.type === "TonTransfer" && action.sender?.address === address
      )
    );
    if (hasOutgoing) updateQuestProgress("send_first_transaction");
  } catch (e) {
    console.error("Ошибка проверки транзакций:", e);
  }
}

async function checkHasNFT(address) {
  try {
    const response = await fetch(`https://tonapi.io/v2/nfts?account=${address}&limit=50`);
    const data = await response.json();
    const realNFTs = data.nft_items?.filter(nft => nft.collection);
    if (realNFTs?.length > 0) updateQuestProgress("buy_nft");
  } catch (e) {
    console.error("Ошибка проверки NFT:", e);
  }
}

// Экспорт
window.getLoveBalance = getLoveBalance;
window.getLoveBalanceRaw = getLoveBalanceRaw;
window.loadNFTs = loadNFTs;