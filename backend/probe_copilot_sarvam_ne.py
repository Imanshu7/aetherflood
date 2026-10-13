"""Sarvam-backed Copilot in Nepali, with follow-up context and comparisons."""
import json, time, urllib.request, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000"

def ask(query, lang="en", incident="nepal-tibet-2026-08-26", history=None):
    body = json.dumps({
        "query": query, "incident_id": incident, "language": lang,
        "mode": "offline", "history": history or [],
    }).encode()
    req = urllib.request.Request(
        BASE + "/api/copilot/chat", data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    t0 = time.monotonic()
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r), time.monotonic() - t0

def text_of(d):
    r = d.get("reply")
    return (r.get("summary") if isinstance(r, dict) else d.get("summary")) or ""

fails = []

print("=" * 78)
print("NEPALI via Sarvam")
d, el = ask("What happened in this incident and what is still unverified?", lang="ne")
t = text_of(d)
dev = sum(1 for c in t if "\u0900" <= c <= "\u097f")
pct = round(dev / max(len(t), 1) * 100)
tr = d.get("translation") or {}
print(f"  provider={d.get('provider')} lang={d.get('language')} {el:.2f}s")
print(f"  devanagari={pct}%  translation={tr.get('status')} provider={tr.get('provider')}")
print(f"  proof={str(d.get('audit_proof'))[:40]}")
print("  -> " + t[:240].replace("\n", " "))
if d.get("provider") != "sarvam":
    fails.append("nepali answer not from sarvam")
if pct < 25:
    fails.append(f"nepali answer not in Devanagari ({pct}%)")

print("\n" + "=" * 78)
print("FOLLOW-UP CONTEXT (reference resolution)")
first = "What happened in this incident?"
d1, _ = ask(first)
d2, _ = ask("Which bridges were reported affected?", history=[
    {"role": "user", "content": first},
    {"role": "assistant", "content": text_of(d1)[:400]},
])
t2 = text_of(d2)
print(f"  provider={d2.get('provider')}")
print("  -> " + t2[:240].replace("\n", " "))
if d2.get("provider") != "sarvam":
    fails.append("follow-up not from sarvam")
if not t2.strip():
    fails.append("follow-up empty")

print("\n" + "=" * 78)
print("COMPARISON (must stay deterministic, not Sarvam)")
d3, _ = ask("Compare this with the August Trishuli flood.",
            incident="budhi-gandaki-2026-10-11",
            history=[{"role": "user", "content": "What happened in the Budhi Gandaki incident?"},
                     {"role": "assistant", "content": "Budhi Gandaki Flood, Chumchet landslide."}])
t3 = text_of(d3)
print(f"  provider={d3.get('provider')}")
print("  mentions Budhi Gandaki:", "Budhi Gandaki" in t3)
print("  mentions Trishuli/Nepal-Tibet:", ("Trishuli" in t3) or ("Nepal" in t3))
print("  has side-by-side:", "Side-by-side" in t3)
if "Side-by-side" not in t3:
    fails.append("comparison lost its verified side-by-side structure")
if d3.get("provider") == "sarvam":
    fails.append("comparison was routed to Sarvam (should be deterministic)")

print("\n" + "=" * 78)
if fails:
    print("FAILURES:")
    for f in fails:
        print("  XX " + f)
    sys.exit(1)
print("ALL SARVAM COPILOT NEPALI/CONTEXT/COMPARISON CHECKS PASSED")