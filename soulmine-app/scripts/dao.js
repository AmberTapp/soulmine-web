import { appState, CONFIG, showLove, updateQuestProgress, unlockAchievement, showViralToast } from './utils.js';

/**
 * Загружает предложения DAO — будущее вселенной в твоих руках
 */
async function loadProposals() {
  const container = document.getElementById('proposals-list');
  if (!container) return;

  // Показываем лоадер
  container.innerHTML = '<p>Загрузка предложений... <span class="spinner">⏳</span></p>';

  const now = Date.now();
  if (proposalsCache && (now - lastProposalsFetch < CACHE_DURATION)) {
    renderProposals(proposalsCache);
    return;
  }

  try {
    // В реальном приложении — запрос к контракту DAO
    // Здесь — имитация с философским уклоном
    const proposals = [
      {
        id: 1,
        title: "Добавить фильтр 'Котики'",
        description: "AR-фильтр с котиками во время звонка — чтобы растопить любое сердце",
        votesFor: 1240,
        votesAgainst: 310,
        totalVotes: 1550,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "fun"
      },
      {
        id: 2,
        title: "Увеличить награду за звонки",
        description: "Поднять майнинг $LOVE с 0.3 до 0.5 за минуту — любовь должна быть щедрой",
        votesFor: 890,
        votesAgainst: 670,
        totalVotes: 1560,
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "economy"
      },
      {
        id: 3,
        title: "Добавить DAO-токен $SOUL",
        description: "Новый токен для управления и стейкинга — власть в руках граждан",
        votesFor: 2100,
        votesAgainst: 1900,
        totalVotes: 4000,
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "closed",
        category: "governance"
      },
      {
        id: 4,
        title: "Создать 'Острова Любви' в Metaverse",
        description: "Виртуальные пространства для встреч — где AI помогает найти идеальное место",
        votesFor: 3120,
        votesAgainst: 890,
        totalVotes: 4010,
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "metaverse"
      }
    ];

    proposalsCache = proposals;
    lastProposalsFetch = Date.now();
    renderProposals(proposals);
  } catch (e) {
    console.error('Ошибка загрузки предложений DAO:', e);
    container.innerHTML = '<p class="empty-state">Ошибка загрузки. Попробуйте позже.</p>';
  }
}

/**
 * Рендерит предложения DAO — твое влияние на будущее
 */
