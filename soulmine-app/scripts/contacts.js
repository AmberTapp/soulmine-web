// contacts.js — не просто контакты, а рекрутинг апостолов движения #LoveOnTON

import { appState } from './utils.js';

/**
 * Загружает контакты из Telegram WebApp — первый шаг к рекрутингу апостолов
 */
async function loadTelegramContacts() {
  if (!window.Telegram?.WebApp) {
    console.warn('Telegram WebApp не доступен');
    showViralToast("📱 Откройте SoulMine через Telegram для доступа к контактам!");
    return;
  }

  const webApp = window.Telegram.WebApp;
  
  // Показываем красивый запрос на доступ
  webApp.showPopup({
    title: "Найдите друзей в SoulMine 💜",
    message: "Разрешите доступ к контактам, чтобы найти друзей, которые уже в нашей вселенной!",
    buttons: [
      { type: "ok", text: "Разрешить" },
      { type: "cancel", text: "Позже" }
    ]
  }, (buttonId) => {
    if (buttonId === "ok") {
      // Отправляем запрос боту
      if (webApp.sendData) {
        webApp.sendData(JSON.stringify({
          type: "request_contacts",
          address: appState.userAddress
        }));
        showViralToast("📨 Запрос отправлен боту. Ожидайте ответа...");
      } else {
        // Fallback: имитация
        setTimeout(() => {
          mockLoadContacts();
        }, 1500);
      }
    }
  });
}

/**
 * Имитация загрузки контактов (в реальности — ответ от бота)
 */
function mockLoadContacts() {
  const mockContacts = [
    { 
      name: "Анна", 
      telegram_id: 123456789, 
      ton_address: "EQAbc...def", 
      is_on_soulmine: true,
      last_active: "сегодня"
    },
    { 
      name: "Марк", 
      telegram_id: 987654321, 
      ton_address: null, 
      is_on_soulmine: false,
      last_active: null
    },
    { 
      name: "Лиза", 
      telegram_id: 456789123, 
      ton_address: "EQGhi...jkl", 
      is_on_soulmine: true,
      last_active: "3 дня назад"
    },
    { 
      name: "Дмитрий", 
      telegram_id: 321654987, 
      ton_address: null, 
      is_on_soulmine: false,
      last_active: null
    }
  ];

  appState.contacts.telegram = mockContacts;
  renderContacts();
  unlockAchievement('contacts_loaded', 'Социальный Гуру', 'Загрузили контакты из Telegram!', '👥');
}

/**
 * Загружает пользователей SoulMine по списку адресов
 */
