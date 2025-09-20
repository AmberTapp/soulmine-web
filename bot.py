from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    CallbackQueryHandler,
    MessageHandler,
    filters,
)
import logging
import json
import os
import requests
from dotenv import load_dotenv

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

load_dotenv()

# === НАСТРОЙКИ ===
TOKEN = os.getenv("BOT_TOKEN")
JETTON_MASTER_ADDRESS = os.getenv("JETTON_MASTER_ADDRESS", "EQAf1n9pHB4gITeBj4VA6jYKa4QKAs7e1z5SSQY3DnYme-Yj")
TMA_URL = "https://soulmine-web-3xmk.vercel.app/"
CHANNEL_ID = "@SoulMineNews"
TONAPI_KEY = os.getenv("TONAPI_KEY", "")

# === РАБОТА С ДАННЫМИ ===
def load_data():
    if os.path.exists("users.json"):
        with open("users.json", 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_data(data):
    with open("users.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_user(data, user_id):
    str_id = str(user_id)
    if str_id not in data:
        data[str_id] = {
            "balance": 0.0,
            "referrals": [],
            "referred_by": None,
            "wallet_connected": False,
            "ton_address": None,
            "nfts": [],
            "compatibility": 50,
            "calls": 0,
            "messages": 0
        }
    return data[str_id]


# === TON API: Получение баланса $LOVE ===
def get_jetton_balance(ton_address):
    """Получает баланс $LOVE по адресу через TONAPI"""
    url = f"https://tonapi.io/v2/accounts/{ton_address}/jettons"
    headers = {"Authorization": f"Bearer {TONAPI_KEY}"} if TONAPI_KEY else {}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        for jetton in data.get("balances", []):
            if jetton.get("jetton", {}).get("address") == JETTON_MASTER_ADDRESS:
                amount = int(jetton.get("balance", 0))
                decimals = jetton.get("jetton", {}).get("decimals", 9)
                return round(amount / (10 ** decimals), 4)
        return 0.0
    except Exception as e:
        logger.error(f"Ошибка получения баланса: {e}")
        return 0.0


# === КОМАНДЫ ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    data = load_data()

    if context.args:
        arg = context.args[0]
        if arg.startswith("wallet_"):
            ton_address = arg.replace("wallet_", "")
            user_info = get_user(data, user.id)
            if not user_info["wallet_connected"]:
                user_info["wallet_connected"] = True
                user_info["ton_address"] = ton_address
                user_info["balance"] += 500.0
                save_data(data)

                try:
                    await context.bot.send_message(
                        chat_id=CHANNEL_ID,
                        text=f"🎉 Новый участник подключил кошелёк!\n"
                             f"👤 ID: `{user.id}`\n"
                             f"🔗 Адрес: `{ton_address[:10]}...{ton_address[-6:]}`\n"
                             f"💰 Получил 500 $LOVE!\n\n"
                             f"Присоединяйтесь: @LoveSoulMine_Bot",
                        parse_mode="Markdown"
                    )
                except Exception as e:
                    logger.error(f"Не удалось отправить в канал: {e}")

                await update.message.reply_text(
                    f"✅ Кошелёк подключён!\n\n"
                    f"📌 Адрес: `{ton_address[:10]}...{ton_address[-6:]}`\n"
                    f"💰 Вы получили 500 $LOVE за регистрацию!\n\n"
                    f"🎁 Всем первым 10 000 — аирдроп 500 $LOVE!\n"
                    f"💡 Используйте /nft, /profile, /mine",
                    parse_mode="Markdown"
                )
            else:
                await update.message.reply_text("Вы уже подключили кошелёк!")
            return

        try:
            ref_id = int(arg)
            if ref_id != user.id and str(ref_id) in data:
                user_info = get_user(data, user.id)
                if user_info["referred_by"] is None:
                    user_info["referred_by"] = ref_id
                    data[str(ref_id)]["referrals"].append(user.id)
                    data[str(ref_id)]["balance"] += 50.0
                    save_data(data)
                    await update.message.reply_text("🎉 Вы были приглашены! Вам начислено 50 $LOVE!")
        except ValueError:
            pass

    keyboard = [
        [InlineKeyboardButton("👤 Профиль", callback_data='profile')],
        [InlineKeyboardButton("💰 Баланс $LOVE", callback_data='balance')],
        [InlineKeyboardButton("⛏️ Майнинг", callback_data='mine')],
        [InlineKeyboardButton("❤️ Совместимость", callback_data='compatibility')],
        [InlineKeyboardButton("🔗 Реферальная ссылка", callback_data='referral')],
        [InlineKeyboardButton("💎 Мои NFT", callback_data='nfts')],
        [InlineKeyboardButton("🔐 Подключить кошелёк", url=TMA_URL)],
        [InlineKeyboardButton("📢 Новости", url="https://t.me/SoulMineNews")],
        [InlineKeyboardButton("❓ Помощь", callback_data='help')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"🌟 Привет, {user.first_name}!\n\n"
        f"Добро пожаловать в **SoulMineBot** — где ты находишь любовь и добываешь крипту $LOVE на TON!\n\n"
        f"💡 Уже скоро: видео-знакомства, AI-анализ эмоций, DAO-голосование, NFT-коллекции.\n\n"
        f"Выбери действие:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user = query.from_user
    data = load_data()
    user_info = get_user(data, user.id)

    if query.data == 'profile':
        balance = user_info["balance"]
        referrals = len(user_info["referrals"])
        wallet = user_info["ton_address"] or "не подключён"
        calls = user_info["calls"]
        msg = user_info["messages"]
        comp = user_info["compatibility"]

        await query.edit_message_text(
            f"📊 **Профиль**\n\n"
            f"🆔 ID: `{user.id}`\n"
            f"💰 Внутренний баланс: `{balance:.2f}` $LOVE\n"
            f"👥 Рефералы: `{referrals}`\n"
            f"📞 Звонков: `{calls}`\n"
            f"💬 Сообщений: `{msg}`\n"
            f"❤️ Совместимость: `{comp}%`\n"
            f"👛 Кошелёк: `{wallet}`\n\n"
            f"📌 Ваша реферальная награда: 20% от добычи друзей!",
            parse_mode="Markdown"
        )

    elif query.data == 'balance':
        if not user_info["ton_address"]:
            await query.edit_message_text(
                "👛 Вы ещё не подключили кошелёк!\n"
                "Перейдите по кнопке ниже → Подключить кошелёк",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔐 Подключить", url=TMA_URL)]]),
                parse_mode="Markdown"
            )
            return
        try:
            live_balance = get_jetton_balance(user_info["ton_address"])
            await query.edit_message_text(
                f"💰 **Реальный баланс $LOVE**\n\n"
                f"🔹 На кошельке: `{live_balance:.4f}` $LOVE\n"
                f"📌 Адрес: `{user_info['ton_address'][:10]}...{user_info['ton_address'][-6:]}`\n\n"
                f"🔄 Данные обновляются каждые 5 минут.\n"
                f"🔗 Проверить: https://tonviewer.com/{user_info['ton_address']}",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("👁️ Посмотреть на TONViewer", url=f"https://tonviewer.com/{user_info['ton_address']}")]
                ])
            )
        except Exception as e:
            await query.edit_message_text(f"❌ Ошибка загрузки баланса: {str(e)}")

    elif query.data == 'mine':
        await query.edit_message_text(
            "🚀 **Майнинг $LOVE**\n\n"
            "Вы начинаете добывать токены!\n\n"
            "🔹 Каждые 5 минут активного чата — +0.5 $LOVE\n"
            "🔹 За каждый свайп — +0.1 $LOVE\n"
            "🔹 За диалог 10+ сообщений — +2 $LOVE\n"
            "🔹 За видеозвонок — +3 $LOVE/мин\n\n"
            "💬 Найдите пару — и майнинг ускорится в 2 раза!\n\n"
            "👉 Перейдите в Mini App для начала: 👇",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📲 Открыть Mini App", url=TMA_URL)]
            ]),
            parse_mode="Markdown"
        )

    elif query.data == 'compatibility':
        comp = user_info["compatibility"]
        calls = user_info["calls"]
        msg = user_info["messages"]
        status = "🔥 Высокая" if comp > 80 else "💖 Хорошая" if comp > 50 else "😐 Низкая"

        await query.edit_message_text(
            f"❤️ **AI-Совместимость**\n\n"
            f"📈 Текущая совместимость: `{comp}%`\n"
            f"💬 Сообщений: `{msg}`\n"
            f"📞 Звонков: `{calls}`\n"
            f"🎯 Статус: {status}\n\n"
            f"💡 Совместимость растёт при:\n"
            f"• Частых сообщениях\n"
            f"• Длительных звонках\n"
            f"• Эмоциональной химии (анализ лиц)\n\n"
            f"👉 Начните звонить в Mini App!",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📲 Открыть Mini App", url=TMA_URL)]
            ]),
            parse_mode="Markdown"
        )

    elif query.data == 'referral':
        ref_link = f"https://t.me/LoveSoulMine_Bot?start={user.id}"
        await query.edit_message_text(
            f"🔗 **Реферальная ссылка**\n\n"
            f"Приглашайте друзей и получайте:\n"
            "🎁 50 $LOVE за каждого первого уровня\n"
            "💸 20% от их добычи (все время)\n\n"
            f"👉 `{ref_link}`\n\n"
            f"📎 Поделитесь ссылкой в группах, каналах, друзьям!",
            parse_mode="Markdown"
        )

    elif query.data == 'nfts':
        nfts = user_info["nfts"]
        if not nfts:
            await query.edit_message_text(
                "💎 У вас пока нет NFT!\n\n"
                "Получите их за:\n"
                "• Первый звонок — 🏛️ Гражданин SoulMine\n"
                "• 50 сообщений — 💬 Болтун\n"
                "• 30 дней активности — 🏆 Пара месяца\n"
                "• 99% совместимости — ⚡ Вечная совместимость\n\n"
                "👉 Начните взаимодействовать в Mini App!",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📲 Открыть Mini App", url=TMA_URL)]
                ])
            )
        else:
            nft_list = "\n".join([f"• {n}" for n in nfts])
            await query.edit_message_text(
                f"💎 **Ваши NFT**\n\n{nft_list}\n\n"
                f"✨ Получайте новые NFT за активность в Mini App!",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📲 Открыть Mini App", url=TMA_URL)]
                ])
            )

    elif query.data == 'help':
        await query.edit_message_text(
            "❓ **Помощь по SoulMineBot**\n\n"
            "🛠 Бот работает на блокчейне TON.\n"
            "💎 Токен: `$LOVE`\n"
            f"🔗 Адрес Jetton: `{JETTON_MASTER_ADDRESS}`\n\n"
            f"🌐 Mini App: {TMA_URL}\n\n"
            "🤝 Поддержка: @your_support_username (замените на реальный)",
            parse_mode="Markdown"
        )


