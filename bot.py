import asyncio
import logging
import os
import signal
import time
from collections import defaultdict

import aiohttp
from dotenv import load_dotenv
from telegram import (
    Update, BotCommand,
    InlineKeyboardButton, InlineKeyboardMarkup,
)
from telegram.constants import ParseMode
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, ConversationHandler, filters, ContextTypes,
)

import database as db
from lang import t
from scanner.monitor import run_monitor
from trader.wallet import (
    get_sol_balance, get_sol_token_balances, get_bnb_balance,
    encrypt_pk, decrypt_pk, can_trade,
    is_valid_solana_address, is_valid_evm_address,
)
import payments as pay

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

# ── Conversation states ────────────────────────────────────────────────────────
WALLET_ENTER_ADDRESS, WALLET_ENTER_KEY = range(2)

# ── Rate limiting ──────────────────────────────────────────────────────────────
_rate_tracker: dict[int, list[float]] = defaultdict(list)


def _rate_limited(tid: int, limit: int = 10, window: int = 60) -> bool:
    now = time.time()
    _rate_tracker[tid] = [ts for ts in _rate_tracker[tid] if now - ts < window]
    if len(_rate_tracker[tid]) >= limit:
        return True
    _rate_tracker[tid].append(now)
    return False


# ── App reference ──────────────────────────────────────────────────────────────
_app: Application | None = None


# ── Keyboards ──────────────────────────────────────────────────────────────────

def _main_keyboard(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(t(lang, 'menu_wallet'),    callback_data="menu:wallet"),
         InlineKeyboardButton(t(lang, 'menu_balance'),   callback_data="menu:balance")],
        [InlineKeyboardButton(t(lang, 'menu_signals'),   callback_data="menu:signals"),
         InlineKeyboardButton(t(lang, 'menu_positions'), callback_data="menu:positions")],
        [InlineKeyboardButton(t(lang, 'menu_automode'),  callback_data="menu:automode"),
         InlineKeyboardButton(t(lang, 'menu_trades'),    callback_data="menu:trades")],
    ])


def _buy_keyboard(chain: str, token_address: str) -> InlineKeyboardMarkup | None:
    """Inline buy buttons for signal messages. Returns None if address missing."""
    if not token_address:
        return None
    if chain == "solana":
        amounts = [("0.1 SOL", "0.1"), ("0.5 SOL", "0.5"), ("1 SOL", "1.0")]
    else:
        amounts = [("0.01 BNB", "0.01"), ("0.05 BNB", "0.05"), ("0.1 BNB", "0.1")]
    buttons = [
        InlineKeyboardButton(
            f"💰 {label}",
            callback_data=f"buy:{chain}:{token_address}:{amt}",
        )
        for label, amt in amounts
    ]
    return InlineKeyboardMarkup([buttons, [InlineKeyboardButton("❌ Skip", callback_data="skip")]])


def _plans_keyboard(lang: str, current_tier: str) -> InlineKeyboardMarkup:
    buttons = []
    if current_tier != "basic":
        price = db.get_bot_setting("basic_price_usd", "29")
        buttons.append(InlineKeyboardButton(
            f"💳 Basic ${price}/міс", callback_data="plans_buy:basic"
        ))
    if current_tier != "pro":
        price = db.get_bot_setting("pro_price_usd", "79")
        buttons.append(InlineKeyboardButton(
            f"🚀 Pro ${price}/міс", callback_data="plans_buy:pro"
        ))
    rows = [buttons] if buttons else []
    if current_tier in ("basic", "pro"):
        rows.append([InlineKeyboardButton(
            t(lang, 'plan_my_payments'), callback_data="plans_buy:history"
        )])
    return InlineKeyboardMarkup(rows)


# ── Monitor send callback ──────────────────────────────────────────────────────

async def _send_signal(telegram_id: int, message: str, pair_data: dict | None = None) -> None:
    if _app is None:
        return
    keyboard = None
    if pair_data:
        keyboard = _buy_keyboard(
            pair_data.get("chain", ""),
            pair_data.get("token_address", ""),
        )
    await _app.bot.send_message(
        chat_id=telegram_id,
        text=message,
        parse_mode=ParseMode.HTML,
        disable_web_page_preview=True,
        reply_markup=keyboard,
    )


# ── Ban guard ──────────────────────────────────────────────────────────────────

def _check_banned(telegram_id: int) -> bool:
    return db.is_banned(telegram_id)


