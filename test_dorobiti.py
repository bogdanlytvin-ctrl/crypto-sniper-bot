"""
Test script for доробити.txt features.
Run: python test_dorobiti.py
Does NOT require a running bot — uses a temp in-memory DB.
"""
import sys
import os
import sqlite3

# Point database module to a temp file
import tempfile
_tmp = tempfile.mktemp(suffix=".db")
os.environ["DB_PATH"] = _tmp

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

PASS = "\033[32mPASS\033[0m"
FAIL = "\033[31mFAIL\033[0m"
results = []


def check(name, condition, detail=""):
    status = PASS if condition else FAIL
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    results.append(condition)


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 1: init_db() creates all tables ===")
import database as db

try:
    db.init_db()
    with db.get_conn() as conn:
        tables = {r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()}
    check("token_blacklist table exists", "token_blacklist" in tables)
    check("trades table exists",          "trades"          in tables)
    check("user_settings table exists",   "user_settings"   in tables)
except Exception as e:
    check("init_db() ran without error", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 2: Blacklist functions ===")

try:
    db.add_to_blacklist("solana", "So1anaAddr1111111111111111111111111111111111", "rug pull")
    db.add_to_blacklist("bsc",   "0xBadTokenBSCAddress000000000000000000000000", "honeypot")

    check("is_blacklisted SOL (should be True)",
          db.is_blacklisted("solana", "So1anaAddr1111111111111111111111111111111111"))
    check("is_blacklisted BSC (should be True)",
          db.is_blacklisted("bsc",    "0xBadTokenBSCAddress000000000000000000000000"))
    check("is_blacklisted unknown (should be False)",
          not db.is_blacklisted("solana", "0xNotBlacklisted"))

    bl = db.get_blacklist()
    check("get_blacklist returns 2 entries", len(bl) == 2)

    db.remove_from_blacklist("So1anaAddr1111111111111111111111111111111111")
    check("after remove: is_blacklisted SOL = False",
          not db.is_blacklisted("solana", "So1anaAddr1111111111111111111111111111111111"))

    bl2 = db.get_blacklist()
    check("get_blacklist returns 1 entry after remove", len(bl2) == 1)
except Exception as e:
    check("blacklist functions", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 3: get_bot_performance() ===")

try:
    # Create a test user
    uid = db.upsert_user(99999999, "TestUser", None)

    # Insert mock sell trades directly
    with db.get_conn() as conn:
        conn.execute("""
            INSERT INTO trades (user_id, chain, token_address, token_symbol,
                                trade_type, amount_in, amount_out, price_usd,
                                sell_price, pnl_usd, pnl_percent, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (uid, "solana", "Addr1", "PEPE", "sell", 1.0, 0, 0.000120, 0.000180, 12.40, 50.0, "pending"))
        conn.execute("""
            INSERT INTO trades (user_id, chain, token_address, token_symbol,
                                trade_type, amount_in, amount_out, price_usd,
                                sell_price, pnl_usd, pnl_percent, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (uid, "bsc", "Addr2", "DOGEAI", "sell", 1.0, 0, 0.0021, 0.0016, -5.00, -23.0, "pending"))
        # A buy trade that should NOT be counted
        conn.execute("""
            INSERT INTO trades (user_id, chain, token_address, token_symbol,
                                trade_type, amount_in, amount_out, price_usd,
                                sell_price, pnl_usd, pnl_percent, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (uid, "solana", "Addr3", "MOON", "buy", 0.1, 0, 0.001, None, None, None, "pending"))

    perf = db.get_bot_performance()
    check("total_trades == 2 (sells only)",  perf["total_trades"] == 2)
    check("wins == 1 (pnl_usd > 0)",         perf["wins"] == 1)
    check("winrate == 50%",                  perf["winrate"] == 50)
    check("total_pnl == 7.40",               abs(perf["total_pnl"] - 7.40) < 0.01,
          f"got {perf['total_pnl']}")
    check("recent has 2 entries",            len(perf["recent"]) == 2)
except Exception as e:
    check("get_bot_performance", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 4: score_token — volume spike detection ===")

try:
    from scanner.signals import score_token

    # Extreme price spike > 500%
    pair_data_extreme = {
        "chain":          "solana",
        "liquidity_usd":  50_000,
        "volume_1h":      300_000,
        "price_change_1h": 600,
        "txns_1h_buys":  50,
        "txns_1h_sells": 20,
    }
    safety_ok = {
        "liq_locked":          True,
        "lp_locked_pct":       95,
        "rugcheck_score":      850,
        "top10_holders_pct":   18,
        "risks":               [],
    }
    result_extreme = score_token(pair_data_extreme, safety_ok)
    check("extreme spike: score <= 20",
          result_extreme["score"] <= 20,
          f"score={result_extreme['score']}")
    check("extreme spike: risk message present",
          any("Extreme" in r for r in result_extreme["risks"]))

    # Suspicious volume spike: vol > liq*5 and price_change > 200
    pair_data_suspicious = {
        "chain":          "solana",
        "liquidity_usd":  50_000,
        "volume_1h":      300_000,   # > 50000*5 = 250000
        "price_change_1h": 250,      # > 200
        "txns_1h_buys":  50,
        "txns_1h_sells": 20,
    }
    result_suspicious = score_token(pair_data_suspicious, safety_ok)
    check("suspicious spike: score <= 30",
          result_suspicious["score"] <= 30,
          f"score={result_suspicious['score']}")
    check("suspicious spike: risk message present",
          any("Suspicious" in r for r in result_suspicious["risks"]))

    # Normal token — should NOT be capped
    pair_data_normal = {
        "chain":          "solana",
        "liquidity_usd":  50_000,
        "volume_1h":      30_000,
        "price_change_1h": 25,
        "txns_1h_buys":  60,
        "txns_1h_sells": 40,
    }
    result_normal = score_token(pair_data_normal, safety_ok)
    check("normal token: score not spike-capped (>30)",
          result_normal["score"] > 30,
          f"score={result_normal['score']}")
except Exception as e:
    check("score_token volume spike", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 5: safe_mode column in user_settings ===")

try:
    uid2 = db.upsert_user(88888888, "SafeUser", None)
    settings = db.get_user_settings(uid2)
    check("safe_mode column exists in user_settings",
          "safe_mode" in settings.keys())
    check("safe_mode default == 0",
          settings["safe_mode"] == 0)

    db.update_user_settings(uid2, safe_mode=1)
    settings2 = db.get_user_settings(uid2)
    check("safe_mode can be set to 1",
          settings2["safe_mode"] == 1)

    db.update_user_settings(uid2, safe_mode=0)
    settings3 = db.get_user_settings(uid2)
    check("safe_mode can be toggled back to 0",
          settings3["safe_mode"] == 0)
except Exception as e:
    check("safe_mode column", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 6: trades table has sell_price / pnl_usd / pnl_percent columns ===")

try:
    with db.get_conn() as conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(trades)").fetchall()}
    check("sell_price column in trades",  "sell_price"  in cols)
    check("pnl_usd column in trades",     "pnl_usd"     in cols)
    check("pnl_percent column in trades", "pnl_percent" in cols)
except Exception as e:
    check("trades P&L columns", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Test 7: get_all_active_users_with_tier includes safe_mode ===")

try:
    users = db.get_all_active_users_with_tier()
    if users:
        check("safe_mode in user row keys",
              "safe_mode" in users[0].keys())
    else:
        check("safe_mode in user row keys", True, "no users — skipped")
except Exception as e:
    check("safe_mode in get_all_active_users_with_tier", False, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Summary
total  = len(results)
passed = sum(results)
failed = total - passed

print(f"\n{'='*50}")
print(f"Results: {passed}/{total} passed", end="")
if failed:
    print(f", {failed} FAILED")
else:
    print(" — ALL PASSED")
print('='*50)

# Cleanup
try:
    os.unlink(_tmp)
except Exception:
    pass

sys.exit(0 if failed == 0 else 1)
