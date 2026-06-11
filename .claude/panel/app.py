from flask import Flask, render_template, jsonify, request, redirect, url_for, abort, session, Response, stream_with_context
from functools import wraps
from pathlib import Path
from datetime import datetime
import re
import os
import json
import hashlib

# Завантажити .env якщо є
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

try:
    import anthropic as _anthropic_lib
    _ai_client = _anthropic_lib.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    ANTHROPIC_OK = bool(os.environ.get("ANTHROPIC_API_KEY"))
except Exception:
    _ai_client = None
    ANTHROPIC_OK = False

app = Flask(__name__)

# Стабільний secret_key — не змінюється при рестарті
_key_file = Path(__file__).parent / ".panel_secret"
if _key_file.exists():
    app.secret_key = _key_file.read_bytes()
else:
    key = os.urandom(32)
    _key_file.write_bytes(key)
    app.secret_key = key

BASE = Path(__file__).parent.parent          # .claude/
MEMORY_DIR = BASE / "agent-memory"
REPORTS_DIR = BASE / "reports"
PROJECT_ROOT = BASE.parent                   # VSCODE/
CLAUDE_MD = PROJECT_ROOT / "CLAUDE.md"

# Пароль з .env або дефолтний (змінити в .env: PANEL_PASSWORD=your_pass)
PANEL_PASSWORD = os.environ.get("PANEL_PASSWORD", "")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if PANEL_PASSWORD and not session.get("authed"):
            return redirect(url_for("login_page", next=request.path))
        return f(*args, **kwargs)
    return decorated


@app.route("/login", methods=["GET", "POST"])
def login_page():
    error = None
    if request.method == "POST":
        if request.form.get("password") == PANEL_PASSWORD:
            session["authed"] = True
            return redirect(request.args.get("next") or "/")
        error = "Невірний пароль"
    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

# ── Дані агентів ────────────────────────────────────────────────────────────