async def news(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📰 **Последние новости SoulMine**:\n\n"
        "🚀 Бот запущен!\n"
        "🎁 Первым 10 000 — 500 $LOVE в подарок!\n"
        "💡 Видеовызовы с AI-анализом эмоций работают!\n"
        "❤️ Совместимость по анализу лица — теперь в Mini App!\n"
        "🏛️ DAO голосование — скоро!\n"
        "💎 NFT-коллекция «Граждане SoulMine» — выдана!\n\n"
        "Подпишитесь на канал: @SoulMineNews",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🔔 Подписаться на канал", url="https://t.me/SoulMineNews")]
        ]),
        parse_mode="Markdown"
    )


async def balance_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    data = load_data()
    user_info = get_user(data, update.effective_user.id)
    if not user_info["ton_address"]:
        await update.message.reply_text(
            "👛 Подключите кошелёк: /start → Нажмите 'Подключить кошелёк'",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔐 Перейти", url=TMA_URL)]]),
            parse_mode="Markdown"
        )
        return
    try:
        live_balance = get_jetton_balance(user_info["ton_address"])
        await update.message.reply_text(
            f"💰 Ваш баланс $LOVE: `{live_balance:.4f}`",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("👁️ Посмотреть на TONViewer", url=f"https://tonviewer.com/{user_info['ton_address']}")]
            ])
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {e}")


