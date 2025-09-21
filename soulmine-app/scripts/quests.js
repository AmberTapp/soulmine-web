// quests.js

const QUESTS = [
  { 
    id: "connect_wallet", 
    title: "Подключите кошелёк", 
    description: "Привяжите свой TON-кошелек к SoulMine.",
    goal: 1, 
    progress: 0, 
    reward: { love: 50, nft: "Новичок Web3" }, 
    completed: false 
  },
  { 
    id: "50_messages", 
    title: "Отправьте 50 сообщений", 
    description: "Общайтесь и зарабатывайте $LOVE.",
    goal: 50, 
    progress: 0, 
    reward: { love: 30, nft: "Болтун" }, 
    completed: false 
  },
  { 
    id: "7_days_active", 
    title: "Будьте активны 7 дней", 
    description: "Заходите в приложение каждый день.",
    goal: 7, 
    progress: 0, 
    reward: { love: 20, nft: "Выносливый" }, 
    completed: false 
  }
];

function loadQuests() {
  const saved = localStorage.getItem('soulmine_quests');
  if (saved) {
    const parsed = JSON.parse(saved);
    QUESTS.forEach(q => {
      const savedQ = parsed.find(sq => sq.id === q.id);
      if (savedQ) {
        q.progress = savedQ.progress;
        q.completed = savedQ.completed;
      }
    });
  }
}

function saveQuests() {
  localStorage.setItem('soulmine_quests', JSON.stringify(QUESTS));
}

function renderQuests() {
  const container = document.getElementById('quests-list');
  if (!container) return;
  container.innerHTML = '';
  let completedCount = QUESTS.filter(q => q.completed).length;
  QUESTS.forEach(quest => {
    const percent = Math.min(100, (quest.progress / quest.goal) * 100);
    const isDone = quest.progress >= quest.goal && !quest.completed;
    const div = document.createElement('div');
    div.className = 'quest-item';
    div.innerHTML = `
      <div class="quest-title">${quest.title}</div>
      <div class="quest-desc">${quest.description}</div>
      <div class="quest-reward">Награда: ${quest.reward.love} $LOVE${quest.reward.nft ? ' + NFT' : ''}</div>
      <div class="quest-progress">
        <div class="progress-bar"><div class="progress-fill" style="--width: ${percent}%"></div></div>
        <span>${quest.progress}/${quest.goal}</span>
      </div>
      <button class="quest-complete-btn" ${isDone ? '' : 'disabled'} onclick="completeQuest('${quest.id}')">
        ${quest.completed ? 'Получено' : 'Получить'}
      </button>
    `;
    if (quest.completed) div.style.opacity = '0.7';
    container.appendChild(div);
  });
  const progressEl = document.getElementById('quests-progress');
  if (progressEl) progressEl.textContent = `${completedCount}/${QUESTS.length}`;
}

function completeQuest(id) {
  const quest = QUESTS.find(q => q.id === id);
  if (!quest || quest.completed) return;
  quest.completed = true;
  addLove(quest.reward.love);
  if (quest.reward.nft) showNFTModal({ name: quest.reward.nft, image: "🎁" });
  saveQuests();
  renderQuests();
  upgradeCitizenLevel();
  alert(`🎉 Вы получили: ${quest.reward.love} $LOVE${quest.reward.nft ? ' и NFT!' : ''}`);
}

function incrementQuest(id, amount = 1) {
  const quest = QUESTS.find(q => q.id === id && !q.completed);
  if (quest) {
    quest.progress = Math.min(quest.goal, quest.progress + amount);
    saveQuests();
    renderQuests();
  }
}

loadQuests();

window.loadQuests = loadQuests;
window.renderQuests = renderQuests;
window.completeQuest = completeQuest;
window.incrementQuest = incrementQuest;