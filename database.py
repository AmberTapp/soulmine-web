# database.py
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, JSON, DateTime, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL не установлен в .env")

# Создаем движок
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True,nullable=False)  # ← Установлено unique=True
    username = Column(String, nullable=True)
    first_name = Column(String,nullable=True)
    ton_address = Column(String,nullable=True, unique=True)
    wallet_connected = Column(Boolean, default=False)
    internal_balance = Column(Float, default=0.0)
    compatibility = Column(Float, default=50.0)
    calls_count = Column(Integer,default=0)
    messages_count = Column(Integer,default=0)
    level = Column(Integer,default=1)
    referred_by = Column(String, ForeignKey('users.telegram_id'),nullable=True)
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(DateTime(timezone=True),onupdate=func.now())

    nfts = Column(JSON,default=list)
    quests = Column(JSON,default=list)
    call_history = Column(JSON,default=list)
    settings = Column(JSON,default=dict)

    referrals = relationship("User",remote_side=[telegram_id])

    # ЯВНО создаем уникальный индекс для telegram_id — ДО создания внешнего ключа
    __table_args__ = (
        Index('uq_telegram_id', 'telegram_id', unique=True),
    )

    def __repr__(self):
        return f"<User {self.telegram_id} | {self.ton_address}>"

# Создаем таблицы — теперь всё будет работать!
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()