# ── /start ─────────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if _check_banned(user.id):
        return
    if _rate_limited(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await update.message.reply_text(
        t(lang, 'start', name=user.first_name),
        parse_mode=ParseMode.HTML,
        reply_markup=_main_keyboard(lang),
    )


# ── /help ──────────────────────────────────────────────────────────────────────

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await update.message.reply_text(t(lang, 'help'), parse_mode=ParseMode.HTML)


# ── /status ────────────────────────────────────────────────────────────────────

async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if _check_banned(user.id):
        return
    if _rate_limited(user.id):
        return
    user_id   = db.upsert_user(user.id, user.first_name, user.username)
    lang      = db.get_user_lang(user_id)
    wallets   = db.get_all_wallets(user_id)
    settings  = db.get_user_settings(user_id)
    positions = db.get_open_positions(user_id)
    sent_today = db.count_signals_sent_today(user_id)
    tier      = db.get_user_tier(user_id)

    wallet_lines = []
    for w in wallets:
        icon     = "◎" if w["chain"] == "solana" else "🔶"
        key_icon = "🔐" if w["encrypted_pk"] else "👁"
        wallet_lines.append(f"  {icon} {w['chain'].upper()}: {w['address'][:10]}... {key_icon}")

    wallets_text = "\n".join(wallet_lines) if wallet_lines else t(lang, 'status_no_wallet')
    auto_text    = t(lang, 'auto_on') if (settings and settings["auto_mode"]) else t(lang, 'auto_off')
    tier_labels  = {"free": "🆓 Free", "basic": "💳 Basic", "pro": "🚀 Pro"}
    tier_text    = tier_labels.get(tier, tier.upper())

    await update.message.reply_text(
        t(lang, 'status_full',
          wallets=wallets_text,
          signals_today=sent_today,
          positions=len(positions),
          auto=auto_text,
          tier=tier_text),
        parse_mode=ParseMode.HTML,
        reply_markup=_main_keyboard(lang),
    )


# ── /plans ─────────────────────────────────────────────────────────────────────

async def cmd_plans(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    tier    = db.get_user_tier(user_id)
    _show_plans(update, lang, tier, user_id)
    await _send_plans(update, lang, tier, user_id)


async def _send_plans(update_or_query, lang: str, tier: str, user_id: int) -> None:
    basic_price = db.get_bot_setting("basic_price_usd", "29")
    pro_price   = db.get_bot_setting("pro_price_usd", "79")
    basic_days  = db.get_bot_setting("basic_duration_days", "30")
    pro_days    = db.get_bot_setting("pro_duration_days", "30")

    tier_labels = {"free": "🆓 Free", "basic": "💳 Basic", "pro": "🚀 Pro"}
    current_label = tier_labels.get(tier, tier.upper())

    text = t(lang, 'plans',
             basic_price=basic_price, pro_price=pro_price,
             basic_days=basic_days,   pro_days=pro_days,
             current_tier=current_label)

    kb = _plans_keyboard(lang, tier)
    msg = update_or_query.message if hasattr(update_or_query, "message") else update_or_query
    await msg.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=kb)


def _show_plans(update, lang, tier, user_id):
    pass  # placeholder kept for clarity


# ── /language ──────────────────────────────────────────────────────────────────

async def cmd_language(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🇺🇦 Українська", callback_data="lang:ua"),
        InlineKeyboardButton("🇬🇧 English",     callback_data="lang:en"),
    ]])
    await update.message.reply_text(t(lang, 'lang_choose'), reply_markup=keyboard)


