// webrtc.js — не просто звонки, а генерация вирусного контента через AI

import { appState, CONFIG, showLove, appendChatMessage, saveCallHistory, updateQuestProgress, checkCoupleNFTs, unlockAchievement, showViralToast } from './utils.js';

// === AI SoulMatch ===
const ALL_INTERESTS = [
  'Музыка', 'Кино', 'Спорт', 'Путешествия', 'Книги',
  'Игры', 'Web3', 'Криптовалюты', 'Искусство', 'Технологии',
  'Еда', 'Фитнес', 'Медитация', 'Образование', 'Бизнес'
];

function loadAIParams() {
  return JSON.parse(localStorage.getItem('soulmine_ai_params')) || null;
}

function showAIParamsModal() {
  const modal = document.getElementById('ai-params-modal');
  if (!modal) return;

  const savedParams = loadAIParams();
  if (savedParams) {
    if (savedParams.ageRange) document.getElementById('age-range').value = savedParams.ageRange;
    if (savedParams.goal) document.getElementById('goal').value = savedParams.goal;
  }

  const container = document.getElementById('interests-container');
  container.innerHTML = '';
  ALL_INTERESTS.forEach(interest => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label style="display: flex; align-items: center; cursor: pointer;">
        <input type="checkbox" value="${interest}" style="margin-right: 8px;">
        <span>${interest}</span>
      </label>
    `;
    container.appendChild(div);
  });

  if (savedParams && savedParams.interests) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      if (savedParams.interests.includes(cb.value)) {
        cb.checked = true;
      }
    });
  }

  modal.style.display = 'flex';
}

function saveAIParams() {
  const ageRange = document.getElementById('age-range').value;
  const goal = document.getElementById('goal').value;
  
  const checkboxes = document.querySelectorAll('#interests-container input[type="checkbox"]:checked');
  const interests = Array.from(checkboxes).map(cb => cb.value).slice(0, 3);

  if (interests.length === 0) {
    alert('Пожалуйста, выберите хотя бы один интерес.');
    return;
  }

  const params = { ageRange, interests, goal };
  localStorage.setItem('soulmine_ai_params', JSON.stringify(params));
  document.getElementById('ai-params-modal').style.display = 'none';
  findAISoulmate(params);
}

async function findAISoulmate(params) {
  if (!appState.userAddress) {
    alert('Сначала подключите кошелек!');
    return;
  }
  if (appState.isCalling) {
    alert('Завершите текущий звонок!');
    return;
  }
  if (appState.isSearching) {
    if (appState.ws && appState.ws.readyState === WebSocket.OPEN) {
      appState.ws.send(JSON.stringify({ type: 'cancel_search' }));
    }
    appState.isSearching = false;
    return;
  }

  appState.isSearching = true;

  const searchingModal = document.getElementById('searching-modal');
  if (searchingModal) searchingModal.style.display = 'flex';

  if (appState.ws && appState.ws.readyState === WebSocket.OPEN) {
    appState.ws.send(JSON.stringify({
      type: 'find_ai_soulmate',
      address: appState.userAddress,
      params: params
    }));
  }

  console.log('🚀 Запущен AI SoulMatch с параметрами:', params);
}

// Обновляем основную функцию поиска
window.findRandomPartner = function() {
  const savedParams = loadAIParams();
  if (savedParams) {
    findAISoulmate(savedParams);
  } else {
    showAIParamsModal();
  }
};

// === Система свайпов ===
const DEMO_USERS = [
  { id: 1, name: "Анна", age: 24, interests: "Музыка, Путешествия", wallet: "EQAbc...def", image: "model01" },
  { id: 2, name: "Марк", age: 28, interests: "Web3, Технологии", wallet: "EQGhi...jkl", image: "model02" },
  { id: 3, name: "Лиза", age: 22, interests: "Искусство, Кино", wallet: "EQMno...pqr", image: "model03" },
  { id: 4, name: "Дмитрий", age: 31, interests: "Спорт, Бизнес", wallet: "EQStu...vwx", image: "model04" },
  { id: 5, name: "София", age: 26, interests: "Книги, Медитация", wallet: "EQYza...bcd", image: "model05" },
  { id: 6, name: "Алексей", age: 29, interests: "Игры, Криптовалюты", wallet: "EQEfg...hij", image: "model06" },
  { id: 7, name: "Виктория", age: 27, interests: "Еда, Фитнес", wallet: "EQKlm...nop", image: "model11" },
  { id: 8, name: "Иван", age: 33, interests: "Образование, Web3", wallet: "EQQRS...TUV", image: "model44" }
];

let currentCardIndex = 0;
let currentCardElement = null;
let startX = 0;
let currentX = 0;
let isDragging = false;

function initSwipeArea() {
  const swipeArea = document.getElementById('swipe-area');
  if (!swipeArea) return;
  swipeArea.innerHTML = '';

  if (!appState.userAddress) {
    swipeArea.innerHTML = `
      <div class="placeholder-card">
        <p>Подключите кошелек, чтобы начать свайпать ❤️</p>
      </div>
    `;
    return;
  }

  for (let i = 0; i < Math.min(3, DEMO_USERS.length); i++) {
    createCard(i);
  }

  currentCardElement = swipeArea.querySelector('.swipe-card');
  if (currentCardElement) {
    currentCardElement.style.zIndex = '10';
  }
}

function createCard(index) {
  if (index >= DEMO_USERS.length) return;
  const user = DEMO_USERS[index];
  const card = document.createElement('div');
  card.className = 'swipe-card';
  card.dataset.index = index;
  card.innerHTML = `
    <img src="./assets/models/${user.image}.png" alt="${user.name}">
    <div class="card-info">
      <h3>${user.name}, ${user.age}</h3>
      <p>${user.interests}</p>
      <p style="font-size: 0.8rem; opacity: 0.7;">${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}</p>
    </div>
  `;
  card.addEventListener('mousedown', startDrag);
  card.addEventListener('touchstart', startDrag);
  swipeArea.appendChild(card);
}

function startDrag(e) {
  isDragging = true;
  startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
  currentX = startX;
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
}

function drag(e) {
  if (!isDragging) return;
  currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
  const deltaX = currentX - startX;
  const card = currentCardElement;
  if (card) {
    card.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`;
    card.style.opacity = 1 - Math.abs(deltaX) / 500;
  }
}