AGENTS = [
    {
        "id": "orchestrator",
        "name": "Orchestrator",
        "emoji": "🎯",
        "role": "Читає пам'ять → Питання → План → Делегує → Збирає звіт",
        "skills": ["Planning", "Memory", "Delegation", "Parallelism", "Risk Assessment"],
        "color": "#6c63ff",
        "description": "Головний диригент. Стартує з пам'яті, задає уточнення, будує план перед виконанням. Запускає субагентів паралельно.",
        "trigger": "Будь-яка задача",
        "files": ["CLAUDE.md", ".claude/agent-memory/"],
    },
    {
        "id": "code",
        "name": "Code Agent",
        "emoji": "⚡",
        "role": "Продакшн-якісний код на рівні Senior Dev 2026",
        "skills": ["Python 3.12", "TypeScript 5", "aiogram 3.x", "SQLAlchemy 2", "Next.js 15", "Pydantic v2"],
        "color": "#00d4aa",
        "description": "Архітектор коду. Read→Grep→Edit завжди. Async/await, type hints, функції ≤40 рядків. Пропонує кращий дизайн.",
        "trigger": "Новий код, фічі, рефакторинг",
        "files": ["*.py", "*.ts", "*.tsx", "*.html"],
    },
    {
        "id": "bug_hunter",
        "name": "Bug Hunter",
        "emoji": "🔍",
        "role": "Знаходить баги до того як вони потраплять в продакшн",
        "skills": ["Static Analysis", "Pattern Matching", "SQLi Detection", "Race Conditions", "Async Bugs"],
        "color": "#ff6b6b",
        "description": "Детектив. 10+ Grep-патернів: TODO/FIXME, except:, f-SQL, print(), hardcoded secrets, eval(), XSS, missing await, None-checks.",
        "trigger": "Code review, після Code Agent",
        "files": ["BUG_REGISTRY.md"],
    },
    {
        "id": "security",
        "name": "Security Agent",
        "emoji": "🛡️",
        "role": "OWASP Top 10 + Telegram-специфічні вразливості",
        "skills": ["OWASP", "XSS", "SQLi", "CSRF", "Auth Flows", "Secrets Mgmt", "Rate Limiting"],
        "color": "#ffa500",
        "description": "Охоронець. CRITICAL баг — зупиняє все і повідомляє одразу. Чеклист: input validation, auth, output encoding, secrets.",
        "trigger": "Кожна нова фіча з auth/input/API",
        "files": ["*.py routes", "*.env"],
    },
    {
        "id": "reviewer",
        "name": "Reviewer Agent",
        "emoji": "✅",
        "role": "Останній рубіж якості перед 'готово'",
        "skills": ["Code Review", "Performance", "DRY", "N+1 Detection", "UX", "Maintainability"],
        "color": "#4ecdc4",
        "description": "Контролер якості. Pre-finish чеклист: DRY, N+1, dead code, pagination. '+10% правило' — завжди пропонує покращення.",
        "trigger": "Перед фінальним 'готово'",
        "files": ["Будь-який змінений файл"],
    },
    {
        "id": "uiux_designer",
        "name": "UI/UX Designer",
        "emoji": "🎨",
        "role": "SaaS-сайти, лендінги та Telegram WebApp на рівні product designer",
        "skills": ["Visual Hierarchy", "Spacing System", "Typography Scale", "CTA Design", "Mobile UX", "Tailwind v4", "shadcn/ui"],
        "color": "#fd79a8",
        "description": "Думає як product + conversion designer. Читає DESIGN_RULES.md завжди. Тільки design tokens, ніяких inline styles. shadcn/ui + Tailwind замість Bootstrap.",
        "trigger": "Сайти, UI компоненти, Telegram WebApp",
        "files": ["DESIGN_RULES.md", "*.tsx", "*.css", "tailwind.config.*"],
    },
    {
        "id": "design_critic",
        "name": "Design Critic",
        "emoji": "🔎",
        "role": "Аналізує і критикує UI — не пише код",
        "skills": ["Visual Analysis", "Hierarchy Audit", "Contrast Check", "Whitespace Audit", "Motion Review", "Anti-Ugly Rules"],
        "color": "#e17055",
        "description": "8-пунктний аудит: hierarchy, CTA, spacing, color count, typography, mobile, motion, anti-ugly check. Дає конкретні рекомендації.",
        "trigger": "Будь-який UI/UX перед фіналізацією",
        "files": ["DESIGN_RULES.md"],
    },
    {
        "id": "landing_specialist",
        "name": "Landing Specialist",
        "emoji": "🚀",
        "role": "Конверсійні SaaS лендінги — структура + копірайтинг",
        "skills": ["SaaS Structure", "Copywriting", "CTA Psychology", "Pricing Tables", "Section Rhythm", "Social Proof"],
        "color": "#00b894",
        "description": "Знає правильний порядок секцій: Hero→Proof→Problem→Solution→Features→Demo→Pricing→FAQ→CTA. Whitespace між секціями ≥64px.",
        "trigger": "SaaS landing, marketing page, product page",
        "files": ["DESIGN_RULES.md", "app/page.tsx", "*.html"],
    },
    {
        "id": "memory_keeper",
        "name": "Memory Keeper",
        "emoji": "📚",
        "role": "Пам'ять, уроки, звіти, самовдосконалення",
        "skills": ["Pattern Recognition", "Documentation", "Meta-Analysis", "Self-Improvement"],
        "color": "#a29bfe",
        "description": "Летописець. Після кожної задачі: MEMORY.md + BUG_REGISTRY + LESSONS + звіт. Пропонує оновлення CLAUDE.md.",
        "trigger": "Після завершення будь-якої задачі",
        "files": [".claude/agent-memory/MEMORY.md", ".claude/agent-memory/LESSONS.md", ".claude/reports/"],
    },
    {
        "id": "n8n_architect",
        "name": "n8n Architect",
        "emoji": "🔧",
        "role": "n8n workflows, автоматизація, AI-агенти в n8n",
        "skills": ["n8n-as-code", "TypeScript Workflows", "AI Agents", "Webhooks", "Automation"],
        "color": "#e74c3c",
        "description": "VS Code agent для n8n. Ніколи не вигадує node параметри — uses schema-first research. Sync discipline: pull→edit→push→verify.",
        "trigger": "Будь-яка n8n задача",
        "files": [".github/agents/n8n-architect.agent.md", "workflows/"],
    },
]