async def cb_language(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query    = update.callback_query
    user     = query.from_user
    if _check_banned(user.id):
        return
    user_id  = db.upsert_user(user.id, user.first_name, user.username)
    new_lang = query.data.split(":")[1]
    db.set_user_lang(user_id, new_lang)
    key = 'lang_set_ua' if new_lang == 'ua' else 'lang_set_en'
    await query.answer()
    await query.edit_message_text(t(new_lang, key))


# ── Main menu callbacks ────────────────────────────────────────────────────────

async def cb_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    if _rate_limited(user.id):
        await query.answer(t("ua", "rate_limit"))
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    action  = query.data.split(":")[1]
    await query.answer()

    dispatch = {
        "wallet":    _menu_wallet,
        "balance":   _menu_balance,
        "signals":   _menu_signals,
        "positions": _menu_positions,
        "automode":  _menu_automode,
        "trades":    _menu_trades,
    }
    handler = dispatch.get(action)
    if handler:
        await handler(query, user_id, lang)


async def _menu_wallet(query, user_id: int, lang: str) -> None:
    wallets = db.get_all_wallets(user_id)
    if not wallets:
        text = t(lang, 'wallet_empty')
    else:
        lines = [t(lang, 'wallet_header')]
        for w in wallets:
            icon     = "◎" if w["chain"] == "solana" else "🔶"
            key_icon = "🔐" if w["encrypted_pk"] else "👁"
            short    = w["address"][:8] + "..." + w["address"][-6:]
            lines.append(f"{icon} {w['chain'].upper()}: <code>{short}</code> {key_icon}")
        text = "\n".join(lines)

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("◎ Додати Solana", callback_data="wallet:add:solana"),
         InlineKeyboardButton("🔶 Додати BNB",   callback_data="wallet:add:bsc")],
        [InlineKeyboardButton("🗑 Видалити Solana", callback_data="wallet:del:solana"),
         InlineKeyboardButton("🗑 Видалити BNB",    callback_data="wallet:del:bsc")],
        [InlineKeyboardButton("🔑 Додати приватний ключ", callback_data="wallet:addkey")],
        [InlineKeyboardButton("🗝 Видалити ключі",        callback_data="wallet:delkey")],
    ])
    await query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)


async def _menu_balance(query, user_id: int, lang: str) -> None:
    wallets = db.get_all_wallets(user_id)
    if not wallets:
        await query.edit_message_text(t(lang, 'balance_no_wallet'))
        return
    await query.edit_message_text(t(lang, 'balance_loading'))

    lines = [t(lang, 'balance_header')]
    for w in wallets:
        icon  = "◎" if w["chain"] == "solana" else "🔶"
        short = w["address"][:8] + "..." + w["address"][-6:]
        lines.append(f"\n{icon} <b>{w['chain'].upper()}</b>\n<code>{short}</code>")

        if w["chain"] == "solana":
            bal = await get_sol_balance(w["address"])
            lines.append(f"  💰 SOL: <b>{bal:.4f}</b>")
            tokens = await get_sol_token_balances(w["address"])
            for tok in tokens[:5]:
                mint_short = tok["mint"][:8] + "..."
                lines.append(f"  🪙 <code>{mint_short}</code>: {tok['amount']:,.2f}")
            if len(tokens) > 5:
                lines.append(f"  … та ще {len(tokens) - 5} токенів")
        else:
            bal = await get_bnb_balance(w["address"])
            lines.append(f"  💰 BNB: <b>{bal:.4f}</b>")

    await query.edit_message_text("\n".join(lines), parse_mode=ParseMode.HTML)


async def _menu_signals(query, user_id: int, lang: str) -> None:
    tier      = db.get_user_tier(user_id)
    signals   = db.get_recent_signals(limit=50)
    min_score = {"free": 85, "basic": 70, "pro": 55}.get(tier, 85)
    visible   = [s for s in signals if s["score"] >= min_score]

    if not visible:
        await query.edit_message_text(t(lang, 'no_signals'))
        return

    await query.edit_message_text(
        t(lang, 'signals_header', count=len(visible)),
        parse_mode=ParseMode.HTML,
    )

    for sig in visible[:5]:
        chain_icon = "◎" if sig["chain"] == "solana" else "🔶"
        st_map = {"STRONG_BUY": "🟢 STRONG BUY", "BUY": "🟡 BUY", "WATCH": "👀 WATCH"}
        label  = st_map.get(sig["signal_type"], sig["signal_type"])
        chg    = sig["price_change_1h"] or 0
        sign   = "+" if chg >= 0 else ""

        msg = (
            f"{label}  |  Score: {sig['score']}/100\n"
            f"{chain_icon} {sig['chain'].upper()}  •  {sig['dex'] or ''}\n"
            f"🪙 <b>{sig['token_name'] or '?'}</b> (${sig['token_symbol'] or '?'})\n"
            f"💧 {t(lang,'sig_liq')}: ${sig['liquidity_usd']:,.0f}\n"
            f"📈 {t(lang,'sig_chg')}: {sign}{chg:.1f}%\n"
        )
        if sig["token_address"]:
            msg += f"\n<code>{sig['token_address']}</code>"

        keyboard = _buy_keyboard(sig["chain"], sig["token_address"] or "")
        await query.message.reply_text(
            msg,
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True,
            reply_markup=keyboard,
        )


