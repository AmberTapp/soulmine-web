import { appState, CONFIG, updateQuestProgress, checkHasNFT, checkSentTransaction, showViralToast, unlockAchievement } from './utils.js';

// ========================
// 🌐 ИНИЦИАЛИЗАЦИЯ TONCONNECT
// ========================

const connector = new window.TonConnect.UI.Connector({
  manifestUrl: CONFIG.TON_MANIFEST_URL, // ✅ Проверено: нет пробелов, HTTPS, валидный JSON
  buttonRootId: 'ton-connect-button-container'
});

// ✅ Настраиваем UI для Telegram Web App — ВАЖНО: returnUrl должен быть ЧИСТЫМ
connector.uiOptions = {
  twaReturnUrl: 'https://t.me/LoveSoulMine_Bot' // ✅ ИСПРАВЛЕНО: УБРАНЫ ВСЕ ПРОБЕЛЫ
};

appState.connector = connector;
window.connector = connector;

// ========================
// 🎯 UI ЭЛЕМЕНТЫ
// ========================

const walletInfo = document.getElementById('wallet-info');
const profileBalance = document.getElementById('profile-balance');

// ========================
// 🔄 ОБНОВЛЕНИЕ СОСТОЯНИЯ ПОДКЛЮЧЕНИЯ
// ========================

async function updateConnectionState() {
  if (connector.connected && connector.wallet?.account?.address) {
    const address = connector.wallet.account.address.toLowerCase(); // ✅ Приводим к нижнему регистру для сравнения
    appState.userAddress = address;

    // ✅ UI: отображаем адрес
    walletInfo.style.display = 'block';
    walletInfo.innerHTML = `<strong>Адрес:</strong> ${address.slice(0, 8)}...${address.slice(-6)}`;

    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) addressDisplay.textContent = `${address.slice(0, 8)}...${address.slice(-6)}`;

    // ✅ Получаем баланс $LOVE
    const balanceStr = await getLoveBalance(address);
    const balanceNum = parseFloat(balanceStr.replace('—', '0').replace(/,/g, '')) || 0;
    appState.cache.loveBalance = balanceNum;
    profileBalance.textContent = `${balanceStr} $LOVE`;

    // ✅ Автоматические квесты
    updateQuestProgress("connect_wallet");

    // 🔍 Проверяем транзакции и NFT через 1 сек — для избежания race condition
    setTimeout(() => {
      checkSentTransaction(address);
      checkHasNFT(address);
    }, 1000);

    // 📡 Сигналинг (если реализован)
    if (typeof connectToSignalingServer === 'function') {
      connectToSignalingServer();
    }

    // ✅ Отправляем данные в Telegram WebApp
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: "wallet_connected",
        address: address,
        balance: balanceNum,
        timestamp: Date.now()
      }));
    }

    // 🔥 Ритуал посвящения — только при первом подключении
    const isFirstLoginKey = `soulmine_first_login_${address}`;
    if (!localStorage.getItem(isFirstLoginKey)) {
      localStorage.setItem(isFirstLoginKey, '1');

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
            <button onclick="
              document.body.removeChild(this.parentElement.parentElement);
              showLove(50);
              unlockAchievement('apostle', 'Апостол Любви', 'Первый шаг во Вселенной SoulMine', '💜');
            " class="btn btn-primary" style="
              width: 100%; padding: 14px; border: none; border-radius: 10px;
              background: linear-gradient(135deg, #00D1B2, #00F0E9); color: #000; font-weight: bold;
              font-size: 16px; cursor: pointer;
            ">✨ Принять посвящение</button>
          </div>
        `;
        document.body.appendChild(ritualModal);

        // ✅ Автоматически закрываем через 15 сек, если не нажали
        setTimeout(() => {
          if (ritualModal.parentElement) ritualModal.parentElement.remove();
        }, 15000);
      }, 3000);

      // ✅ Отправляем событие в бота для аналитики
      if (window.Telegram?.WebApp?.sendData) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: "first_login",
          address: address,
          source: "tonconnect"
        }));
      }
    }

    // 🚀 ВИРУСНЫЙ ТРИГГЕР: ссылка для рефералов
    setTimeout(() => {
      // ✅ КРИТИЧНО: Используем encodeURIComponent для безопасного URL
      const refLink = `https://t.me/LoveSoulMine_Bot?start=ref_${encodeURIComponent(address)}`;
      const shareText = `Я присоединился к SoulMine — Вселенной Любви на TON! 💜\nПолучил 50 $LOVE за регистрацию!\nПрисоединяйся → ${refLink}`;

      // ✅ Проверка: не пытаемся копировать в не поддерживаемых средах
      navigator.clipboard.writeText(shareText)
        .then(() => {
          showViralToast("💌 Ссылка для друзей скопирована! Пригласите 3 человек — получите NFT 'Амбассадор Любви'!");
        })
        .catch(err => {
          console.error("❌ Не удалось скопировать в буфер:", err);
          showViralToast("❌ Не удалось скопировать ссылку. Откройте меню → «Поделиться»");
        });

      // ✅ Дополнительно: открываем ссылку в Telegram, если в TWA
      if (window.Telegram?.WebApp?.openLink) {
        setTimeout(() => {
          window.Telegram.WebApp.openLink(refLink);
        }, 2000);
      }
    }, 10000);

  } else {
    // ✅ Сброс состояния при отключении кошелька
    appState.userAddress = null;
    walletInfo.style.display = 'none';
    profileBalance.textContent = "Загрузка...";

    // ✅ Очищаем NFT-контейнеры
    const nftContainer = document.getElementById('nft-container');
    if (nftContainer) nftContainer.innerHTML = '<div class="nft-empty">Подключите кошелёк</div>';

    const coupleNftSection = document.getElementById('couple-nft-section');
    if (coupleNftSection) coupleNftSection.style.display = 'none';

    // ✅ Очищаем кэш, если кошелёк отключён
    appState.cache.loveBalance = null;
    appState.cache.nfts = [];
  }
}

