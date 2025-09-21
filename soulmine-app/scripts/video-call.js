// === Глобальные переменные (уже объявлены в utils.js) ===

// === AI SoulMatch ===
const ALL_INTERESTS = [
  'Музыка', 'Кино', 'Спорт', 'Путешествия', 'Книги',
  'Игры', 'Web3', 'Криптовалюты', 'Искусство', 'Технологии',
  'Еда', 'Фитнес', 'Медитация', 'Образование', 'Бизнес'
];

function loadAIParams() {
  const saved = localStorage.getItem('soulmine_ai_params');
  return saved ? JSON.parse(saved) : null;
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
  if (!userAddress) {
    alert('Сначала подключите кошелек!');
    return;
  }
  if (isCalling) {
    alert('Завершите текущий звонок!');
    return;
  }
  if (isSearching) {
    ws.send(JSON.stringify({ type: 'cancel_search' }));
    isSearching = false;
    return;
  }

  isSearching = true;

  const searchingModal = document.getElementById('searching-modal');
  if (searchingModal) searchingModal.style.display = 'flex';

  ws.send(JSON.stringify({
    type: 'find_ai_soulmate',
    address: userAddress,
    params: params
  }));

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

// === Система свайпов для поиска пары ===
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
  if (!userAddress) {
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
    <img src="./models/${user.image}.png" alt="${user.name}">
    <div class="card-info">
      <h3>${user.name}, ${user.age}</h3>
      <p>${user.interests}</p>
      <p style="font-size: 0.8rem; opacity: 0.7;">${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}</p>
    </div>
  `;
  card.addEventListener('mousedown', startDrag);
  card.addEventListener('touchstart', startDrag);
  document.getElementById('swipe-area').appendChild(card);
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
    setTimeout(() => {
      handleLike();
    }, 300);
  } else if (deltaX < -100) {
    card.classList.add('swiping-left');
    setTimeout(() => {
      handleDislike();
    }, 300);
  } else {
    card.style.transform = 'translateX(0) rotate(0deg)';
    card.style.opacity = '1';
  }
}

function handleLike() {
  const user = DEMO_USERS[currentCardIndex];
  showLove(1.0);
  // Отправляем данные в Telegram-бот
  sendWebAppData({
    type: "swipe",
    action: "like",
    partner: user.wallet
  });
  alert(`❤️ Вам понравился ${user.name}!`);
  showNextCard();
}

function handleDislike() {
  const user = DEMO_USERS[currentCardIndex];
  showLove(0.1);
  // Отправляем данные в Telegram-бот
  sendWebAppData({
    type: "swipe",
    action: "dislike",
    partner: user.wallet
  });
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

// === Действия с текущей карточкой ===
function openChatWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  callPartnerAddress = user.wallet;
  openChat();
}

function startVoiceCallWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  callPartnerAddress = user.wallet;
  startVideoCall(); // В демо-версии используем видео
}

function startVideoCallWithCurrent() {
  if (!currentCardElement) {
    alert('Нет активной карточки!');
    return;
  }
  const index = parseInt(currentCardElement.dataset.index);
  const user = DEMO_USERS[index];
  callPartnerAddress = user.wallet;
  startVideoCall();
}

// === Функция для отправки данных в Telegram-бот ===
function sendWebAppData(data) {
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
      console.log('✅ Данные отправлены в Telegram-бот:', data);
    } catch (error) {
      console.error('❌ Ошибка отправки данных в Telegram-бот:', error);
    }
  } else {
    console.warn('⚠️ Telegram WebApp API не доступно');
  }
}

// === Остальная логика видеозвонков ===
function initPeerConnection() {
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  peerConnection = new RTCPeerConnection(config);
  console.log('✅ WebRTC соединение инициализировано');

  peerConnection.ondatachannel = (event) => {
    setupDataChannel(event.channel);
  };
}

function setupDataChannel(channel) {
  dataChannel = channel;
  channel.onopen = () => {
    console.log('📡 DataChannel открыт');
    sendCompatibilityUpdate();
    sendEmotionSnapshot();
  };
  channel.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log('📩 Получено по DataChannel:', msg);
    switch (msg.type) {
      case 'compatibility_update':
        coupleProgress.compatibility = msg.value;
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
        callPartnerAddress = msg.partner;
        alert(`🎯 AI нашел вам идеальную пару! Совместимость: ${(msg.compatibilityScore * 100).toFixed(0)}%`);
        const searchingModal = document.getElementById('searching-modal');
        if (searchingModal) searchingModal.style.display = 'none';
        isSearching = false;
        startVideoCall(true);
        break;
      case 'ai_match_not_found':
        alert(msg.message || 'Подходящих собеседников не найдено. Попробуйте позже.');
        const searchingModal2 = document.getElementById('searching-modal');
        if (searchingModal2) searchingModal2.style.display = 'none';
        isSearching = false;
        break;
    }
  };
  channel.onclose = () => {
    console.log('🔌 DataChannel закрыт');
  };
}

function sendCompatibilityUpdate() {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({
      type: 'compatibility_update',
      value: coupleProgress.compatibility
    }));
  }
}

function sendEmotionSnapshot() {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({
      type: 'emotion_snapshot',
      emotions: soulAI.emotions
    }));
  }
}

async function loadFaceModel() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  console.log('✅ Модель AI загружена');
}

async function analyzeFacialEmotions(videoElement) {
  if (!videoElement || !videoElement.srcObject) return;
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
  soulAI.emotions.happy += expressions.happy || 0;
  soulAI.emotions.neutral += expressions.neutral || 0;
  soulAI.emotions.surprised += expressions.surprised || 0;
  soulAI.emotions.focused += expressions.concentrating || 0;
}

function generateAISuggestion(expressions) {
  if (soulAI.adviceCooldown) return;
  soulAI.adviceCooldown = true;
  setTimeout(() => { soulAI.adviceCooldown = false; }, 8000);
  const adviceEl = document.getElementById('ai-advice');
  const msgEl = document.getElementById('ai-message');
  if (!adviceEl || !msgEl) return;
  adviceEl.style.display = 'block';
  if (expressions.happy > 0.7) {
    msgEl.textContent = "Она улыбается — продолжай шутить!";
    showLove(0.5);
  } else if (expressions.neutral > 0.8) {
    msgEl.textContent = "Она сосредоточена — задай личный вопрос";
  } else if (expressions.surprised > 0.6) {
    msgEl.textContent = "Она удивлена — развивай тему!";
  } else {
    msgEl.textContent = "Отличная химия! Продолжайте 👏";
  }
  setTimeout(() => { adviceEl.style.display = 'none'; }, 6000);
}

function updateCompatibility() {
  const total = soulAI.emotions.happy + soulAI.emotions.neutral + soulAI.emotions.surprised + soulAI.emotions.focused;
  if (total === 0) return;
  const happyRatio = soulAI.emotions.happy / total;
  const focusedRatio = soulAI.emotions.focused / total;
  if (happyRatio > 0.3 || focusedRatio > 0.3) {
    coupleProgress.compatibility = Math.min(100, coupleProgress.compatibility + 0.5);
    console.log(`❤️ Совместимость: ${coupleProgress.compatibility.toFixed(1)}%`);
    sendCompatibilityUpdate();
    checkCoupleNFTs();
  }
}

async function startVideoCall(isIncoming = false) {
  if (isCalling) return;
  const modal = document.getElementById('video-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('local-video');
    if (localVideo) localVideo.srcObject = localStream;

    if (!peerConnection) {
      initPeerConnection();
    }

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          to: callPartnerAddress
        }));
      }
    };

    if (isIncoming) {
      // Ждем offer через ws
    } else {
      if (!callPartnerAddress) {
        const partner = prompt("Введите адрес кошелька собеседника для звонка:");
        if (!partner) {
          modal.style.display = 'none';
          return;
        }
        callPartnerAddress = partner;
      }
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer,
        to: callPartnerAddress
      }));
      console.log('📤 Отправлено SDP-offer');
    }

    setTimeout(() => {
      const statusEl = document.getElementById('video-status');
      if (statusEl) statusEl.textContent = 'Соединение установлено';
      callStartTime = new Date();
      startCallTimer();
      startMiningEffect();
      userBehavior.usedVideo = true;
      isCalling = true;
      if (callHistory.length === 0) {
        awardCitizenNFT();
      }
    }, 2000);

    setInterval(() => {
      if (isCalling) {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo && remoteVideo.srcObject) {
          analyzeFacialEmotions(remoteVideo);
          updateCompatibility();
        }
      }
    }, 3000);

    if (!window.faceModelLoaded) {
      await loadFaceModel();
      window.faceModelLoaded = true;
    }

  } catch (error) {
    console.error("❌ Ошибка в startVideoCall:", error);
    alert("Ошибка: " + error.message);
    if (modal) modal.style.display = 'none';
  }
}

function startCallTimer() {
  callTimer = setInterval(() => {
    const now = new Date();
    const diff = new Date(now - callStartTime);
    const mins = String(diff.getMinutes()).padStart(2, '0');
    const secs = String(diff.getSeconds()).padStart(2, '0');
    const timerEl = document.getElementById('video-timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function startMiningEffect() {
  miningInterval = setInterval(() => {
    if (isCalling) {
      showLove(0.3);
      triggerMiningEffect("+0.3 $LOVE");
    }
  }, 30000);
}

function endVideoCall() {
  if (callTimer) clearInterval(callTimer);
  if (miningInterval) clearInterval(miningInterval);
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (peerConnection) peerConnection.close();
  peerConnection = null;

  const durationMs = callStartTime ? (new Date() - callStartTime) : 0;
  const minutes = Math.floor(durationMs / 60000);

  const callRecord = {
    id: Date.now().toString(36),
    partner: callPartnerAddress,
    startTime: callStartTime?.toISOString() || new Date().toISOString(),
    duration: minutes,
    compatibility: coupleProgress.compatibility,
    emotions: { ...soulAI.emotions },
    earnedLove: minutes * 0.3
  };

  callHistory.push(callRecord);
  saveCallHistory();
  addLove(callRecord.earnedLove);
  upgradeCitizenLevel();

  // Отправляем данные в Telegram-бот
  sendWebAppData({
    type: "call_ended",
    duration: minutes,
    compatibility: coupleProgress.compatibility,
    messages: userBehavior.messagesSent,
    earned: callRecord.earnedLove
  });

  const statusEl = document.getElementById('video-status');
  if (statusEl) statusEl.textContent = 'Вызов завершён';

  setTimeout(() => {
    const modal = document.getElementById('video-modal');
    if (modal) modal.style.display = 'none';
  }, 2000);

  isCalling = false;
  callStartTime = null;
  callPartnerAddress = null;
}

function connectToSignalingServer() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(SIGNALING_SERVER_URL);

  ws.onopen = () => {
    console.log('✅ Подключено к сигналь-серверу');
    if (userAddress) {
      ws.send(JSON.stringify({ type: 'register', address: userAddress }));
    }
  };

  ws.onmessage = async (event) => {
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
          callPartnerAddress = data.from;
          await startVideoCall(true);
          ws.send(JSON.stringify({ type: 'call_accept', to: data.from }));
        } else {
          ws.send(JSON.stringify({ type: 'call_reject', to: data.from }));
        }
        break;
      case 'random_match_found':
        callPartnerAddress = data.partner;
        alert(`🎉 Найден собеседник! Начинаем звонок...`);
        const searchingModal = document.getElementById('searching-modal');
        if (searchingModal) searchingModal.style.display = 'none';
        isSearching = false;
        const matchBtn = document.getElementById('random-match-btn');
        if (matchBtn) matchBtn.textContent = '💘 Найти случайную пару';
        await startVideoCall(true);
        break;
      case 'find_ai_soulmate':
        // Обработка на стороне сервера
        break;
      case 'ai_match_found':
        callPartnerAddress = data.partner;
        alert(`🎯 AI нашел вам идеальную пару! Совместимость: ${(data.compatibilityScore * 100).toFixed(0)}%`);
        const searchingModalAI = document.getElementById('searching-modal');
        if (searchingModalAI) searchingModalAI.style.display = 'none';
        isSearching = false;
        await startVideoCall(true);
        break;
      case 'ai_match_not_found':
        alert(data.message || 'Подходящих собеседников не найдено. Попробуйте позже.');
        const searchingModalNotFound = document.getElementById('searching-modal');
        if (searchingModalNotFound) searchingModalNotFound.style.display = 'none';
        isSearching = false;
        break;
    }
  };

  ws.onclose = () => {
    console.log('🔌 Соединение с сервером закрыто');
    setTimeout(connectToSignalingServer, 3000);
  };

  ws.onerror = (error) => {
    console.error('❌ Ошибка WebSocket:', error);
  };
}

async function handleOffer(data) {
  if (!peerConnection) {
    initPeerConnection();
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          to: data.from
        }));
      }
    };
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  ws.send(JSON.stringify({
    type: 'answer',
    sdp: answer,
    to: data.from
  }));
  console.log('📨 Отправлен answer');
}

async function handleAnswer(data) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  console.log('✅ Получен answer, соединение установлено');
}

async function handleCandidate(data) {
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

// === AR-фильтры ===
function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentFilter = filter;
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
    if (currentFilter !== 'hearts') return;
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
      if (currentFilter === 'party') {
        const confetti = document.createElement('div');
        confetti.textContent = emoji;
        confetti.style.cssText = `position:absolute;font-size:20px;left:${Math.random()*100}%;top:-20px;animation:fall-confetti 5s linear forwards;`;
        effects.appendChild(confetti);
      }
    }, Math.random() * 3000);
  });
}

function captureMoment() {
  const nftName = currentFilter === 'hearts' ? "Магия любви" :
                  currentFilter === 'ton' ? "Чемпион TON" :
                  currentFilter === 'party' ? "Король вечеринки" : "Обычный момент";
  const image = { hearts: "❤️", ton: "💎", party: "🎉", default: "📷" }[currentFilter] || "📷";
  showNFTModal({ name: nftName, image });
  addLove(5);
}

// === Экспортируем функции для глобального доступа ===
window.initSwipeArea = initSwipeArea;
window.openChatWithCurrent = openChatWithCurrent;
window.startVoiceCallWithCurrent = startVoiceCallWithCurrent;
window.startVideoCallWithCurrent = startVideoCallWithCurrent;
window.sendWebAppData = sendWebAppData;