function endDrag() {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchend', endDrag);
  if (!isDragging) return;
  isDragging = false;
  const deltaX = currentX - startX;
  const card = currentCardElement;
  if (!card) return;

  if (deltaX > 100) {
    card.classList.add('swiping-right');
    setTimeout(() => handleLike(), 300);
  } else if (deltaX < -100) {
    card.classList.add('swiping-left');
    setTimeout(() => handleDislike(), 300);
  } else {
    card.style.transform = 'translateX(0) rotate(0deg)';
    card.style.opacity = '1';
  }
}

function handleLike() {
  const user = DEMO_USERS[currentCardIndex];
  showLove(1.0);
  sendWebAppData({
    type: "swipe",
    action: "like",
    partner: user.wallet
  });
  updateQuestProgress("swipe_like");
  unlockAchievement('first_like', 'Первый Лайк', 'Вы поставили первый лайк!', '❤️');
  alert(`❤️ Вам понравился ${user.name}!`);
  showNextCard();
}

function handleDislike() {
  const user = DEMO_USERS[currentCardIndex];
  showLove(0.1);
  sendWebAppData({
    type: "swipe",
    action: "dislike",
    partner: user.wallet
  });
  updateQuestProgress("swipe_dislike");
  alert(`❌ Вы пропустили ${user.name}`);
  showNextCard();
}