async def _menu_positions(query, user_id: int, lang: str) -> None:
    positions = db.get_open_positions(user_id)
    if not positions:
        await query.edit_message_text(t(lang, 'positions_empty'))
        return

    await query.edit_message_text(
        t(lang, 'positions_header', count=len(positions)),
        parse_mode=ParseMode.HTML,
    )

    for pos in positions:
        icon = "◎" if pos["chain"] == "solana" else "🔶"
        msg = (
            f"{icon} <b>{pos['token_symbol'] or '?'}</b> ({pos['token_name'] or '?'})\n"
            f"📦 {pos['amount']:,.4f} токенів\n"
            f"💵 Куплено по: ${pos['buy_price_usd'] or 0:,.8f}\n"
            f"🛑 Stop-loss: -{pos['stop_loss_pct']}%\n"
            f"📅 {pos['opened_at'][:10]}\n"
            f"<code>{pos['token_address']}</code>"
        )
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("🔴 Sell 50%",  callback_data=f"sell:{pos['id']}:50"),
            InlineKeyboardButton("🔴 Sell 100%", callback_data=f"sell:{pos['id']}:100"),
        ]])
        await query.message.reply_text(msg, parse_mode=ParseMode.HTML, reply_markup=keyboard)


async def _menu_automode(query, user_id: int, lang: str) -> None:
    s    = db.get_user_settings(user_id)
    on   = bool(s["auto_mode"])          if s else False
    pump = bool(s["notify_all_tokens"])  if s else False

    text = t(lang, 'auto_status',
             status=t(lang, 'auto_on') if on else t(lang, 'auto_off'),
             score=s["auto_min_score"]  if s else 80,
             sol=s["auto_max_buy_sol"]  if s else 0.1,
             bnb=s["auto_max_buy_bnb"]  if s else 0.01,
             sl=s["auto_stop_loss"]     if s else 20)

    pump_btn = ("🟣 pump.fun: ON ✅" if pump else "🟣 pump.fun: OFF")
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(t(lang, 'auto_toggle_on'),  callback_data="auto:on"),
         InlineKeyboardButton(t(lang, 'auto_toggle_off'), callback_data="auto:off")],
        [InlineKeyboardButton(pump_btn, callback_data="auto:pump_toggle")],
        [InlineKeyboardButton(t(lang, 'auto_config'),     callback_data="auto:config")],
    ])
    await query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)


async def _menu_trades(query, user_id: int, lang: str) -> None:
    trades = db.get_user_trades(user_id, limit=10)
    if not trades:
        await query.edit_message_text(t(lang, 'trades_empty'))
        return

    lines = [t(lang, 'trades_header')]
    for tr in trades:
        type_icon  = "🟢" if tr["trade_type"] == "buy" else "🔴"
        chain_icon = "◎" if tr["chain"] == "solana" else "🔶"
        stat_icon  = {"confirmed": "✅", "pending": "⏳", "failed": "❌"}.get(tr["status"], "❓")
        lines.append(
            f"\n{type_icon} {tr['trade_type'].upper()} {chain_icon} "
            f"<b>{tr['token_symbol'] or '?'}</b>\n"
            f"  {tr['amount_in']} → {tr['amount_out'] or '?'} | {stat_icon} {tr['status']}\n"
            f"  {tr['created_at'][:16]}"
        )
    await query.edit_message_text("\n".join(lines), parse_mode=ParseMode.HTML)


# ── Plans / Payment callbacks ──────────────────────────────────────────────────

async def cb_plans_buy(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    action = query.data.split(":")[1]   # basic | pro | history | check:<invoice_id>

    if action == "history":
        payments = db.get_user_payments(user_id, limit=5)
        if not payments:
            await query.edit_message_text(t(lang, 'pay_no_history'))
            return
        lines = [t(lang, 'pay_history_header')]
        status_icons = {"paid": "✅", "pending": "⏳", "expired": "❌"}
        for p in payments:
            icon = status_icons.get(p["status"], "❓")
            lines.append(
                f"{icon} <b>{p['tier'].upper()}</b> ${p['amount_usd']:.0f} — "
                f"{p['status']} — {p['created_at'][:10]}"
            )
        await query.edit_message_text("\n".join(lines), parse_mode=ParseMode.HTML)
        return

    tier = action  # basic or pro
    if tier not in ("basic", "pro"):
        return

    # Check if payments are enabled
    if not pay.is_enabled():
        await query.edit_message_text(t(lang, 'pay_not_configured'))
        return

    # Check maintenance mode
    if db.get_bot_setting("maintenance_mode", "0") == "1":
        await query.edit_message_text(t(lang, 'pay_maintenance'))
        return

    await query.edit_message_text(t(lang, 'pay_creating'))

    result = await pay.create_invoice(tier, user_id)
    if not result:
        await query.edit_message_text(t(lang, 'pay_error'))
        return

    price   = result["amount_usd"]
    pay_url = result["pay_url"]
    inv_id  = result["invoice_id"]
    days    = db.get_bot_setting(f"{tier}_duration_days", "30")

    tier_labels = {"basic": "💳 Basic", "pro": "🚀 Pro"}
    label = tier_labels.get(tier, tier.upper())

    text = t(lang, 'pay_invoice',
             tier=label, price=f"{price:.0f}", days=days, inv_id=inv_id)

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(t(lang, 'pay_btn_pay'), url=pay_url)],
        [InlineKeyboardButton(
            t(lang, 'pay_btn_check'),
            callback_data=f"pay_check:{inv_id}"
        )],
    ])
    await query.edit_message_text(text, parse_mode=ParseMode.HTML,
                                  reply_markup=keyboard,
                                  disable_web_page_preview=True)


