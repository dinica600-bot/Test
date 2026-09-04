#!/usr/bin/env python3
"""
audit.py — inventar + scanare de backdoor-uri pentru un pachet de serverfiles Metin2.

Read-only: citeste fisiere si scrie un raport. Nu executa nimic, nu modifica nimic.

    python3 tools/audit.py /cale/catre/pachet -o docs/audit-rezultat.md

Rezultatul NU e o concluzie, e un punct de plecare. Fiecare semnalare se
verifica manual — vezi docs/securitate.md.
"""

import argparse
import os
import re
import sys
from collections import Counter, defaultdict

MAX_SCAN_BYTES = 4 * 1024 * 1024        # fisiere mai mari nu se scaneaza textual
SOURCE_EXT = {".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp", ".inl"}
QUEST_EXT = {".quest", ".lua"}
WEB_EXT = {".php", ".phtml", ".inc"}
PY_EXT = {".py"}
TEXT_EXT = SOURCE_EXT | QUEST_EXT | WEB_EXT | PY_EXT | {
    ".txt", ".cfg", ".conf", ".ini", ".sql", ".sh", ".mk", ".md", ".json", ".xml",
}
SKIP_DIRS = {".git", ".svn", "node_modules", "__pycache__"}

# (id, descriere, regex, extensii tinta)
PATTERNS = [
    ("EXEC", "executie de comenzi / procese",
     r"\b(system|popen|execl|execlp|execle|execv|execvp|execve)\s*\(", SOURCE_EXT),
    ("NET", "conexiuni catre exterior",
     r"\b(connect|inet_addr|inet_pton|gethostbyname|getaddrinfo|curl_easy_\w+)\s*\(", SOURCE_EXT),
    ("IP", "adresa IP scrisa in cod",
     r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])", SOURCE_EXT | QUEST_EXT | PY_EXT),
    ("URL", "URL scris in cod",
     r"https?://[^\s\"'<>)]+", SOURCE_EXT | QUEST_EXT | PY_EXT),
    ("GM", "acordare de privilegii GM",
     r"\b(SetGMLevel|GM_IMPLEMENTOR|GM_HIGH_WIZARD|GM_GOD|gm_get_level)\b", SOURCE_EXT),
    ("NAMECHK", "comparatie pe nume de personaj / cont",
     r"str(n?case)?cmp\s*\(\s*[^,)]*(GetName|GetAccountName|GetPlayerName)", SOURCE_EXT),
    ("OBF", "posibila ofuscare",
     r"\b(base64_decode|b64decode|gzinflate|gzuncompress|str_rot13|unhex)\b", SOURCE_EXT | WEB_EXT | PY_EXT),
    ("SUSP", "cuvinte tipice de backdoor",
     r"\b(backdoor|bypass_?check|hidden_?cmd|admin123|test123)\b", SOURCE_EXT | QUEST_EXT | WEB_EXT | PY_EXT),
    ("QLUA", "quest care iese din sandbox",
     r"\b(os\.\w+|io\.\w+|loadstring|dofile|require)\s*[\(\"']", QUEST_EXT),
    ("PHPEXEC", "executie din PHP",
     r"\b(eval|assert|shell_exec|passthru|proc_open|popen|system)\s*\(", WEB_EXT),
    ("PHPRE", "preg_replace cu modificator /e",
     r"preg_replace\s*\([^)]*/[a-z]*e[a-z]*['\"]", WEB_EXT),
    ("STDCXX", "-lstdc++ in flag-uri de link (capcana libc++/libstdc++)",
     r"-lstdc\+\+|/lib/gcc[\w.\-/]*", {".mk", ""}),
]

PROTO_HINTS = re.compile(
    r"\b(item_proto|mob_proto|ReadItemProto\w*|ReadMobProto\w*|ProtoReader|"
    r"item_names|mob_names)\b", re.I)


def is_makefile(name):
    return name == "Makefile" or name.startswith("Makefile.") or name.endswith(".mk")


def walk(root):
    """Genereaza (cale_absoluta, cale_relativa) fara sa urmeze symlink-uri."""
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            if os.path.islink(full):
                continue
            yield full, os.path.relpath(full, root)


def read_text(path):
    try:
        with open(path, "rb") as fh:
            raw = fh.read(MAX_SCAN_BYTES)
    except OSError:
        return None
    if b"\x00" in raw[:4096]:          # binar
        return None
    return raw.decode("utf-8", errors="replace")