function showNextCard() {
  currentCardIndex++;
  const swipeArea = document.getElementById('swipe-area');
  if (!swipeArea) return;

  if (currentCardElement) {
    currentCardElement.remove();
  }

  if (currentCardIndex < DEMO_USERS.length) {
    createCard(currentCardIndex);
    currentCardElement = swipeArea.querySelector('.swipe-card:last-child');
    if (currentCardElement) {
      currentCardElement.style.zIndex = '10';
    }
  } else {
    swipeArea.innerHTML = `
      <div class="placeholder-card">
        <p>Вы просмотрели всех! Подождите, мы найдем новых пользователей...</p>
      </div>
    `;
    currentCardElement = null;
    setTimeout(() => {
      currentCardIndex = 0;
      initSwipeArea();
    }, 3000);
  }
}

// === Действия с карточкой ===
function openChatWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  appState.callPartnerAddress = user.wallet;
  alert(`Чат с ${user.name} скоро будет доступен!`);
}

function startVoiceCallWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  appState.callPartnerAddress = user.wallet;
  startVideoCall(); // В демо — видео
}

function startVideoCallWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  appState.callPartnerAddress = user.wallet;
  startVideoCall();
}

// === Отправка данных в Telegram ===
function sendWebAppData(data) {
  if (window.Telegram?.WebApp?.sendData) {
    try {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
      console.log('✅ Данные отправлены в Telegram-бот:', data);
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
    }
  } else {
    console.warn('⚠️ Telegram WebApp недоступен');
  }
}

// === WebRTC ===
function initPeerConnection() {
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  appState.peerConnection = new RTCPeerConnection(config);
  console.log('✅ WebRTC соединение инициализировано');

  appState.peerConnection.ondatachannel = (event) => {
    setupDataChannel(event.channel);
  };
}

function setupDataChannel(channel) {
  appState.dataChannel = channel;
  channel.onopen = () => {
    console.log('📡 DataChannel открыт');
    sendCompatibilityUpdate();
    sendEmotionSnapshot();
  };
  channel.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log('📩 Получено:', msg);
    switch (msg.type) {
      case 'compatibility_update':
        appState.coupleProgress.compatibility = msg.value;
        const display = document.getElementById('compatibility-display');
        if (display) display.textContent = `${msg.value.toFixed(1)}%`;
        checkCoupleNFTs();
        break;
      case 'emotion_snapshot':
        console.log('Эмоции партнера:', msg.emotions);
        break;
      case 'chat_message':
        appendChatMessage(msg.text, 'partner');
        break;
      case 'ai_match_found':
        appState.callPartnerAddress = msg.partner;
        alert(`🎯 AI нашел вам идеальную пару! Совместимость: ${(msg.compatibilityScore * 100).toFixed(0)}%`);
        const searchingModal = document.getElementById('searching-modal');
        if (searchingModal) searchingModal.style.display = 'none';
        appState.isSearching = false;
        startVideoCall(true);
        break;
      case 'ai_match_not_found':
        alert(msg.message || 'Подходящих собеседников не найдено.');
        const searchingModal2 = document.getElementById('searching-modal');
        if (searchingModal2) searchingModal2.style.display = 'none';
        appState.isSearching = false;
        break;
    }
  };
  channel.onclose = () => {
    console.log('🔌 DataChannel закрыт');
  };
}

function sendCompatibilityUpdate() {
  if (appState.dataChannel?.readyState === 'open') {
    appState.dataChannel.send(JSON.stringify({
      type: 'compatibility_update',
      value: appState.coupleProgress.compatibility
    }));
  }
}

function sendEmotionSnapshot() {
  if (appState.dataChannel?.readyState === 'open') {
    appState.dataChannel.send(JSON.stringify({
      type: 'emotion_snapshot',
      emotions: appState.soulAI.emotions
    }));
  }
}

