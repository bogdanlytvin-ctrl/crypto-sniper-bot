import os
import logging
import time
from collections import defaultdict
from dotenv import load_dotenv
from telegram import Update, BotCommand
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import anthropic

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

anthropic_client: anthropic.AsyncAnthropic | None = None

# conversation_history stores per-user message history: {user_id: [{"role": ..., "content": ...}]}
conversation_history: dict[int, list] = {}

MAX_HISTORY = 20  # max messages per user to keep in context
MAX_MESSAGE_LENGTH = 4000  # max characters per user message
RATE_LIMIT_MESSAGES = 5   # max messages per window
RATE_LIMIT_WINDOW = 60    # window size in seconds

# rate_limit_tracker: {user_id: [timestamp, ...]}
rate_limit_tracker: dict[int, list[float]] = defaultdict(list)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    welcome_text = (
        f"Привіт, {user.first_name}! 👋\n\n"
        "Я — AI-асистент на базі Claude від Anthropic.\n"
        "Ставте мені будь-які запитання, і я постараюся допомогти!\n\n"
        "Просто напишіть своє повідомлення, щоб розпочати розмову."
    )
    await update.message.reply_text(welcome_text)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = (
        "Доступні команди:\n\n"
        "/start — привітання та інформація про бота\n"
        "/help — список доступних команд\n"
        "/clear — очистити історію розмови\n\n"
        "Просто напишіть будь-яке повідомлення, щоб поставити запитання AI."
    )
    await update.message.reply_text(help_text)


async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    conversation_history.pop(user_id, None)
    await update.message.reply_text("Історію розмови очищено. Починаємо спочатку!")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_text = update.message.text

    if len(user_text) > MAX_MESSAGE_LENGTH:
        await update.message.reply_text(
            f"Повідомлення занадто довге. Максимум {MAX_MESSAGE_LENGTH} символів."
        )
        return

    now = time.time()
    timestamps = rate_limit_tracker[user_id]
    rate_limit_tracker[user_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_tracker[user_id]) >= RATE_LIMIT_MESSAGES:
        await update.message.reply_text(
            f"Забагато запитів. Зачекайте {RATE_LIMIT_WINDOW} секунд і спробуйте знову."
        )
        return
    rate_limit_tracker[user_id].append(now)

    if user_id not in conversation_history:
        conversation_history[user_id] = []

    conversation_history[user_id].append({"role": "user", "content": user_text})

    # Trim history to prevent context from growing too large
    if len(conversation_history[user_id]) > MAX_HISTORY:
        conversation_history[user_id] = conversation_history[user_id][-MAX_HISTORY:]

    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=(
                "You are a helpful AI assistant in a Telegram bot. "
                "Answer clearly and concisely. "
                "You can respond in the same language the user writes in."
            ),
            messages=conversation_history[user_id],
        )

        if not response.content or not hasattr(response.content[0], "text"):
            raise ValueError("Unexpected empty response from Anthropic API")
        assistant_reply = response.content[0].text
        conversation_history[user_id].append({"role": "assistant", "content": assistant_reply})

        await update.message.reply_text(assistant_reply)

    except anthropic.APIError as e:
        logger.error("Anthropic API error: %s", e)
        await update.message.reply_text(
            "Виникла помилка при зверненні до AI. Спробуйте ще раз пізніше."
        )
    except Exception as e:
        logger.error("Unexpected error: %s", e)
        await update.message.reply_text(
            "Щось пішло не так. Спробуйте ще раз."
        )


async def post_init(app: Application) -> None:
    await app.bot.set_my_commands([
        BotCommand("start", "Привітання та інформація про бота"),
        BotCommand("help", "Список доступних команд"),
        BotCommand("clear", "Очистити історію розмови"),
    ])
    logger.info("Bot commands registered with Telegram.")


def main() -> None:
    global anthropic_client

    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_TOKEN is not set in .env")
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not set in .env")

    anthropic_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    app = Application.builder().token(TELEGRAM_TOKEN).post_init(post_init).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("clear", clear))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