// ✅ Подписываемся на изменения состояния
connector.onStatusChange(updateConnectionState);

// ========================
// 💰 РАБОТА С JETTON ($LOVE)
// ========================

/**
 * Получает баланс $LOVE через TonAPI
 * @param {string} address — адрес пользователя
 * @returns {Promise<string>} — баланс в формате "123.4567"
 */
async function getLoveBalance(address) {
  if (!address || typeof address !== 'string') return "0.0000";

  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SoulMineBot/1.0 (WebApp)'
      },
      cache: 'no-store' // ✅ Не кэшируем, чтобы не было stale данных
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const balances = Array.isArray(data.balances) ? data.balances : [];

    for (const jetton of balances) {
      const jettonAddress = jetton.jetton?.address?.toLowerCase();
      if (jettonAddress === CONFIG.JETTON_MASTER_ADDRESS.toLowerCase()) {
        const amount = BigInt(jetton.balance || "0");
        const decimals = jetton.jetton?.decimals ?? 9; // ✅ Безопасное значение по умолчанию
        const balance = Number(amount) / (10 ** decimals);
        return balance.toFixed(4);
      }
    }

    return "0.0000"; // ✅ Явно возвращаем ноль, если не найдено
  } catch (error) {
    console.error("❌ Ошибка получения баланса $LOVE:", error.message || error);
    return "—"; // ✅ Возвращаем читаемый дефолт
  }
}

/**
 * Возвращает баланс в виде числа (для логики)
 * @param {string} address
 * @returns {number}
 */
async function getLoveBalanceRaw(address) {
  const balanceStr = await getLoveBalance(address);
  return parseFloat(balanceStr.replace('—', '0').replace(/,/g, '')) || 0;
}

// ========================
// 🖼️ ЗАГРУЗКА NFT
// ========================

/**
 * Загружает NFT пользователя через TonAPI
 * @param {string} address — адрес пользователя
 */
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
      // ✅ Безопасное получение изображения
      const preview = nft.previews?.find(p => p.resolution === '100x100') || nft.previews?.[0];
      const imageUrl = preview?.url || 'https://via.placeholder.com/100'; // ✅ Чистый URL без пробелов
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
    console.error("❌ Ошибка загрузки NFT:", error.message || error);
    container.innerHTML = '<div class="nft-empty">Ошибка загрузки NFT</div>';
  }
}

// ========================
// 🔍 АВТОМАТИЧЕСКАЯ ПРОВЕРКА КВЕСТОВ
// ========================

/**
 * Проверяет, была ли отправлена хотя бы одна транзакция
 * @param {string} address
 */
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
        action.type === "TonTransfer" && 
        action.sender?.address?.toLowerCase() === address.toLowerCase()
      )
    );

    if (hasOutgoing) {
      updateQuestProgress("send_first_transaction");
    }

  } catch (e) {
    console.warn("⚠️ Не удалось проверить транзакции:", e.message);
  }
}

/**
 * Проверяет наличие NFT в коллекциях
 * @param {string} address
 */
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

    // ✅ Только NFT из реальных коллекций (не мусорные)
    const realNFTs = nfts.filter(nft => nft.collection && nft.collection.address);

    if (realNFTs.length > 0) {
      updateQuestProgress("buy_nft");
    }

  } catch (e) {
    console.warn("⚠️ Не удалось проверить NFT:", e.message);
  }
}

// ========================
// 📤 ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ========================

window.getLoveBalance = getLoveBalance;
window.getLoveBalanceRaw = getLoveBalanceRaw;
window.loadNFTs = loadNFTs;

// ✅ ДОПОЛНИТЕЛЬНО: ЭКСПОРТ ДЛЯ ТЕСТОВ И ДЕБАГА
if (window.DEBUG) {
  window.connector = connector;
  window.updateConnectionState = updateConnectionState;
}