async function loadFaceModel() {
  if (window.faceModelLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  console.log('✅ Модель AI загружена');
  window.faceModelLoaded = true;
}

async function analyzeFacialEmotions(videoElement) {
  if (!videoElement?.srcObject) return;
  const detections = await faceapi.detectAllFaces(
    videoElement,
    new faceapi.TinyFaceDetectorOptions()
  ).withFaceExpressions();

  if (detections.length > 0) {
    const expressions = detections[0].expressions;
    updateEmotionStats(expressions);
    generateAISuggestion(expressions);
    sendEmotionSnapshot();
  }
}

function updateEmotionStats(expressions) {
  appState.soulAI.emotions.happy += expressions.happy || 0;
  appState.soulAI.emotions.neutral += expressions.neutral || 0;
  appState.soulAI.emotions.surprised += expressions.surprised || 0;
  appState.soulAI.emotions.focused += expressions.concentrating || 0;
}

function generateAISuggestion(expressions) {
  if (appState.soulAI.adviceCooldown) return;
  appState.soulAI.adviceCooldown = true;
  setTimeout(() => { appState.soulAI.adviceCooldown = false; }, 8000);

  const adviceEl = document.getElementById('ai-advice');
  const msgEl = document.getElementById('ai-message');
  if (!adviceEl || !msgEl) return;

  adviceEl.style.display = 'block';

  let message = "";
  let loveBonus = 0;

  if (expressions.happy > 0.7) {
    message = "Она улыбается — скажи комплимент про её глаза!";
    loveBonus = 0.5;
  } else if (expressions.neutral > 0.8) {
    message = "Она задумалась — спроси: 'О чём мечтаешь?'";
    loveBonus = 0.3;
  } else if (expressions.surprised > 0.6) {
    message = "Она удивлена — расскажи неожиданный факт о себе!";
    loveBonus = 0.4;
  } else {
    message = "Ваша химия — 10/10! Продолжайте в том же духе 💜";
    loveBonus = 0.2;
  }

  msgEl.textContent = message;
  if (loveBonus > 0) showLove(loveBonus);

  // Генерируем shareable-момент
  if (expressions.happy > 0.8 && !appState.sharedMoment) {
    setTimeout(() => {
      const videoUrl = "https://soulmine.video/share/abc123"; // Заглушка
      const shareText = `AI SoulMine говорит: мы совместимы на ${appState.coupleProgress.compatibility.toFixed(0)}%! 🎥 Посмотри, как мы смеялись вместе: ${videoUrl}`;
      showViralToast("🎥 AI создал для вас видео-момент! Поделитесь им!");
      appState.sharedMoment = true;
      unlockAchievement('shared_moment', 'Вирусный Момент', 'Вы поделились AI-совместимостью!', '🎥');
    }, 10000);
  }

  setTimeout(() => { adviceEl.style.display = 'none'; }, 6000);
}

function updateCompatibility() {
  const total = Object.values(appState.soulAI.emotions).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const happyRatio = appState.soulAI.emotions.happy / total;
  const focusedRatio = appState.soulAI.emotions.focused / total;

  if (happyRatio > 0.3 || focusedRatio > 0.3) {
    appState.coupleProgress.compatibility = Math.min(100, appState.coupleProgress.compatibility + 0.5);
    console.log(`❤️ Совместимость: ${appState.coupleProgress.compatibility.toFixed(1)}%`);
    sendCompatibilityUpdate();
    checkCoupleNFTs();
  }
}

async function startVideoCall(isIncoming = false) {
  if (appState.isCalling) return;

  const modal = document.getElementById('video-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  try {
    appState.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('local-video');
    if (localVideo) localVideo.srcObject = appState.localStream;

    if (!appState.peerConnection) {
      initPeerConnection();
    }

    appState.localStream.getTracks().forEach(track => appState.peerConnection.addTrack(track, appState.localStream));

    appState.peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };

    appState.peerConnection.onicecandidate = (event) => {
      if (event.candidate && appState.ws?.readyState === WebSocket.OPEN) {
        appState.ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          to: appState.callPartnerAddress
        }));
      }
    };

    if (!isIncoming) {
      if (!appState.callPartnerAddress) {
        const partner = prompt("Введите адрес кошелька собеседника:");
        if (!partner) {
          modal.style.display = 'none';
          return;
        }
        appState.callPartnerAddress = partner;
      }

      const offer = await appState.peerConnection.createOffer();
      await appState.peerConnection.setLocalDescription(offer);
      appState.ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer,
        to: appState.callPartnerAddress
      }));
      console.log('📤 Отправлено SDP-offer');
    }

    setTimeout(() => {
      const statusEl = document.getElementById('video-status');
      if (statusEl) statusEl.textContent = 'Соединение установлено';
      appState.callStartTime = new Date();
      startCallTimer();
      startMiningEffect();
      appState.userBehavior.usedVideo = true;
      appState.isCalling = true;
      appState.userBehavior.initiatedChats++;

      // 🔥 Первый звонок = ритуал посвящения
      if (appState.callHistory.length === 0) {
        setTimeout(() => {
          const ritualModal = document.createElement('div');
          ritualModal.className = 'modal';
          ritualModal.style.display = 'flex';
          ritualModal.innerHTML = `
            <div class="modal-content" style="text-align: center; background: linear-gradient(135deg, #0a0a2a, #1a1a4a);">
              <div style="font-size: 3rem; margin-bottom: 20px;">📞</div>
              <h2 style="color: #00D1B2; margin-bottom: 20px;">Поздравляем с первым звонком!</h2>
              <p>Вы официально — Гражданин SoulMine!</p>
              <div style="background: rgba(0, 209, 178, 0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
                <p><strong>🎁 Ваша награда:</strong></p>
                <p>+100 $LOVE</p>
                <p>NFT: "Гражданин SoulMine"</p>
              </div>
              <button onclick="document.body.removeChild(this.parentElement.parentElement); 
                showLove(100); 
                unlockAchievement('first_call', 'Первый Звонок', 'Совершил первый звонок в SoulMine!', '📞');
                " class="btn btn-primary" style="width: 100%;">✨ Получить награду</button>
            </div>
          `;
          document.body.appendChild(ritualModal);
        }, 5000);
      }
    }, 2000);

    setInterval(() => {
      if (appState.isCalling) {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo?.srcObject) {
          analyzeFacialEmotions(remoteVideo);
          updateCompatibility();
        }
      }
    }, 3000);

    await loadFaceModel();

  } catch (error) {
    console.error("❌ Ошибка в startVideoCall:", error);
    alert("Ошибка: " + error.message);
    if (modal) modal.style.display = 'none';
  }
}

