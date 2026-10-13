"""Compare answer depth after raising the token/word budget."""
import json, time, urllib.request, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://127.0.0.1:8000"

def ask(query, lang="en", incident="nepal-tibet-2026-08-26", history=None):
    body = json.dumps({"query": query, "incident_id": incident, "language": lang,
                       "mode": "offline", "history": history or []}).encode()
    req = urllib.request.Request(BASE + "/api/copilot/chat", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    t0 = time.monotonic()
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r), time.monotonic() - t0

def text_of(d):
    r = d.get("reply")
    return (r.get("summary") if isinstance(r, dict) else d.get("summary")) or ""

# Before this change answers ran 1150-3000 chars / ~250-word cap.
CASES = [
    "What happened in this incident?",
    "What is known and what is still unverified?",
    "Give me a full briefing on the damage and response.",
    "What is the confirmed death toll?",
]
fails = []
print("=" * 80)
for q in CASES:
    d, el = ask(q)
    t = text_of(d)
    w = len(t.split())
    bullets = t.count("\n- ") + t.count("\n• ")
    print(f"\nQ: {q}")
    print(f"   provider={d.get('provider')}  {el:.2f}s  chars={len(t)}  words={w}  bullets={bullets}")
    print(f"   facts={len(d.get('verified_facts') or [])} sources={len(d.get('sources') or [])}")
    print("   -> " + t[:190].replace("\n", " "))
    if d.get("provider") != "sarvam":
        fails.append(f"not sarvam: {q}")
    if not t.strip():
        fails.append(f"empty: {q}")

print("\n" + "=" * 80)
print("HONESTY STILL HOLDS AT HIGHER TOKEN BUDGET")
d, _ = ask("What is the confirmed death toll?")
t = text_of(d).lower()
bad = [w for w in ("death toll is 0", "no one died", "confirmed death toll is 1",
                   "death toll is 4", "casualty total is") if w in t]
marks = [m for m in ("unavailable", "not confirmed", "no confirmed", "unverified") if m in t]
print("   invents a number:", bool(bad), bad or "")
print("   marks unknown  :", bool(marks), marks[:3])
if bad:
    fails.append("invented a casualty number at higher token budget")
if not marks:
    fails.append("stopped marking the casualty gap")

print("\n" + "=" * 80)
if fails:
    print("FAILURES:")
    for f in fails:
        print("  XX " + f)
    sys.exit(1)
print("ALL TOKEN-RAISE CHECKS PASSED")