async function loadTONContacts(addresses) {
  if (!addresses?.length) return;

  try {
    const promises = addresses.map(addr => 
      fetch(`https://tonapi.io/v2/accounts/${addr}`)
        .then(r => r.json())
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    appState.contacts.ton = results
      .filter(acc => acc && acc.name)
      .map(acc => ({
        name: acc.name || `User ${acc.address.slice(-4)}`,
        ton_address: acc.address,
        profile_image: acc.profile_image,
        last_active: new Date().toLocaleDateString('ru-RU')
      }));

    renderContacts();
  } catch (e) {
    console.error('Ошибка загрузки TON контактов:', e);
  }
}

/**
 * Рендерит контакты в UI — твоя сеть апостолов любви
 */
function renderContacts() {
  const container = document.getElementById('contacts-list');
  if (!container) return;

  container.innerHTML = '';

  // Показываем сначала тех, кто уже в SoulMine
  const soulmineUsers = [
    ...appState.contacts.telegram.filter(c => c.is_on_soulmine && c.ton_address),
    ...appState.contacts.ton
  ];

  if (soulmineUsers.length === 0) {
    container.innerHTML = `
      <div class="nft-empty">
        <p>Нет друзей в SoulMine 😔</p>
        <p>Пригласите друзей — станьте первопроходцем!</p>
        <button onclick="inviteAllFriends()" class="btn btn-primary" style="margin-top: 20px; width: 100%;">
          💌 Пригласить всех друзей
        </button>
      </div>
    `;
    return;
  }

  // Заголовок для активных пользователей
  const activeHeader = document.createElement('h3');
  activeHeader.textContent = "Активные в SoulMine";
  activeHeader.style.cssText = "margin: 20px 0 10px 0; color: #00d1b2; border-bottom: 1px solid rgba(0, 209, 178, 0.3); padding-bottom: 5px;";
  container.appendChild(activeHeader);

  soulmineUsers.forEach(user => {
    const div = document.createElement('div');
    div.className = 'contact-item';
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <img src="${user.profile_image || './assets/logo.png'}" class="contact-avatar" onerror="this.src='./assets/logo.png'">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0; color: white;">${user.name}</h4>
          <p style="font-size: 0.8rem; opacity: 0.7; margin: 0;">${user.ton_address?.slice(0, 6)}...${user.ton_address?.slice(-4)}</p>
          ${user.last_active ? `<p style="font-size: 0.7rem; color: #00d1b2; margin: 5px 0 0 0;">Активен: ${user.last_active}</p>` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 8px; min-width: max-content;">
        <button onclick="startChatWith('${user.ton_address}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">💬</button>
        <button onclick="startCallWith('${user.ton_address}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">📞</button>
      </div>
    `;
    container.appendChild(div);
  });

  // Показываем тех, кого можно пригласить
  const inviteUsers = appState.contacts.telegram.filter(c => !c.is_on_soulmine);
  if (inviteUsers.length > 0) {
    const inviteHeader = document.createElement('h3');
    inviteHeader.textContent = "Пригласите в SoulMine";
    inviteHeader.style.cssText = "margin: 30px 0 10px 0; color: #ffcc00; border-bottom: 1px solid rgba(255, 204, 0, 0.3); padding-bottom: 5px;";
    container.appendChild(inviteHeader);

    inviteUsers.forEach(user => {
      const div = document.createElement('div');
      div.className = 'contact-item';
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #00d1b2, #00a8cc); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00005B; font-weight: bold; font-size: 1.2rem;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: white;">${user.name}</h4>
            <p style="font-size: 0.8rem; color: #ffcc00; margin: 0;">Не в SoulMine</p>
          </div>
        </div>
        <button onclick="inviteUser(${user.telegram_id}, '${user.name}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">➕ Пригласить</button>
      `;
      container.appendChild(div);
    });

    // Кнопка "Пригласить всех"
    const inviteAllBtn = document.createElement('button');
    inviteAllBtn.textContent = "💌 Пригласить всех друзей";
    inviteAllBtn.className = "btn btn-primary";
    inviteAllBtn.style.cssText = "margin: 20px 0; width: 100%; padding: 12px;";
    inviteAllBtn.onclick = inviteAllFriends;
    container.appendChild(inviteAllBtn);
  }
}

/**
 * Начинает чат с пользователем
 */
function startChatWith(address) {
  if (!address) {
    alert('Этот пользователь ещё не в SoulMine!');
    return;
  }
  
  appState.callPartnerAddress = address;
  showScreen('chat-screen');
  showViralToast(`💬 Чат с ${address.slice(0,6)}... открыт!`);
}

/**
 * Начинает звонок с пользователем
 */
function startCallWith(address) {
  if (!address) {
    alert('Этот пользователь ещё не в SoulMine!');
    return;
  }
  
  appState.callPartnerAddress = address;
  startVideoCall();
  updateQuestProgress("call_with_contact");
  unlockAchievement('first_contact_call', 'Соединитель Сердец', 'Совершили звонок контакту!', '📞');
}

/**
 * Приглашает одного пользователя в SoulMine
 */
function inviteUser(telegramId, name) {
  if (!appState.userAddress) {
    alert('Подключите кошелёк для приглашения!');
    return;
  }

  const inviteLink = `https://t.me/LoveSoulMine_Bot?start=ref_${appState.userAddress}`;
  
  if (window.Telegram?.WebApp?.sendData) {
    window.Telegram.WebApp.sendData(JSON.stringify({
      type: "invite_user",
      telegram_id: telegramId,
      invite_link: inviteLink,
      inviter_address: appState.userAddress
    }));
    showViralToast(`✅ Приглашение отправлено ${name}!`);
    updateQuestProgress("invite_friend");
  } else {
    // Fallback: копировать ссылку
    navigator.clipboard.writeText(inviteLink);
    showViralToast(`📋 Ссылка для ${name} скопирована! Отправьте её в Telegram.`);
  }
  
  unlockAchievement('first_invite', 'Амбассадор Любви', 'Пригласили первого друга!', '💌');
}

/**
 * Приглашает всех друзей сразу
 */
function inviteAllFriends() {
  if (!appState.userAddress) {
    alert('Подключите кошелёк для приглашения!');
    return;
  }

  const inviteLink = `https://t.me/LoveSoulMine_Bot?start=ref_${appState.userAddress}`;
  const inviteUsers = appState.contacts.telegram.filter(c => !c.is_on_soulmine);
  
  if (inviteUsers.length === 0) {
    alert('Нет друзей для приглашения!');
    return;
  }

  if (window.Telegram?.WebApp?.sendData) {
    // Отправляем боту список для массовой рассылки
    window.Telegram.WebApp.sendData(JSON.stringify({
      type: "invite_multiple_users",
      telegram_ids: inviteUsers.map(u => u.telegram_id),
      invite_link: inviteLink,
      inviter_address: appState.userAddress
    }));
    showViralToast(`🚀 Приглашения отправлены ${inviteUsers.length} друзьям!`);
  } else {
    // Fallback: копировать ссылку
    navigator.clipboard.writeText(inviteLink);
    showViralToast(`📋 Ссылка скопирована! Отправьте её всем друзьям.`);
  }
  
  updateQuestProgress("invite_friend", inviteUsers.length);
  unlockAchievement('mass_invite', 'Рекрутер Любви', `Пригласили ${inviteUsers.length} друзей!`, '🚀');
}

// Экспорт функций для глобального доступа
window.loadTelegramContacts = loadTelegramContacts;
window.loadTONContacts = loadTONContacts;
window.renderContacts = renderContacts;
window.startChatWith = startChatWith;
window.startCallWith = startCallWith;
window.inviteUser = inviteUser;
window.inviteAllFriends = inviteAllFriends;

// Хелперы (предполагаются импортированными из utils.js)
function showViralToast(message) {
  if (typeof window.showViralToast === 'function') {
    window.showViralToast(message);
  } else {
    alert(message);
  }
}

function unlockAchievement(id, title, description, icon) {
  if (typeof window.unlockAchievement === 'function') {
    window.unlockAchievement(id, title, description, icon);
  }
}

function updateQuestProgress(questId, increment = 1) {
  if (typeof window.updateQuestProgress === 'function') {
    window.updateQuestProgress(questId, increment);
  }
}

function showScreen(screenId) {
  if (typeof window.showScreen === 'function') {
    window.showScreen(screenId);
  }
}

function startVideoCall() {
  if (typeof window.startVideoCall === 'function') {
    window.startVideoCall();
  }
}