function startCallTimer() {
  appState.callTimer = setInterval(() => {
    const now = new Date();
    const diff = new Date(now - appState.callStartTime);
    const mins = String(diff.getMinutes()).padStart(2, '0');
    const secs = String(diff.getSeconds()).padStart(2, '0');
    const timerEl = document.getElementById('video-timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function startMiningEffect() {
  appState.miningInterval = setInterval(() => {
    if (appState.isCalling) {
      showLove(0.3);
      triggerMiningEffect("+0.3 $LOVE");
      updateQuestProgress("complete_call");
    }
  }, 30000);
}

function endVideoCall() {
  if (appState.callTimer) clearInterval(appState.callTimer);
  if (appState.miningInterval) clearInterval(appState.miningInterval);
  if (appState.localStream) appState.localStream.getTracks().forEach(t => t.stop());
  if (appState.peerConnection) appState.peerConnection.close();
  appState.peerConnection = null;

  const durationMs = appState.callStartTime ? (new Date() - appState.callStartTime) : 0;
  const minutes = Math.floor(durationMs / 60000);

  const callRecord = {
    id: Date.now().toString(36),
    partner: appState.callPartnerAddress,
    startTime: appState.callStartTime?.toISOString() || new Date().toISOString(),
    duration: minutes,
    compatibility: appState.coupleProgress.compatibility,
    emotions: { ...appState.soulAI.emotions },
    earnedLove: minutes * 0.3
  };

  appState.callHistory.push(callRecord);
  saveCallHistory();
  showLove(callRecord.earnedLove);
  updateQuestProgress("complete_call");

  sendWebAppData({
    type: "call_ended",
    duration: minutes,
    compatibility: appState.coupleProgress.compatibility,
    messages: appState.userBehavior.messagesSent,
    earned: callRecord.earnedLove
  });

  const statusEl = document.getElementById('video-status');
  if (statusEl) statusEl.textContent = 'Вызов завершён';

  setTimeout(() => {
    const modal = document.getElementById('video-modal');
    if (modal) modal.style.display = 'none';
  }, 2000);

  appState.isCalling = false;
  appState.callStartTime = null;
  appState.callPartnerAddress = null;

  // 🔥 Разблокировка достижения за длительный звонок
  if (minutes >= 5) {
    unlockAchievement('long_call', 'Марафон Любви', 'Звонок длился 5+ минут!', '⏱️');
  }
}

function connectToSignalingServer() {
  if (appState.ws?.readyState === WebSocket.OPEN) return;

  appState.ws = new WebSocket(CONFIG.SIGNALING_SERVER_URL);

  appState.ws.onopen = () => {
    console.log('✅ Подключено к сигналь-серверу');
    if (appState.userAddress) {
      appState.ws.send(JSON.stringify({ type: 'register', address: appState.userAddress }));
    }
  };

  appState.ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log('📩 Получен сигнал:', data);
    switch (data.type) {
      case 'offer':
        await handleOffer(data);
        break;
      case 'answer':
        await handleAnswer(data);
        break;
      case 'candidate':
        await handleCandidate(data);
        break;
      case 'call_request':
        if (confirm(`Входящий звонок от ${data.from}! Принять?`)) {
          appState.callPartnerAddress = data.from;
          await startVideoCall(true);
          appState.ws.send(JSON.stringify({ type: 'call_accept', to: data.from }));
        } else {
          appState.ws.send(JSON.stringify({ type: 'call_reject', to: data.from }));
        }
        break;
      case 'random_match_found':
        appState.callPartnerAddress = data.partner;
        alert(`🎉 Найден собеседник!`);
        const searchingModal = document.getElementById('searching-modal');
        if (searchingModal) searchingModal.style.display = 'none';
        appState.isSearching = false;
        const matchBtn = document.getElementById('random-match-btn');
        if (matchBtn) matchBtn.textContent = '💘 Найти случайную пару';
        await startVideoCall(true);
        break;
      case 'ai_match_found':
        appState.callPartnerAddress = data.partner;
        alert(`🎯 AI нашел вам идеальную пару! Совместимость: ${(data.compatibilityScore * 100).toFixed(0)}%`);
        const searchingModalAI = document.getElementById('searching-modal');
        if (searchingModalAI) searchingModalAI.style.display = 'none';
        appState.isSearching = false;
        await startVideoCall(true);
        break;
      case 'ai_match_not_found':
        alert(data.message || 'Подходящих собеседников не найдено.');
        const searchingModalNotFound = document.getElementById('searching-modal');
        if (searchingModalNotFound) searchingModalNotFound.style.display = 'none';
        appState.isSearching = false;
        break;
    }
  };

  appState.ws.onclose = () => {
    console.log('🔌 Соединение закрыто');
    setTimeout(connectToSignalingServer, 3000);
  };

  appState.ws.onerror = (error) => {
    console.error('❌ Ошибка WebSocket:', error);
  };
}

async function handleOffer(data) {
  if (!appState.peerConnection) {
    initPeerConnection();
    appState.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    appState.localStream.getTracks().forEach(track => appState.peerConnection.addTrack(track, appState.localStream));
    appState.peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };
    appState.peerConnection.onicecandidate = (event) => {
      if (event.candidate && appState.ws?.readyState === WebSocket.OPEN) {
        appState.ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          to: data.from
        }));
      }
    };
  }

  await appState.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  const answer = await appState.peerConnection.createAnswer();
  await appState.peerConnection.setLocalDescription(answer);
  appState.ws.send(JSON.stringify({
    type: 'answer',
    sdp: answer,
    to: data.from
  }));
  console.log('📨 Отправлен answer');
}

