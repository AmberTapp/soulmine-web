import { appState, CONFIG, loadQuests, loadCallHistory, showScreen, showPartnerPreview, unlockAchievement, showViralToast } from './utils.js';

/**
 * Инициализация Telegram WebApp — первый шаг в движении
 */
function initTelegramWebApp() {
  if (!window.Telegram?.WebApp) {
    console.warn('Telegram WebApp не обнаружен');
    return;
  }

  const webApp = window.Telegram.WebApp;
  webApp.ready();
  webApp.expand();

  // Тема — цвета вселенной SoulMine
  webApp.setBackgroundColor('#0f0f33');
  webApp.setHeaderColor('#00005B');

  // Данные пользователя
  const user = webApp.initDataUnsafe?.user;
  if (user) {
    console.log('👤 Пользователь Telegram:', user);
    localStorage.setItem('telegram_user_id', user.id);
    
    // Отправляем в бота для связки TON + Telegram ID
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: "telegram_user",
        telegram_id: user.id,
        first_name: user.first_name,
        username: user.username
      }));
    }
  }

  // Показываем главный экран — начало путешествия
  showScreen('main-screen');
}

/**
 * Инициализация приложения — космический старт
 */
window.addEventListener('load', async () => {
  const splashScreen = document.getElementById('splash-screen');

  try {
    // Имитация загрузки вселенной
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }

    // 🚀 Инициализация Telegram
    initTelegramWebApp();

    // 📚 Загрузка данных
    loadQuests();
    loadCallHistory();
    
    // 🔮 Показываем AI-превью партнера
    setTimeout(showPartnerPreview, 1000);

    // 🌌 Через 5 секунд — показываем "вселенский" баннер
    setTimeout(() => {
      const banner = document.querySelector('.movement-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.style.animation = 'fadeInUp 1s ease-out';
      }
    }, 5000);

    // 💫 Через 8 секунд — показываем CTA для первого действия
    setTimeout(() => {
      const cosmicToast = document.createElement('div');
      cosmicToast.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 42, 0.95); color: #00D1B2; padding: 25px; border-radius: 20px;
        z-index: 9999; text-align: center; max-width: 90%; border: 2px solid #00D1B2;
        box-shadow: 0 0 30px rgba(0, 209, 178, 0.5); animation: fadeInUp 0.5s ease-out;
      `;
      cosmicToast.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 1.5rem;">🌌 Твоя Вселенная Любви ждёт</h3>
        <p>Соверши первый звонок — получи 100 $LOVE + NFT Гражданина!</p>
        <button onclick="this.parentElement.remove(); findRandomPartner();" style="margin-top: 20px; padding: 12px 24px; background: #00D1B2; color: #00005B; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">💫 Найти свою AI-совместимость</button>
      `;
      document.body.appendChild(cosmicToast);
    }, 8000);

    // 🎁 Через 15 секунд — напоминаем о реферальной программе
    setTimeout(() => {
      if (!appState.userAddress) return;
      const shareText = `Я в SoulMine — Вселенной Любви на TON! 💜\nПрисоединяйся по моей ссылке и получим по 50 $LOVE!\nhttps://t.me/LoveSoulMine_Bot?start=ref_${encodeURIComponent(appState.userAddress)}`;
      showViralToast("💌 Пригласите 3 друзей — получите NFT 'Амбассадор Любви'!");
    }, 15000);

  } catch (error) {
    console.error('❌ Ошибка при инициализации:', error);
    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }
  }
});

/**
 * Заглушки для неопределённых функций
 */
function loadCitizenNFT() { console.log('loadCitizenNFT not implemented'); }
function loadProposals() { console.log('loadProposals not implemented'); }

/**
 * Дебаг-кнопка (опционально)
 */
window.checkAllQuests = function() {
  if (!appState.userAddress) return alert("Подключите кошелёк!");
  if (typeof checkSentTransaction === 'function') checkSentTransaction(appState.userAddress);
  if (typeof checkHasNFT === 'function') checkHasNFT(appState.userAddress);
  alert("Проверка завершена!");
};

/**
 * Экспорт для совместимости
 */
window.initTelegramWebApp = initTelegramWebApp;