# ── Парсери ─────────────────────────────────────────────────────────────────

def parse_bugs() -> list[dict]:
    """Robust bug parser — handles missing optional fields."""
    bug_file = MEMORY_DIR / "BUG_REGISTRY.md"
    if not bug_file.exists():
        return []

    text = bug_file.read_text(encoding="utf-8")
    bugs = []

    # Split on bug headers
    sections = re.split(r"(?=### BUG-\d+:)", text)
    for section in sections:
        if not section.strip().startswith("### BUG-"):
            continue

        def _field(name: str, default: str = "—") -> str:
            m = re.search(rf"- {re.escape(name)}: `?(.+?)`?\n", section)
            return m.group(1).strip() if m else default

        def _field_multiword(name: str, default: str = "—") -> str:
            m = re.search(rf"- {re.escape(name)}: (.+?)(?:\n|$)", section)
            return m.group(1).strip() if m else default

        header = re.match(r"### (BUG-\d+): (.+)", section)
        if not header:
            continue

        bugs.append({
            "id": header.group(1).strip(),
            "title": header.group(2).strip(),
            "file": _field("Файл"),
            "severity": _field_multiword("Severity", "MEDIUM"),
            "type": _field_multiword("Тип", "Logic"),
            "desc": _field_multiword("Опис"),
            "fix": _field_multiword("Фікс"),
            "status": _field_multiword("Статус", "OPEN"),
            "date": _field_multiword("Дата", "—"),
        })

    return bugs


def parse_lessons() -> list[dict]:
    lessons_file = MEMORY_DIR / "LESSONS.md"
    if not lessons_file.exists():
        return []

    text = lessons_file.read_text(encoding="utf-8")
    lessons = []

    sections = re.split(r"(?=## Урок \d+:)", text)
    for section in sections:
        if not re.match(r"## Урок \d+:", section.strip()):
            continue

        header = re.match(r"## Урок (\d+): (.+)", section.strip())
        if not header:
            continue

        def _field(label: str) -> str:
            m = re.search(rf"\*\*{re.escape(label)}:\*\* (.+?)(?:\n|$)", section)
            return m.group(1).strip() if m else "—"

        lessons.append({
            "num": header.group(1),
            "title": header.group(2).strip(),
            "what": _field("Що"),
            "why": _field("Чому"),
            "solution": _field("Рішення"),
            "rule": _field("Правило"),
        })

    return lessons


def parse_memory() -> dict:
    mem_file = MEMORY_DIR / "MEMORY.md"
    if not mem_file.exists():
        return {"raw": "# Пам'ять порожня\nMemory Keeper запише першу сесію після задачі."}
    return {"raw": mem_file.read_text(encoding="utf-8")}


def get_reports() -> list[dict]:
    if not REPORTS_DIR.exists():
        return []
    reports = []
    for f in sorted(REPORTS_DIR.glob("*.md"), reverse=True):
        if f.name == "REPORT_TEMPLATE.md":
            continue
        stat = f.stat()
        reports.append({
            "name": f.stem,
            "file": f.name,
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
            "content": f.read_text(encoding="utf-8"),
        })
    return reports


def get_claude_md() -> str:
    if not CLAUDE_MD.exists():
        return "# CLAUDE.md не знайдено"
    return CLAUDE_MD.read_text(encoding="utf-8")