async function handleAnswer(data) {
  await appState.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  console.log('✅ Получен answer, соединение установлено');
}

async function handleCandidate(data) {
  await appState.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

// === AR-фильтры ===
function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  appState.currentFilter = filter;
  const effects = document.getElementById('ar-effects');
  if (!effects) return;
  effects.innerHTML = '';
  if (filter === 'hearts') startHeartsEffect();
  else if (filter === 'ton') startTonEffect();
  else if (filter === 'party') startConfettiEffect();
}

function startHeartsEffect() {
  const effects = document.getElementById('ar-effects');
  if (!effects) return;
  setInterval(() => {
    if (appState.currentFilter !== 'hearts') return;
    const heart = document.createElement('img');
    heart.src = 'https://cdn-icons-png.flaticon.com/128/833/833472.png';
    heart.style.cssText = `position:absolute;width:${Math.random()*20+20}px;left:${Math.random()*80+10}%;top:80%;opacity:0;transition:top 3s ease,opacity 3s;`;
    effects.appendChild(heart);
    setTimeout(() => { heart.style.top = '10%'; heart.style.opacity = '1'; }, 100);
    setTimeout(() => { heart.remove(); }, 3000);
  }, 800);
}

function startTonEffect() {
  const effects = document.getElementById('ar-effects');
  if (!effects) return;
  const tonLogo = document.createElement('img');
  tonLogo.src = 'https://ton.org/assets/logo-circle.svg';
  tonLogo.style.cssText = 'position:absolute;top:10%;right:10%;width:60px;filter:drop-shadow(0 0 10px #00005B);opacity:0.9;';
  effects.appendChild(tonLogo);
}

