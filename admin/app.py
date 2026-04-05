"""
Admin panel — Flask web app.
Runs in a background thread inside bot.py (or standalone: python -m admin.app)
"""
import os
import sys
import time
import secrets
import functools

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask, render_template, request, redirect, url_for, session, flash
import database as db

app = Flask(__name__)
app.secret_key = os.getenv("ADMIN_SECRET_KEY", secrets.token_hex(32))

import datetime as _dt

@app.template_filter("format_ts")
def format_ts(ts: int) -> str:
    """Unix timestamp → readable date string."""
    try:
        return _dt.datetime.utcfromtimestamp(int(ts)).strftime("%d.%m.%Y %H:%M")
    except Exception:
        return "—"

@app.context_processor
def inject_now():
    return {"now_ts": time.time()}

ADMIN_USER     = os.getenv("ADMIN_USER",     "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")

_login_attempts: dict[str, list[float]] = {}


def _rate_limited(ip: str, limit: int = 5, window: int = 60) -> bool:
    now = time.time()
    attempts = [t for t in _login_attempts.get(ip, []) if now - t < window]
    if len(attempts) >= limit:
        _login_attempts[ip] = attempts
        return True
    attempts.append(now)
    _login_attempts[ip] = attempts
    return False


def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        token = secrets.token_hex(32)
        session["csrf"] = token
        return render_template("login.html", csrf_token=token)

    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        flash("Too many attempts. Wait a minute.")
        return render_template("login.html", csrf_token=session.get("csrf", "")), 429

    form_token = request.form.get("csrf_token", "")
    sess_token = session.pop("csrf", "")
    if not sess_token or not secrets.compare_digest(form_token, sess_token):
        flash("Invalid request.")
        token = secrets.token_hex(32)
        session["csrf"] = token
        return render_template("login.html", csrf_token=token), 403

    if (secrets.compare_digest(request.form.get("username", ""), ADMIN_USER) and
            secrets.compare_digest(request.form.get("password", ""), ADMIN_PASSWORD)):
        session["logged_in"] = True
        return redirect(url_for("dashboard"))

    flash("Wrong credentials")
    token = secrets.token_hex(32)
    session["csrf"] = token
    return render_template("login.html", csrf_token=token)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def dashboard():
    with db.get_conn() as conn:
        stats = {
            "total_users":    conn.execute("SELECT COUNT(*) FROM users").fetchone()[0],
            "with_wallet":    conn.execute("SELECT COUNT(DISTINCT user_id) FROM wallets").fetchone()[0],
            "with_pk":        conn.execute(
                "SELECT COUNT(DISTINCT user_id) FROM wallets WHERE encrypted_pk IS NOT NULL"
            ).fetchone()[0],
            "auto_mode_on":   conn.execute(
                "SELECT COUNT(*) FROM user_settings WHERE auto_mode=1"
            ).fetchone()[0],
            "signals_today":  conn.execute(
                "SELECT COUNT(*) FROM signals WHERE date(created_at)=date('now')"
            ).fetchone()[0],
            "signals_total":  conn.execute("SELECT COUNT(*) FROM signals").fetchone()[0],
            "trades_today":   conn.execute(
                "SELECT COUNT(*) FROM trades WHERE date(created_at)=date('now')"
            ).fetchone()[0],
            "trades_total":   conn.execute("SELECT COUNT(*) FROM trades").fetchone()[0],
            "open_positions": conn.execute(
                "SELECT COUNT(*) FROM positions WHERE status='open'"
            ).fetchone()[0],
        }

        signal_breakdown = conn.execute("""
            SELECT signal_type, COUNT(*) as cnt
            FROM signals WHERE date(created_at)=date('now')
            GROUP BY signal_type ORDER BY cnt DESC
        """).fetchall()

        recent_signals = conn.execute(
            "SELECT * FROM signals ORDER BY created_at DESC LIMIT 10"
        ).fetchall()

        recent_users = conn.execute("""
            SELECT u.*, COALESCE(s.tier,'free') as tier,
                   (SELECT COUNT(*) FROM wallets w WHERE w.user_id=u.id) as wallet_count
            FROM users u
            LEFT JOIN subscriptions s ON s.user_id=u.id
            ORDER BY u.created_at DESC LIMIT 10
        """).fetchall()

        recent_trades = conn.execute("""
            SELECT t.*, u.first_name, u.username
            FROM trades t JOIN users u ON u.id=t.user_id
            ORDER BY t.created_at DESC LIMIT 10
        """).fetchall()

    return render_template("dashboard.html",
                           stats=stats,
                           signal_breakdown=signal_breakdown,
                           recent_signals=recent_signals,
                           recent_users=recent_users,
                           recent_trades=recent_trades)


@app.route("/users")
@login_required
def users():
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = 25
    offset   = (page - 1) * per_page

    with db.get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        rows  = conn.execute("""
            SELECT u.*,
                   COALESCE(s.tier,'free') as tier,
                   COALESCE(us.auto_mode,0) as auto_mode,
                   (SELECT COUNT(*) FROM wallets w WHERE w.user_id=u.id) as wallets,
                   (SELECT COUNT(*) FROM wallets w WHERE w.user_id=u.id AND w.encrypted_pk IS NOT NULL) as has_pk,
                   (SELECT COUNT(*) FROM trades t WHERE t.user_id=u.id) as trades_count,
                   (SELECT COUNT(*) FROM positions p WHERE p.user_id=u.id AND p.status='open') as open_positions
            FROM users u
            LEFT JOIN subscriptions s ON s.user_id=u.id
            LEFT JOIN user_settings us ON us.user_id=u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        """, (per_page, offset)).fetchall()

    return render_template("users.html", users=rows, page=page,
                           total=total, per_page=per_page)


@app.route("/signals")
@login_required
def signals():
    chain    = request.args.get("chain", "")
    sig_type = request.args.get("type", "")
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = 30
    offset   = (page - 1) * per_page

    filters_sql, params = [], []
    if chain:
        filters_sql.append("chain=?"); params.append(chain)
    if sig_type:
        filters_sql.append("signal_type=?"); params.append(sig_type)
    where = ("WHERE " + " AND ".join(filters_sql)) if filters_sql else ""

    with db.get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM signals {where}", params).fetchone()[0]
        rows  = conn.execute(
            f"SELECT * FROM signals {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, offset]
        ).fetchall()

    return render_template("signals.html", signals=rows, page=page,
                           total=total, per_page=per_page,
                           chain=chain, sig_type=sig_type)


@app.route("/trades")
@login_required
def trades():
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = 30
    offset   = (page - 1) * per_page

    with db.get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM trades").fetchone()[0]
        rows  = conn.execute("""
            SELECT t.*, u.first_name, u.username
            FROM trades t JOIN users u ON u.id=t.user_id
            ORDER BY t.created_at DESC LIMIT ? OFFSET ?
        """, (per_page, offset)).fetchall()

    return render_template("trades.html", trades=rows, page=page,
                           total=total, per_page=per_page)


@app.route("/positions")
@login_required
def positions():
    with db.get_conn() as conn:
        rows = conn.execute("""
            SELECT p.*, u.first_name, u.username
            FROM positions p JOIN users u ON u.id=p.user_id
            WHERE p.status='open'
            ORDER BY p.opened_at DESC
        """).fetchall()
    return render_template("positions.html", positions=rows)


if __name__ == "__main__":
    db.init_db()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
