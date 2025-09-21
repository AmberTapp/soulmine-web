// ton.js

const connector = new window.TonConnect.UI.Connector({
  manifestUrl: TON_MANIFEST_URL
});

window.connector = connector;

const connectBtn = document.getElementById('ton-connect-button');
const walletInfo = document.getElementById('wallet-info');
const profileBalance = document.getElementById('profile-balance');
const nftContainer = document.getElementById('nft-container');
const coupleNftContainer = document.getElementById('couple-nft-container');
const coupleNftSection = document.getElementById('couple-nft-section');

async function updateConnectionState() {
  if (connector.connected) {
    userAddress = connector.wallet.account.address;
    connectBtn.textContent = "✅ Подключено";
    connectBtn.classList.add('connected');
    walletInfo.style.display = 'block';
    walletInfo.innerHTML = `<strong>Адрес:</strong> ${userAddress.slice(0, 8)}...${userAddress.slice(-6)}`;
    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) addressDisplay.textContent = `${userAddress.slice(0, 8)}...${userAddress.slice(-6)}`;
    const balance = await getLoveBalance(userAddress);
    profileBalance.textContent = `${balance} $LOVE`;
    connectToSignalingServer();

    // Отправляем данные в Telegram-бот при подключении кошелька
    if (window.sendWebAppData) {
      window.sendWebAppData({
        type: "wallet_connected",
        address: userAddress,
        balance: parseFloat(balance)
      });
    }

    setTimeout(() => {
      const deepLink = `https://t.me/LoveSoulMine_Bot?start=wallet_${encodeURIComponent(userAddress)}`;
      window.open(deepLink, '_blank');
    }, 2000);
  } else {
    userAddress = null;
    connectBtn.textContent = "🔐 Подключить TON Wallet";
    connectBtn.classList.remove('connected');
    walletInfo.style.display = 'none';
    profileBalance.textContent = "Загрузка...";
    nftContainer.innerHTML = '<div class="nft-empty">Подключите кошелёк</div>';
    coupleNftSection.style.display = 'none';
  }
}

connector.onStatusChange(updateConnectionState);

async function getLoveBalance(address) {
  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`);
    const data = await response.json();
    const balances = data.balances || [];
    for (const jet of balances) {
      if (jet.jetton?.address === JETTON_MASTER_ADDRESS) {
        const amount = parseInt(jet.balance || "0");
        const decimals = jet.jetton.decimals || 9;
        return (amount / (10 ** decimals)).toFixed(4);
      }
    }
    return "0.0000";
  } catch (error) {
    console.error("Ошибка получения баланса:", error);
    return "—";
  }
}

async function getLoveBalanceRaw(address) {
  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/jettons`);
    const data = await response.json();
    const balances = data.balances || [];
    for (const jet of balances) {
      if (jet.jetton?.address === JETTON_MASTER_ADDRESS) {
        const amount = BigInt(jet.balance || "0");
        const decimals = jet.jetton.decimals || 9;
        return Number(amount) / (10 ** decimals);
      }
    }
    return 0;
  } catch (error) {
    console.error("Ошибка получения баланса:", error);
    return 0;
  }
}

async function loadNFTs(address) {
  const container = document.getElementById('nft-container-profile') || document.getElementById('nft-container');
  if (!container) return;
  container.innerHTML = '<div class="nft-empty">Загрузка NFT...</div>';
  try {
    const response = await fetch(`https://tonapi.io/v2/nfts?account=${address}&limit=50`);
    const data = await response.json();
    const nfts = data.nft_items || [];
    if (nfts.length === 0) {
      container.innerHTML = '<div class="nft-empty">У вас пока нет NFT</div>';
      return;
    }
    container.innerHTML = '';
    nfts.forEach(nft => {
      const image = nft.previews?.find(p => p.resolution === '100x100')?.url || nft.previews?.[0]?.url || 'https://via.placeholder.com/100';
      const name = nft.metadata?.name || 'Без имени';
      const div = document.createElement('div');
      div.className = 'nft-item';
      div.innerHTML = `
        <img src="${image}" class="nft-img" alt="${name}" onerror="this.src='https://via.placeholder.com/100'">
        <div class="nft-overlay">${name}</div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<div class="nft-empty">Ошибка загрузки NFT</div>';
    console.error("Ошибка:", error);
  }
}

function showPartnerPreview() {
  const models = ['model01', 'model02', 'model03', 'model04', 'model05', 'model06', 'model11', 'model44', 'model66'];
  const randomModel = models[Math.floor(Math.random() * models.length)];
  const img = document.getElementById('partner-preview');
  if (img) {
    img.src = `./models/${randomModel}.png`;
    img.style.display = 'block';
  }
}

if (connectBtn) {
  connectBtn.onclick = async () => {
    try {
      if (!connector.connected) await connector.connect();
      else await connector.disconnect();
      updateConnectionState();
    } catch (e) { alert("Ошибка: " + e.message); }
  };
}

window.getLoveBalance = getLoveBalance;
window.getLoveBalanceRaw = getLoveBalanceRaw;
window.loadNFTs = loadNFTs;
window.showPartnerPreview = showPartnerPreview;
window.updateConnectionState = updateConnectionState;