def scannable(name, size):
    ext = os.path.splitext(name)[1].lower()
    if is_makefile(name):
        return ""                      # cheia pentru pattern-urile de Makefile
    if ext in TEXT_EXT and size <= MAX_SCAN_BYTES:
        return ext
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root", help="radacina pachetului despachetat")
    ap.add_argument("-o", "--out", default="-", help="fisier de raport (implicit: stdout)")
    ap.add_argument("--max-hits", type=int, default=40,
                    help="cate rezultate se afiseaza per categorie (implicit 40)")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        sys.exit("Nu e un director: " + root)

    ext_count = Counter()
    ext_bytes = Counter()
    total_files = 0
    total_bytes = 0
    findings = defaultdict(list)
    key_files = defaultdict(list)
    proto_refs = []
    makefiles = []
    big_files = []

    compiled = [(pid, desc, re.compile(rx), exts) for pid, desc, rx, exts in PATTERNS]

    for full, rel in walk(root):
        try:
            size = os.path.getsize(full)
        except OSError:
            continue
        total_files += 1
        total_bytes += size
        name = os.path.basename(rel)
        ext = os.path.splitext(name)[1].lower()
        ext_count[ext or "(fara)"] += 1
        ext_bytes[ext or "(fara)"] += size

        if size > 50 * 1024 * 1024:
            big_files.append((size, rel))

        low = name.lower()
        if low in ("config", "conf.txt", "my.cnf"):
            key_files["config"].append(rel)
        elif "proto" in low:
            key_files["proto"].append(rel)
        elif low in ("quest_list", "questlist"):
            key_files["quest_list"].append(rel)
        elif low.endswith("_names.txt") or low.startswith("locale_"):
            key_files["locale"].append(rel)
        elif low in ("game", "db", "auth") and size > 100_000:
            key_files["binar"].append(rel)
        elif low in ("start.sh", "stop.sh", "restart.sh", "make.sh", "build.sh"):
            key_files["script"].append(rel)
        if is_makefile(name):
            makefiles.append(rel)
            key_files["makefile"].append(rel)

        key = scannable(name, size)
        if key is None:
            continue
        text = read_text(full)
        if text is None:
            continue
        lines = text.splitlines()

        for pid, desc, rx, exts in compiled:
            if key not in exts:
                continue
            for i, line in enumerate(lines, 1):
                if rx.search(line):
                    findings[(pid, desc)].append((rel, i, line.strip()[:160]))

        if key in SOURCE_EXT or key == "":
            for i, line in enumerate(lines, 1):
                if PROTO_HINTS.search(line):
                    proto_refs.append((rel, i, line.strip()[:160]))

    out = sys.stdout if args.out == "-" else open(args.out, "w", encoding="utf-8")
    w = out.write

    w("# Raport de audit — pachet serverfiles\n\n")
    w("> Generat de `tools/audit.py`. **Nu e o concluzie, e un punct de plecare.**\n")
    w("> Fiecare semnalare se verifica manual — vezi `docs/securitate.md`.\n")
    w("> Un rezultat gol nu inseamna „curat\", inseamna „nu a prins pattern-urile astea\".\n\n")
    w("Radacina: `%s`\n\n" % root)
    w("## 1. Dimensiune\n\n")
    w("- fisiere: **%d**\n- total: **%.2f GB**\n\n" % (total_files, total_bytes / 1e9))

    w("### Extensii dupa volum (top 15)\n\n| ext | fisiere | MB |\n|---|---|---|\n")
    for ext, nbytes in ext_bytes.most_common(15):
        w("| `%s` | %d | %.1f |\n" % (ext, ext_count[ext], nbytes / 1e6))
    w("\n")

    if big_files:
        w("### Fisiere peste 50 MB\n\n")
        for size, rel in sorted(big_files, reverse=True)[:20]:
            w("- %.0f MB — `%s`\n" % (size / 1e6, rel))
        w("\n")

    w("## 2. Fisiere-cheie gasite\n\n")
    labels = {"config": "Configurari", "proto": "Proto-uri", "quest_list": "Liste de quest-uri",
              "locale": "Locale / nume", "binar": "Binare de server", "script": "Scripturi",
              "makefile": "Makefile-uri"}
    for cat in ("binar", "config", "proto", "locale", "quest_list", "script", "makefile"):
        items = key_files.get(cat, [])
        w("### %s (%d)\n\n" % (labels[cat], len(items)))
        if not items:
            w("_niciunul gasit — verifica manual, poate au alte nume in pachetul asta_\n\n")
            continue
        for rel in sorted(items)[:25]:
            w("- `%s`\n" % rel)
        if len(items) > 25:
            w("- _... si inca %d_\n" % (len(items) - 25))
        w("\n")

    w("## 3. Proto-uri: ce citeste sursa\n\n")
    w("Referinte la proto-uri si la fisierele de nume, in sursa si Makefile-uri.\n")
    w("**Intrebarea la care raspunzi cu asta:** citeste serverul din fisier sau din DB?\n")
    w("(vezi `docs/dezvoltare.md` §4)\n\n")
    if proto_refs:
        for rel, i, line in proto_refs[:args.max_hits]:
            w("- `%s:%d` — `%s`\n" % (rel, i, line))
        if len(proto_refs) > args.max_hits:
            w("- _... si inca %d referinte_\n" % (len(proto_refs) - args.max_hits))
    else:
        w("_nicio referinta gasita in sursa — proto-urile pot fi doar fisiere de date_\n")
    w("\n")

    w("## 4. Semnalari de verificat\n\n")
    if not findings:
        w("_niciun pattern nu a dat rezultate_\n\n")
    for (pid, desc), hits in sorted(findings.items(), key=lambda kv: -len(kv[1])):
        w("### [%s] %s — %d rezultate\n\n" % (pid, desc, len(hits)))
        for rel, i, line in hits[:args.max_hits]:
            w("- `%s:%d` — `%s`\n" % (rel, i, line))
        if len(hits) > args.max_hits:
            w("- _... si inca %d (ruleaza cu --max-hits mai mare)_\n" % (len(hits) - args.max_hits))
        w("\n")

    w("## 5. Ce NU acopera scriptul asta\n\n")
    w("- binarele (ruleaza `strings` si `ldd` manual pe `game` / `db`)\n")
    w("- baza de date (`common.gmlist`, conturi neasteptate)\n")
    w("- VPS-ul (cron, chei SSH, porturi, procese)\n")
    w("- logica: un backdoor scris curat nu contine niciunul din cuvintele de mai sus\n\n")
    w("Vezi `docs/securitate.md` pentru pasii care cer ochi de om.\n")

    if out is not sys.stdout:
        out.close()
        print("Raport scris in %s (%d fisiere parcurse, %d categorii cu rezultate)"
              % (args.out, total_files, len(findings)))


if __name__ == "__main__":
    main()