function startConfettiEffect() {
  const effects = document.getElementById('ar-effects');
  if (!effects) return;
  ['🎉', '🎊', '✨', '🎈'].forEach(emoji => {
    setTimeout(() => {
      if (appState.currentFilter === 'party') {
        const confetti = document.createElement('div');
        confetti.textContent = emoji;
        confetti.style.cssText = `position:absolute;font-size:20px;left:${Math.random()*100}%;top:-20px;animation:fall-confetti 5s linear forwards;`;
        effects.appendChild(confetti);
      }
    }, Math.random() * 3000);
  });
}

function captureMoment() {
  const nftName = appState.currentFilter === 'hearts' ? "Магия любви" :
                  appState.currentFilter === 'ton' ? "Чемпион TON" :
                  appState.currentFilter === 'party' ? "Король вечеринки" : "Обычный момент";
  const image = { hearts: "❤️", ton: "💎", party: "🎉", default: "📷" }[appState.currentFilter] || "📷";
  showNFTModal({ name: nftName, image });
  showLove(5);
  updateQuestProgress("capture_moment");
  unlockAchievement('capture_moment', 'Фотограф Любви', 'Сделали снимок с AR-фильтром!', '📸');
}

// === Экспорт ===
window.initSwipeArea = initSwipeArea;
window.openChatWithCurrent = openChatWithCurrent;
window.startVoiceCallWithCurrent = startVoiceCallWithCurrent;
window.startVideoCallWithCurrent = startVideoCallWithCurrent;
window.sendWebAppData = sendWebAppData;
window.endVideoCall = endVideoCall;
window.connectToSignalingServer = connectToSignalingServer;