def get_stats() -> dict:
    bugs = parse_bugs()
    lessons = parse_lessons()
    reports = get_reports()
    return {
        "bugs_open": sum(1 for b in bugs if b["status"] == "OPEN"),
        "bugs_fixed": sum(1 for b in bugs if b["status"] == "FIXED"),
        "bugs_critical": sum(1 for b in bugs if b["severity"] == "CRITICAL" and b["status"] == "OPEN"),
        "lessons_count": len(lessons),
        "reports_count": len(reports),
        "agents_count": len(AGENTS),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
@require_auth
def dashboard():
    stats = get_stats()
    bugs = parse_bugs()
    open_bugs = [b for b in bugs if b["status"] == "OPEN"]
    lessons = parse_lessons()
    return render_template("dashboard.html", stats=stats, agents=AGENTS, open_bugs=open_bugs, recent_lessons=lessons[-3:])


@app.route("/agents")
@require_auth
def agents_page():
    return render_template("agents.html", agents=AGENTS)


@app.route("/bugs")
@require_auth
def bugs_page():
    all_bugs = parse_bugs()
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_bugs.sort(key=lambda b: (0 if b["status"] == "OPEN" else 1, severity_order.get(b["severity"], 4)))
    return render_template("bugs.html", bugs=all_bugs)


@app.route("/bugs/add", methods=["POST"])
@require_auth
def add_bug():
    bug_file = MEMORY_DIR / "BUG_REGISTRY.md"
    if not bug_file.exists():
        abort(404)

    existing = parse_bugs()
    # Find max bug number to avoid duplicates
    max_num = max((int(re.search(r"\d+", b["id"]).group()) for b in existing), default=0)
    next_id = f"BUG-{max_num + 1:03d}"

    entry = (
        f"\n### {next_id}: {request.form['title']}\n"
        f"- Файл: `{request.form.get('file', 'невідомо')}`\n"
        f"- Severity: {request.form['severity']}\n"
        f"- Тип: {request.form.get('type', 'Logic')}\n"
        f"- Опис: {request.form['desc']}\n"
        f"- Фікс: {request.form.get('fix', 'TBD')}\n"
        f"- Статус: OPEN\n"
        f"- Дата: {datetime.now().strftime('%Y-%m-%d')}\n"
    )

    content = bug_file.read_text(encoding="utf-8")
    marker = "## Відкриті баги (OPEN)"
    idx = content.find(marker)
    if idx != -1:
        # Insert after the marker line
        end_of_line = content.find("\n", idx) + 1
        content = content[:end_of_line] + entry + content[end_of_line:]
    else:
        content += entry

    bug_file.write_text(content, encoding="utf-8")
    return redirect(url_for("bugs_page"))


@app.route("/bugs/<bug_id>/fix", methods=["POST"])
@require_auth
def fix_bug(bug_id):
    bug_file = MEMORY_DIR / "BUG_REGISTRY.md"
    content = bug_file.read_text(encoding="utf-8")

    # Find the specific bug section and replace only its status
    pattern = re.compile(
        rf"(### {re.escape(bug_id)}:.*?- Статус: )OPEN",
        re.DOTALL
    )
    new_content, count = pattern.subn(r"\1FIXED", content)
    if count:
        bug_file.write_text(new_content, encoding="utf-8")

    return redirect(url_for("bugs_page"))


@app.route("/lessons")
@require_auth
def lessons_page():
    return render_template("lessons.html", lessons=parse_lessons())


@app.route("/lessons/add", methods=["POST"])
@require_auth
def add_lesson():
    lessons_file = MEMORY_DIR / "LESSONS.md"
    existing = parse_lessons()
    next_num = len(existing) + 1

    entry = (
        f"\n## Урок {next_num}: {request.form['title']}\n"
        f"- **Що:** {request.form['what']}\n"
        f"- **Чому:** {request.form['why']}\n"
        f"- **Рішення:** {request.form['solution']}\n"
        f"- **Правило:** {request.form['rule']}\n"
    )

    if lessons_file.exists():
        content = lessons_file.read_text(encoding="utf-8")
        # Insert before the comment at the end
        marker = "<!-- Memory Keeper"
        idx = content.find(marker)
        content = content[:idx] + entry + "\n" + content[idx:] if idx != -1 else content + entry
    else:
        content = "# Lessons Learned\n" + entry

    lessons_file.write_text(content, encoding="utf-8")
    return redirect(url_for("lessons_page"))


@app.route("/memory")
@require_auth
def memory_page():
    return render_template("memory.html", memory=parse_memory())


@app.route("/reports")
@require_auth
def reports_page():
    return render_template("reports.html", reports=get_reports())


@app.route("/claude-md")
@require_auth
def claude_md_page():
    content = get_claude_md()
    return render_template("claude_md.html", content=content)


@app.route("/claude-md/save", methods=["POST"])
@require_auth
def save_claude_md():
    new_content = request.form.get("content", "")
    if new_content and len(new_content) > 100:  # sanity check
        CLAUDE_MD.write_text(new_content, encoding="utf-8")
    return redirect(url_for("claude_md_page"))


@app.route("/design-rules")
@require_auth
def design_rules_page():
    design_rules_file = PROJECT_ROOT / "DESIGN_RULES.md"
    content = design_rules_file.read_text(encoding="utf-8") if design_rules_file.exists() else ""
    return render_template("design_rules.html", content=content)


# ── Chat ─────────────────────────────────────────────────────────────────────

def _build_system_prompt(agent_id: str) -> str:
    agent = next((a for a in AGENTS if a["id"] == agent_id), AGENTS[0])
    claude_md = get_claude_md()
    bugs = parse_bugs()
    lessons = parse_lessons()
    open_bugs = [b for b in bugs if b["status"] == "OPEN"]

    design_md = ""
    design_file = PROJECT_ROOT / "DESIGN_RULES.md"
    if agent_id in ("uiux_designer", "design_critic", "landing_specialist") and design_file.exists():
        design_md = f"\n\n--- DESIGN_RULES.md ---\n{design_file.read_text(encoding='utf-8')}"

    return (
        f"Ти — {agent['name']} {agent['emoji']} в Multi-Agent Dev Platform v3.1.\n"
        f"Роль: {agent['role']}\n"
        f"Скіли: {', '.join(agent['skills'])}\n"
        f"Тригер: {agent['trigger']}\n\n"
        f"--- CLAUDE.md (головні правила системи) ---\n{claude_md}"
        f"{design_md}\n\n"
        f"--- ПОТОЧНИЙ КОНТЕКСТ ---\n"
        f"Відкритих багів: {len(open_bugs)}\n"
        f"Уроків: {len(lessons)}\n"
        f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
        f"Відповідай чітко згідно своєї ролі. "
        f"Якщо задача виходить за межі ролі — скажи якому агенту делегувати."
    )


@app.route("/chat")
@require_auth
def chat_page():
    return render_template("chat.html", agents=AGENTS, anthropic_ok=ANTHROPIC_OK)


@app.route("/api/chat", methods=["POST"])
@require_auth
def api_chat():
    if not ANTHROPIC_OK or _ai_client is None:
        return jsonify({"error": "ANTHROPIC_API_KEY не встановлено. Додай в .env поруч з app.py"}), 400

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    agent_id = data.get("agent_id", "orchestrator")
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Порожнє повідомлення"}), 400

    system_prompt = _build_system_prompt(agent_id)

    messages = []
    for h in history[-12:]:
        role = h.get("role")
        content = (h.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    def generate():
        try:
            with _ai_client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── API ──────────────────────────────────────────────────────────────────────

@app.route("/api/stats")
def api_stats():
    return jsonify(get_stats())


@app.route("/api/bugs")
def api_bugs():
    return jsonify(parse_bugs())


@app.route("/api/lessons")
def api_lessons():
    return jsonify(parse_lessons())


if __name__ == "__main__":
    app.run(debug=False, port=5050, host="127.0.0.1")