async def ref_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    ref_link = f"https://t.me/LoveSoulMine_Bot?start={user_id}"
    await update.message.reply_text(
        f"🔗 Ваша реферальная ссылка:\n{ref_link}\n\n"
        "Пригласи друзей — получи 50 $LOVE + 20% от их добычи!",
        parse_mode="Markdown"
    )


# === ОБРАБОТКА СООБЩЕНИЙ (с защитой от None) ===
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None or update.message.text is None:
        return

    text = update.message.text.lower()
    if any(word in text for word in ["привет", "hi", "hello"]):
        await update.message.reply_text("Привет! Я SoulMineBot. Используй /start для начала.")
    elif "love" in text:
        await update.message.reply_text("❤️ $LOVE уже в твоём сердце… и скоро будет в кошельке!")


# === ОБРАБОТКА ОШИБОК ===
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error(f"Update {update} caused error {context.error}")


# === ЗАПУСК ===
def main() -> None:
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("balance", balance_cmd))
    application.add_handler(CommandHandler("ref", ref_cmd))
    application.add_handler(CommandHandler("news", news))

    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    application.add_error_handler(error_handler)

    print("✅ SoulMineBot запущен!")
    print(f"🔗 Jetton $LOVE: https://tonviewer.com/{JETTON_MASTER_ADDRESS}")
    print(f"🌐 Mini App: {TMA_URL}")
    print(f"📢 Канал: {CHANNEL_ID}")

    application.run_polling()


if __name__ == '__main__':

    main()