async def cb_pay_check(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """User manually checks if their payment went through."""
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    inv_id  = query.data.split(":", 1)[1]
    payment = db.get_payment_by_invoice(inv_id)

    if not payment or payment["user_id"] != user_id:
        await query.edit_message_text(t(lang, 'pay_not_found'))
        return

    if payment["status"] == "paid":
        tier = payment["tier"]
        sub  = db.get_subscription(user_id)
        exp  = sub["expires_at"][:10] if sub and sub["expires_at"] else "—"
        await query.edit_message_text(
            t(lang, 'pay_already_paid', tier=tier.upper(), expires=exp),
            parse_mode=ParseMode.HTML
        )
        return

    if payment["status"] == "expired":
        await query.edit_message_text(t(lang, 'pay_expired'))
        return

    # Check live
    status = await pay.check_invoice(inv_id)

    if status == "paid":
        pay._activate_subscription(payment)
        tier = payment["tier"]
        days = int(db.get_bot_setting(f"{tier}_duration_days", "30"))
        from datetime import datetime, timezone, timedelta
        expires = (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%d.%m.%Y")
        await query.edit_message_text(
            t(lang, 'pay_confirmed', tier=tier.upper(), expires=expires),
            parse_mode=ParseMode.HTML
        )
    elif status == "expired" or status is None:
        db.update_payment_status(payment["id"], "expired")
        await query.edit_message_text(t(lang, 'pay_expired'))
    else:
        # Still active (not paid yet)
        await query.edit_message_text(
            t(lang, 'pay_pending'),
            parse_mode=ParseMode.HTML,
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton(t(lang, 'pay_btn_check'),
                                     callback_data=f"pay_check:{inv_id}")
            ]])
        )


# ── Wallet conversation ────────────────────────────────────────────────────────

async def cb_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return ConversationHandler.END
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    parts  = query.data.split(":")
    action = parts[1]

    if action == "add":
        context.user_data["wallet_chain"] = parts[2]
        await query.edit_message_text(
            t(lang, 'wallet_enter_address', chain=parts[2].upper()),
        )
        return WALLET_ENTER_ADDRESS

    if action == "del":
        db.delete_wallet(user_id, parts[2])
        await query.edit_message_text(t(lang, 'wallet_deleted', chain=parts[2].upper()))
        return ConversationHandler.END

    if action == "delkey":
        for w in db.get_all_wallets(user_id):
            db.update_wallet_pk(user_id, w["chain"], None)
        await query.edit_message_text(t(lang, 'wallet_pk_deleted'))
        return ConversationHandler.END

    if action == "addkey":
        if not can_trade():
            await query.edit_message_text(t(lang, 'trading_no_enc_key'))
            return ConversationHandler.END
        wallets = db.get_all_wallets(user_id)
        if not wallets:
            await query.edit_message_text(t(lang, 'wallet_no_wallet_for_key'))
            return ConversationHandler.END
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton(
                f"{'◎' if w['chain']=='solana' else '🔶'} {w['chain'].upper()}",
                callback_data=f"wallet:addkey2:{w['chain']}"
            ) for w in wallets
        ]])
        await query.edit_message_text(t(lang, 'wallet_choose_chain_key'), reply_markup=keyboard)
        return ConversationHandler.END

    if action == "addkey2":
        if not can_trade():
            await query.edit_message_text(t(lang, 'trading_no_enc_key'))
            return ConversationHandler.END
        context.user_data["wallet_chain"] = parts[2]
        await query.edit_message_text(
            t(lang, 'wallet_enter_pk_warning'), parse_mode=ParseMode.HTML,
        )
        return WALLET_ENTER_KEY

    return ConversationHandler.END


