# api.py - Модуль для работы с TON API и Jetton-балансом
import requests
import time

# Базовый URL TON API (бесплатный, без ключа)
TONAPI_URL = "https://tonapi.io/v2"

# Адрес Jetton Master ($LOVE) — замени при необходимости
JETTON_MASTER_ADDRESS = "EQAf1n9pHB4gITeBj4VA6jYKa4QKAs7e1z55SQY3DnYme-Yj"

# Кэш балансов (чтобы не перегружать API)
_balance_cache = {}
CACHE_TTL = 300  # 5 минут


def get_jetton_balance(user_ton_address: str) -> float:
    """
    Возвращает баланс токена $LOVE по адресу кошелька.
    :param user_ton_address: str (например, UQB...)
    :return: float (например, 123.456789)
    """
    now = time.time()

    # Проверяем кэш
    if user_ton_address in _balance_cache:
        cached_time, balance = _balance_cache[user_ton_address]
        if now - cached_time < CACHE_TTL:
            return balance

    try:
        # Запрос к tonapi.io
        url = f"{TONAPI_URL}/accounts/{user_ton_address}/jettons"
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code != 200:
            print(f"❌ TON API ошибка {response.status_code}: {response.text}")
            return 0.0

        data = response.json().get("balances", [])
        love_balance = 0.0

        for jetton in 
            # Сравниваем адрес Jetton Master
            if jetton.get("jetton", {}).get("address") == JETTON_MASTER_ADDRESS:
                amount_str = jetton.get("balance", "0")
                decimals = jetton.get("jetton", {}).get("decimals", 9)

                try:
                    amount = int(amount_str)
                    love_balance = amount / (10 ** decimals)
                except ValueError:
                    love_balance = 0.0
                break

        # Сохраняем в кэш
        _balance_cache[user_ton_address] = (now, love_balance)
        return love_balance

    except requests.exceptions.RequestException as e:
        print(f"🌐 Ошибка сети при запросе к TON API: {e}")
        return 0.0
    except Exception as e:
        print(f"🔴 Неизвестная ошибка при получении баланса: {e}")
        return 0.0


# === Тестирование (раскомментируй, чтобы проверить) ===
if __name__ == "__main__":
    test_address = "UQCvDWfC2cM8uR5FhLxGd1aXtVqoZbH7N6T3m4Y8s9W7R2P1"  # Пример
    print(f"🔍 Проверяю баланс $LOVE для {test_address}...")
    bal = get_jetton_balance(test_address)
    print(f"💰 Баланс $LOVE: {bal:.6f}")