// dao.js

// Загрузка NFT гражданина
function loadCitizenNFT() {
  const levelEl = document.getElementById('citizen-nft-level');
  if (!levelEl) return;
  const nft = localStorage.getItem('soulmine_citizen_nft');
  if (nft) {
    const data = JSON.parse(nft);
    levelEl.textContent = `${data.name} (Уровень ${data.level})`;
  } else {
    levelEl.textContent = "Не выдано. Совершите первый звонок!";
  }
}

// Выдача NFT гражданина (при первом звонке)
async function awardCitizenNFT() {
  if (localStorage.getItem('soulmine_citizen_nft_issued')) return;
  const citizenNFT = {
    id: "citizen_level_1",
    name: "Гражданин SoulMine",
    description: "Ваш голос в DAO. Уровень 1.",
    image: "🏛️",
    level: 1,
    issuedAt: new Date().toISOString()
  };
  localStorage.setItem('soulmine_citizen_nft', JSON.stringify(citizenNFT));
  localStorage.setItem('soulmine_citizen_nft_issued', 'true');
  showNFTModal(citizenNFT);
  const metadataUrl = await saveToTonStorage(citizenNFT, `citizen_nft_${window.userAddress}.json`);
  if (metadataUrl) {
    const botUrl = `https://t.me/LoveSoulMine_Bot?start=claim_nft_citizen_${encodeURIComponent(metadataUrl)}`;
    window.open(botUrl, '_blank');
  }
  console.log('🏛️ Выдано NFT гражданина DAO');
}

// Повышение уровня гражданина
function upgradeCitizenLevel() {
  const citizenStr = localStorage.getItem('soulmine_citizen_nft');
  if (!citizenStr) return;
  const citizen = JSON.parse(citizenStr);
  const totalCalls = window.callHistory.length;
  const totalMessages = window.userBehavior.messagesSent;
  const newLevel = Math.min(5, 1 + Math.floor(totalCalls / 5) + Math.floor(totalMessages / 100));
  if (newLevel > (citizen.level || 0)) {
    citizen.level = newLevel;
    citizen.upgradedAt = new Date().toISOString();
    localStorage.setItem('soulmine_citizen_nft', JSON.stringify(citizen));
    saveToTonStorage(citizen, `citizen_nft_${window.userAddress}.json`).then(url => {
      if (url) {
        const botUrl = `https://t.me/LoveSoulMine_Bot?start=upgrade_nft_level_${newLevel}_url_${encodeURIComponent(url)}`;
        window.open(botUrl, '_blank');
      }
    });
    console.log(`🏛️ Уровень гражданина повышен до ${newLevel}`);
    loadCitizenNFT();
  }
}

// Загрузка предложений
async function loadProposals() {
  const container = document.getElementById('proposals-list');
  if (!container) return;
  container.innerHTML = '<p>Загрузка предложений...</p>';
  try {
    // В реальном приложении здесь будет запрос к контракту DAO
    const proposals = [
      {
        id: 1,
        title: "Добавить фильтр 'Котики'",
        description: "AR-фильтр с котиками во время звонка",
        votesFor: 1240,
        votesAgainst: 310,
        totalSupplySnapshot: 50000,
        status: 0
      },
      {
        id: 2,
        title: "Раздать 10,000 $LOVE новичкам",
        description: "Airdrop для первых 1000 пользователей",
        votesFor: 890,
        votesAgainst: 610,
        totalSupplySnapshot: 50000,
        status: 0
      }
    ];
    renderProposals(proposals);
  } catch (error) {
    container.innerHTML = `<p>Ошибка загрузки: ${error.message}</p>`;
  }
}

// Отображение предложений
function renderProposals(proposals) {
  const container = document.getElementById('proposals-list');
  if (!container) return;
  container.innerHTML = '';
  if (proposals.length === 0) {
    container.innerHTML = '<p>Нет активных предложений</p>';
    return;
  }
  proposals.forEach(p => {
    const totalVotes = p.votesFor + p.votesAgainst;
    const quorum = p.totalSupplySnapshot * 0.05;
    const hasQuorum = totalVotes >= quorum;
    const percentFor = totalVotes > 0 ? (p.votesFor / totalVotes * 100).toFixed(1) : 0;
    let statusText = '⏳ Голосование';
    let statusClass = 'status-active';
    if (p.status === 1) { statusText = '✅ Принято'; statusClass = 'status-passed'; }
    else if (p.status === 2) { statusText = '❌ Отклонено'; statusClass = 'status-rejected'; }
    const div = document.createElement('div');
    div.className = 'proposal-item';
    div.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <p><strong>Голосов "За":</strong> ${p.votesFor.toLocaleString()} $LOVE — ${percentFor}%</p>
      <p><strong>Голосов "Против":</strong> ${p.votesAgainst.toLocaleString()} $LOVE</p>
      <p><strong>Кворум:</strong> ${hasQuorum ? '✅' : '❌'} (нужно: ${quorum.toLocaleString()} $LOVE)</p>
      <p><strong>Статус:</strong> <span class="${statusClass}">${statusText}</span></p>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="vote-btn" onclick="voteProposal(${p.id}, 1)">🗳️ За</button>
        <button class="vote-btn" onclick="voteProposal(${p.id}, 0)">🗳️ Против</button>
      </div>
      <hr>
    `;
    container.appendChild(div);
  });
}

// Голосование
async function voteProposal(proposalId, support = 1) {
  if (!window.userAddress) {
    alert('Подключите кошелек!');
    return;
  }
  try {
    const loveBalance = await getLoveBalanceRaw(window.userAddress);
    if (loveBalance <= 0) {
      alert('Нужен баланс $LOVE для голосования!');
      return;
    }
    alert(`🗳️ Ваш голос учтен! Вес: ${loveBalance} $LOVE
(В демо-версии голосование эмулируется)`);
    setTimeout(loadProposals, 2000);
  } catch (error) {
    console.error('Ошибка голосования:', error);
    alert('Ошибка: ' + error.message);
  }
}

// Создание предложения
function createProposal() {
  if (!window.userAddress) {
    alert('Подключите кошелек!');
    return;
  }
  const title = prompt('Заголовок предложения:');
  if (!title) return;
  const description = prompt('Описание:');
  if (!description) return;
  alert('📝 Предложение создано! (В демо-версии эмулируется)');
  setTimeout(loadProposals, 1000);
}

// Сохранение данных в TON Storage (демо)
async function saveToTonStorage(data, filename) {
  try {
    const storageItem = {
      version: "1.0",
      owner: window.userAddress,
      timestamp: Date.now(),
      data
    };
    const content = btoa(JSON.stringify(storageItem));
    const blob = new Blob([content], { type: 'application/json' });
    const mockStorageUrl = `https://ton-storage.example/${encodeURIComponent(filename)}`;
    console.log('💾 [ДЕМО] Сохраняем в TON Storage:', filename, '→', mockStorageUrl);
    return mockStorageUrl;
  } catch (error) {
    console.error('Ошибка сохранения в TON Storage:', error);
    return null;
  }
}

// Экспортируем функции
window.loadCitizenNFT = loadCitizenNFT;
window.awardCitizenNFT = awardCitizenNFT;
window.upgradeCitizenLevel = upgradeCitizenLevel;
window.loadProposals = loadProposals;
window.voteProposal = voteProposal;
window.createProposal = createProposal;
window.saveToTonStorage = saveToTonStorage;