async def _recv_address(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user    = update.effective_user
    if _check_banned(user.id):
        return ConversationHandler.END
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    address = update.message.text.strip()
    chain   = context.user_data.get("wallet_chain", "solana")

    valid = is_valid_solana_address(address) if chain == "solana" else is_valid_evm_address(address)
    if not valid:
        await update.message.reply_text(t(lang, 'wallet_invalid_address'))
        return WALLET_ENTER_ADDRESS

    db.save_wallet(user_id, chain, address)
    await update.message.reply_text(
        t(lang, 'wallet_saved', chain=chain.upper(), address=address),
        parse_mode=ParseMode.HTML,
    )
    return ConversationHandler.END


async def _recv_pk(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user    = update.effective_user
    if _check_banned(user.id):
        return ConversationHandler.END
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    pk      = update.message.text.strip()
    chain   = context.user_data.get("wallet_chain", "solana")

    try:
        await update.message.delete()
    except Exception:
        pass

    encrypted = encrypt_pk(pk)
    if not encrypted:
        await update.message.reply_text(t(lang, 'wallet_pk_encrypt_failed'))
        return ConversationHandler.END

    db.update_wallet_pk(user_id, chain, encrypted)
    await update.message.reply_text(t(lang, 'wallet_pk_saved'), parse_mode=ParseMode.HTML)
    return ConversationHandler.END


async def conv_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user    = update.effective_user
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await update.message.reply_text(t(lang, 'cancelled'))
    return ConversationHandler.END


# ── Buy callback ───────────────────────────────────────────────────────────────

async def cb_buy(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    parts = query.data.split(":", 3)
    if len(parts) < 4:
        await query.message.reply_text("❌ Invalid callback data.")
        return

    _, chain, token_address, amount_str = parts
    amount = float(amount_str)

    wallet = db.get_wallet(user_id, chain)
    if not wallet:
        await query.message.reply_text(t(lang, 'buy_no_wallet', chain=chain.upper()))
        return
    if not wallet["encrypted_pk"]:
        await query.message.reply_text(t(lang, 'buy_no_pk'))
        return

    pk = decrypt_pk(wallet["encrypted_pk"])
    if not pk:
        await query.message.reply_text(t(lang, 'buy_decrypt_failed'))
        return

    short_addr = token_address[:12] + "..."
    await query.message.reply_text(
        t(lang, 'buy_executing', amount=amount,
          chain="SOL" if chain == "solana" else "BNB",
          address=short_addr),
        parse_mode=ParseMode.HTML,
    )

    if chain == "solana":
        async with aiohttp.ClientSession() as session:
            from trader.jupiter import get_buy_quote, execute_swap
            quote = await get_buy_quote(session, token_address, amount)
            if not quote:
                await query.message.reply_text(t(lang, 'buy_quote_failed'))
                return
            result = await execute_swap(session, quote, wallet["address"], pk)
    else:
        from trader.bsc import execute_buy
        result = execute_buy(token_address, amount, pk)

    if result["success"]:
        trade_id = db.save_trade(user_id, chain, token_address, "?", "buy",
                                 amount, 0, 0, result["tx_hash"], "pending")
        # Create position record
        settings = db.get_user_settings(user_id)
        sl_pct = settings["auto_stop_loss"] if settings else 20
        db.upsert_position(user_id, chain, token_address, "?", "?",
                           amount, 0, amount, sl_pct)
        await query.message.reply_text(
            t(lang, 'buy_success', tx=result["tx_hash"]),
            parse_mode=ParseMode.HTML,
        )
    else:
        await query.message.reply_text(
            t(lang, 'buy_failed', error=result.get("error", "Unknown")),
            parse_mode=ParseMode.HTML,
        )


async def cb_skip(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.callback_query.answer("Skipped")
    try:
        await update.callback_query.edit_message_reply_markup(reply_markup=None)
    except Exception:
        pass


# ── Positions & auto callbacks ─────────────────────────────────────────────────

async def cb_pos(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    positions = db.get_open_positions(user_id)
    for pos in positions:
        db.close_position(pos["id"])
    await query.edit_message_text(t(lang, 'pos_closed_all', count=len(positions)))


async def cb_sell(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    parts    = query.data.split(":")
    pos_id   = int(parts[1])
    sell_pct = int(parts[2])

    positions = db.get_open_positions(user_id)
    pos = next((p for p in positions if p["id"] == pos_id), None)
    if not pos:
        await query.edit_message_text("❌ Позицію не знайдено.")
        return

    chain  = pos["chain"]
    wallet = db.get_wallet(user_id, chain)
    if not wallet or not wallet["encrypted_pk"]:
        await query.edit_message_text(t(lang, 'buy_no_pk'))
        return

    pk = decrypt_pk(wallet["encrypted_pk"])
    if not pk:
        await query.edit_message_text(t(lang, 'buy_decrypt_failed'))
        return

    sell_amount = pos["amount"] * sell_pct / 100
    await query.edit_message_text(
        f"⏳ Продаю {sell_pct}% <b>{pos['token_symbol'] or '?'}</b>...",
        parse_mode=ParseMode.HTML,
    )

    if chain == "solana":
        tokens   = await get_sol_token_balances(wallet["address"])
        tok      = next((tk for tk in tokens if tk["mint"] == pos["token_address"]), None)
        decimals = tok["decimals"] if tok else 6
        amount_raw = int(sell_amount * (10 ** decimals))

        async with aiohttp.ClientSession() as session:
            from trader.jupiter import get_sell_quote, execute_swap
            quote = await get_sell_quote(session, pos["token_address"], amount_raw)
            if not quote:
                await query.edit_message_text("❌ Не вдалося отримати ціну продажу.")
                return
            result = await execute_swap(session, quote, wallet["address"], pk)
    else:
        from trader.bsc import execute_sell
        # BSC: sell_amount is in token units, convert with decimals (assume 18)
        amount_raw = int(sell_amount * (10 ** 18))
        result = execute_sell(pos["token_address"], amount_raw, pk)

    if result["success"]:
        db.save_trade(user_id, chain, pos["token_address"],
                      pos["token_symbol"] or "?", "sell",
                      sell_amount, 0, 0, result["tx_hash"], "pending")
        if sell_pct == 100:
            db.close_position(pos_id)
        else:
            with db.get_conn() as conn:
                conn.execute("UPDATE positions SET amount=amount*? WHERE id=?",
                             ((100 - sell_pct) / 100, pos_id))
        await query.edit_message_text(
            t(lang, 'sell_success', tx=result["tx_hash"]),
            parse_mode=ParseMode.HTML,
        )
    else:
        await query.edit_message_text(
            t(lang, 'buy_failed', error=result.get("error", "Unknown")),
            parse_mode=ParseMode.HTML,
        )


async def cb_auto(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query   = update.callback_query
    user    = query.from_user
    if _check_banned(user.id):
        return
    user_id = db.upsert_user(user.id, user.first_name, user.username)
    lang    = db.get_user_lang(user_id)
    await query.answer()

    action = query.data.split(":")[1]
    if action == "on":
        db.update_user_settings(user_id, auto_mode=1)
        await query.edit_message_text(t(lang, 'auto_enabled'), parse_mode=ParseMode.HTML)
    elif action == "off":
        db.update_user_settings(user_id, auto_mode=0)
        await query.edit_message_text(t(lang, 'auto_disabled'))
    elif action == "config":
        await query.edit_message_text(t(lang, 'auto_config_help'), parse_mode=ParseMode.HTML)
    elif action == "pump_toggle":
        s    = db.get_user_settings(user_id)
        curr = bool(s["notify_all_tokens"]) if s else False
        db.update_user_settings(user_id, notify_all_tokens=0 if curr else 1)
        if curr:
            await query.edit_message_text("🟣 pump.fun сповіщення <b>вимкнено</b>.", parse_mode=ParseMode.HTML)
        else:
            await query.edit_message_text("🟣 pump.fun сповіщення <b>увімкнено</b>!\n\nБот надсилатиме кожен новий токен з pump.fun.", parse_mode=ParseMode.HTML)


# ── Background: broadcast task ─────────────────────────────────────────────────

async def _broadcast_loop() -> None:
    """Check for pending admin broadcasts every 30s and send them."""
    logger.info("Broadcast loop started.")
    while True:
        await asyncio.sleep(30)
        try:
            await _process_broadcasts()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Broadcast loop error: %s", e)


async def _process_broadcasts() -> None:
    if _app is None:
        return
    pending = db.get_pending_broadcasts()
    for bcast in pending:
        db.update_broadcast_status(bcast["id"], "sending")
        users = db.get_all_active_users_with_tier()
        tier_filter = bcast["tier_filter"]
        if tier_filter:
            users = [u for u in users if u["tier"] == tier_filter]

        sent = 0
        for user in users:
            try:
                await _app.bot.send_message(
                    chat_id=user["telegram_id"],
                    text=bcast["message"],
                    parse_mode=ParseMode.HTML,
                    disable_web_page_preview=True,
                )
                sent += 1
                await asyncio.sleep(0.05)   # ~20 msg/sec (Telegram limit: 30/sec)
            except Exception as e:
                logger.warning("Broadcast send error to %d: %s", user["telegram_id"], e)

        db.update_broadcast_status(bcast["id"], "sent", sent_count=sent)
        logger.info("Broadcast #%d sent to %d users.", bcast["id"], sent)


# ── Setup ──────────────────────────────────────────────────────────────────────

async def post_init(app: Application) -> None:
    global _app
    _app = app

    # Remove any active webhook so polling doesn't conflict
    await app.bot.delete_webhook(drop_pending_updates=True)
    logger.info("Webhook deleted, pending updates dropped.")

    await app.bot.set_my_commands([
        BotCommand("start",    "Головне меню / Main menu"),
        BotCommand("status",   "Статус і гаманці / Status & wallets"),
        BotCommand("help",     "Довідка / Help"),
        BotCommand("plans",    "Тарифи / Plans"),
        BotCommand("language", "Мова / Language 🇺🇦🇬🇧"),
    ])

    loop = asyncio.get_event_loop()
    loop.create_task(run_monitor(_send_signal))
    loop.create_task(pay.payment_check_loop(_send_signal))
    loop.create_task(_broadcast_loop())
    logger.info("All background tasks started.")


def main() -> None:
    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_TOKEN is not set")

    db.init_db()
    logger.info("Database initialized.")

    port = int(os.getenv("PORT", "5000"))
    try:
        from admin.app import app as admin_app
        import threading
        threading.Thread(
            target=lambda: admin_app.run(host="0.0.0.0", port=port, debug=False),
            daemon=True,
        ).start()
        logger.info("Admin panel started on port %d", port)
    except Exception as e:
        logger.warning("Admin panel not started: %s", e)

    app = Application.builder().token(TELEGRAM_TOKEN).post_init(post_init).build()
    global _app
    _app = app

    wallet_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(cb_wallet, pattern=r"^wallet:")],
        states={
            WALLET_ENTER_ADDRESS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, _recv_address),
            ],
            WALLET_ENTER_KEY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, _recv_pk),
            ],
        },
        fallbacks=[CommandHandler("cancel", conv_cancel)],
        per_user=True,
        per_chat=True,
    )

    app.add_handler(CommandHandler("start",    cmd_start))
    app.add_handler(CommandHandler("status",   cmd_status))
    app.add_handler(CommandHandler("help",     cmd_help))
    app.add_handler(CommandHandler("plans",    cmd_plans))
    app.add_handler(CommandHandler("language", cmd_language))
    app.add_handler(wallet_conv)
    app.add_handler(CallbackQueryHandler(cb_menu,      pattern=r"^menu:"))
    app.add_handler(CallbackQueryHandler(cb_language,  pattern=r"^lang:"))
    app.add_handler(CallbackQueryHandler(cb_buy,       pattern=r"^buy:"))
    app.add_handler(CallbackQueryHandler(cb_skip,      pattern=r"^skip$"))
    app.add_handler(CallbackQueryHandler(cb_auto,      pattern=r"^auto:"))
    app.add_handler(CallbackQueryHandler(cb_pos,       pattern=r"^pos:"))
    app.add_handler(CallbackQueryHandler(cb_sell,      pattern=r"^sell:"))
    app.add_handler(CallbackQueryHandler(cb_plans_buy, pattern=r"^plans_buy:"))
    app.add_handler(CallbackQueryHandler(cb_pay_check, pattern=r"^pay_check:"))

    # Graceful shutdown on SIGTERM/SIGINT (Railway sends SIGTERM on redeploy)
    def _handle_stop(signum, frame):
        logger.info("Received signal %s — stopping bot...", signum)
        app.stop_running()

    signal.signal(signal.SIGTERM, _handle_stop)
    signal.signal(signal.SIGINT,  _handle_stop)

    logger.info("Crypto Sniper Bot is running...")
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
        close_loop=False,
    )


if __name__ == "__main__":
    main()