function renderProposals(proposals) {
  const container = document.getElementById('proposals-list');
  if (!container) return;

  container.innerHTML = '';

  if (proposals.length === 0) {
    container.innerHTML = '<p class="empty-state">Нет активных предложений</p>';
    return;
  }

  proposals.forEach(p => {
    const endDate = new Date(p.endDate);
    const isExpired = Date.now() > endDate.getTime();
    const citizenNFT = JSON.parse(localStorage.getItem('soulmine_citizen_nft'));
    const canVote = citizenNFT && p.status === "active";
    const userVote = appState.dao.userVotes[p.id];

    // Определяем цвет категории
    const categoryColor = {
      fun: '#FF6B6B',
      economy: '#4ECDC4',
      governance: '#45B7D1',
      metaverse: '#96CEB4'
    }[p.category] || '#00D1B2';

    const div = document.createElement('div');
    div.className = 'proposal-item';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: ${categoryColor};">${p.title}</h3>
        <span class="status-${p.status}">${p.status === 'active' ? '⏳ Активно' : '✅ Завершено'}</span>
      </div>
      <p>${p.description}</p>
      <p><strong>Категория:</strong> <span style="color: ${categoryColor}; font-weight: bold;">${p.category.toUpperCase()}</span></p>
      <p><strong>Окончание:</strong> ${endDate.toLocaleDateString('ru-RU')}</p>
      <div style="display: flex; gap: 20px; margin: 15px 0; font-weight: bold;">
        <div style="color: #00d1b2;">✅ За: ${p.votesFor}</div>
        <div style="color: #ff4757;">❌ Против: ${p.votesAgainst}</div>
        <div>📊 Всего: ${p.totalVotes}</div>
      </div>
      ${isExpired ? `
        <p style="color: #aaa; font-style: italic;">Голосование завершено. Результаты повлияют на обновление v2.0</p>
      ` : canVote ? `
        <div style="margin-top: 15px;">
          <p style="margin-bottom: 10px;"><strong>Ваш голос (влияние x${citizenNFT.influenceMultiplier || 1.0}):</strong></p>
          <div style="display: flex; gap: 10px;">
            <button onclick="voteProposal(${p.id}, 'for')" class="btn btn-primary" style="flex: 1; margin: 0;">✅ За</button>
            <button onclick="voteProposal(${p.id}, 'against')" class="btn btn-secondary" style="flex: 1; margin: 0;">❌ Против</button>
          </div>
        </div>
      ` : `
        <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
          <p style="margin: 0;"><strong>🔒 Нужен Citizen NFT для голосования</strong></p>
          <p style="font-size: 0.9rem; margin: 5px 0 0 0;">Совершите первый звонок — получите NFT и право голоса!</p>
        </div>
      `}
      ${userVote ? `
        <div style="background: rgba(0, 209, 178, 0.2); padding: 10px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 0; color: #00d1b2; font-weight: bold;">🗳️ Ваш голос учтён: ${userVote.type === 'for' ? '✅ За' : '❌ Против'} (x${userVote.weight})</p>
        </div>
      ` : ''}
      <hr>
    `;
    container.appendChild(div);
  });
}

/**
 * Голосует за предложение — твое влияние меняет вселенную
 */
function voteProposal(proposalId, voteType) {
  if (!appState.userAddress) {
    alert('Подключите кошелёк для участия в судьбе вселенной!');
    return;
  }

  const citizenNFT = JSON.parse(localStorage.getItem('soulmine_citizen_nft'));
  if (!citizenNFT) {
    alert('Станьте Гражданином SoulMine! Совершите первый звонок и получите NFT.');
    return;
  }

  // В реальном проекте — отправка транзакции на контракт DAO
  const weight = citizenNFT.influenceMultiplier || 1.0;

  // Имитация голосования
  const proposal = proposalsCache.find(p => p.id === proposalId);
  if (proposal) {
    if (voteType === 'for') proposal.votesFor += weight;
    else proposal.votesAgainst += weight;
    proposal.totalVotes += weight;
    
    // Сохраняем голос пользователя
    appState.dao.userVotes[proposalId] = { type: voteType, weight };
  }

  renderProposals(proposalsCache);
  
  // Награда за участие в демократии
  showLove(5 * weight);
  updateQuestProgress("vote_in_dao");
  unlockAchievement('first_vote', 'Голос Разума', 'Вы проголосовали в DAO впервые!', '🏛️');
  
  // Вирусный триггер — хвастаемся статусом
  const shareText = `Я только что проголосовал в DAO SoulMine с влиянием x${weight}! 💪\nМоё NFT: "${citizenNFT.name}"\nПрисоединяйся → https://t.me/LoveSoulMine_Bot`;
  navigator.clipboard.writeText(shareText);
  showViralToast("🗳️ Ваш голос — будущее вселенной! Ссылка скопирована — поделитесь статусом Гражданина!");

  alert(`Ваш голос (${weight}x) учтён! Вы помогаете строить будущее SoulMine 💜`);
}

/**
 * Загружает Citizen NFT — ваш пропуск в мир любовной демократии
 */
async function loadCitizenNFT() {
  if (!appState.userAddress) return;

  // Проверяем, есть ли у пользователя Citizen NFT (в реальности — запрос к контракту)
  const citizenNFT = JSON.parse(localStorage.getItem('soulmine_citizen_nft'));

  const nftEl = document.getElementById('citizen-nft-display');
  if (!nftEl) return;

  if (citizenNFT) {
    appState.dao.userNFT = citizenNFT;
    nftEl.innerHTML = `
      <img src="https://soulmine-web.vercel.app/assets/citizen_level_${citizenNFT.level}.png" 
           style="width: 60px; height: 60px; border-radius: 8px; margin-right: 12px; box-shadow: 0 0 10px rgba(0, 209, 178, 0.5);">
      <div>
        <div style="font-weight: bold; color: #00D1B2;">${citizenNFT.name}</div>
        <div style="font-size: 0.9rem;">Уровень ${citizenNFT.level} • Влияние x${citizenNFT.influenceMultiplier}</div>
      </div>
    `;
  } else {
    // Предлагаем получить NFT
    nftEl.innerHTML = `
      <div style="text-align: center; padding: 20px; background: rgba(0, 209, 178, 0.1); border-radius: 15px; border: 1px solid rgba(0, 209, 178, 0.3);">
        <div style="font-size: 2rem; margin-bottom: 10px;">🏛️</div>
        <p style="margin: 0 0 15px 0; font-weight: bold;">Станьте Гражданином SoulMine</p>
        <p style="margin: 0 0 20px 0; font-size: 0.9rem;">Совершите первый звонок — получите NFT и право голоса в DAO!</p>
        <button onclick="findRandomPartner()" class="btn btn-primary" style="padding: 10px 20px;">💫 Найти первую пару</button>
      </div>
    `;
  }
}

/**
 * Выдача NFT гражданина (при первом звонке) — ритуал посвящения
 */
async function awardCitizenNFT() {
  if (localStorage.getItem('soulmine_citizen_nft_issued')) return;
  
  const citizenNFT = {
    id: "citizen_level_1",
    name: "Гражданин SoulMine",
    description: "Ваш голос в DAO. Уровень 1.",
    image: "🏛️",
    level: 1,
    issuedAt: new Date().toISOString(),
    influenceMultiplier: 1.0 // Множитель влияния для голосования
  };
  
  localStorage.setItem('soulmine_citizen_nft', JSON.stringify(citizenNFT));
  localStorage.setItem('soulmine_citizen_nft_issued', 'true');
  
  // Показываем модальное окно посвящения
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="text-align: center; background: linear-gradient(135deg, #0a0a2a, #1a1a4a);">
      <div style="font-size: 3rem; margin-bottom: 20px;">🏛️</div>
      <h2 style="color: #00D1B2; margin-bottom: 20px;">Поздравляем! Вы — Гражданин SoulMine!</h2>
      <p>Вам выдано специальное NFT, дающее право голоса в DAO.</p>
      <div style="background: rgba(0, 209, 178, 0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
        <p><strong>📜 Название:</strong> ${citizenNFT.name}</p>
        <p><strong>⚖️ Влияние:</strong> x${citizenNFT.influenceMultiplier}</p>
        <p><strong>📅 Выдано:</strong> ${new Date(citizenNFT.issuedAt).toLocaleDateString('ru-RU')}</p>
      </div>
      <button onclick="document.body.removeChild(this.parentElement.parentElement);" class="btn btn-primary" style="width: 100%;">✨ Принять судьбу</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Отправляем данные в Telegram-бот для клейма NFT
  if (window.Telegram?.WebApp?.sendData) {
    window.Telegram.WebApp.sendData(JSON.stringify({
      type: "award_citizen_nft",
      level: 1,
      address: appState.userAddress
    }));
  }

  console.log('🏛️ Выдано NFT гражданина DAO');
  loadCitizenNFT(); // Обновляем UI сразу
  unlockAchievement('citizen_awarded', 'Гражданин Вселенной', 'Получили Citizen NFT!', '🏛️');
}

/**
 * Повышение уровня гражданина — путь к статусу бога
 */
function upgradeCitizenLevel() {
  const citizenStr = localStorage.getItem('soulmine_citizen_nft');
  if (!citizenStr) return;
  
  const citizen = JSON.parse(citizenStr);
  const totalCalls = appState.callHistory?.length || 0;
  const totalMessages = appState.userBehavior?.messagesSent || 0;
  
  // Формула уровня: чем активнее — тем быстрее рост
  const newLevel = Math.min(10, 1 + Math.floor(totalCalls / 3) + Math.floor(totalMessages / 50));
  
  if (newLevel > (citizen.level || 0)) {
    citizen.level = newLevel;
    citizen.influenceMultiplier = parseFloat((1.0 + (newLevel - 1) * 0.3).toFixed(1)); // +30% за уровень
    citizen.upgradedAt = new Date().toISOString();
    
    localStorage.setItem('soulmine_citizen_nft', JSON.stringify(citizen));
    
    // Отправляем в Telegram-бот
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        type: "upgrade_citizen_level",
        new_level: newLevel,
        influence: citizen.influenceMultiplier,
        address: appState.userAddress
      }));
    }
    
    console.log(`🏛️ Уровень гражданина повышен до ${newLevel}`);
    showUpgradeToast(newLevel); // Показываем уведомление
    loadCitizenNFT(); // Обновляем UI
    unlockAchievement(`level_${newLevel}`, `Мастер Уровня ${newLevel}`, `Достиг уровня ${newLevel} в SoulMine!`, '👑');
  }
}

/**
 * Показать тост об апгрейде — твоя слава растёт
 */
function showUpgradeToast(level) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #00D1B2, #00A8CC);
    color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; 
    box-shadow: 0 4px 20px rgba(0, 209, 178, 0.4); font-weight: bold;
    animation: fadeInOut 3s ease-in-out;
  `;
  toast.innerHTML = `🎉 Уровень повышен до ${level}! Ваше влияние в DAO увеличено!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Кэш предложений
let proposalsCache = null;
let lastProposalsFetch = 0;
const CACHE_DURATION = 30000; // 30 сек

// Экспорт
window.loadProposals = loadProposals;
window.voteProposal = voteProposal;
window.loadCitizenNFT = loadCitizenNFT;
window.awardCitizenNFT = awardCitizenNFT;
window.upgradeCitizenLevel = upgradeCitizenLevel;
window.showUpgradeToast = showUpgradeToast;