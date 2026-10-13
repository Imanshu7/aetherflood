"""Focused checks for the partial-translation coverage guard."""
import sys
sys.path.insert(0, ".")
from backend.services import sarvam_translate as st

src = """# Nepal-Tibet Floods - Situation Report
**Incident:** Nepal-Tibet Floods (2026-08-26) in Rasuwa district
## Executive summary
Flooding severed road access to four rural municipalities this week.
- Source line one with enough letters to be checked
"""

ok = []
bad = []

# Fully translated -> coverage 1.0
t_ne = """# नेपाल-तिब्बत बाढी - परिस्थिति प्रतिवेदन
**घटना:** नेपाल-तिब्बत बाढी (2026-08-26) रसुवा जिल्ला
## कार्यकारी सारांश
यस हप्ता चार ग्रामीण नगरपालिकाको सडक पहुँच टुटियो।
- स्रोत पंक्ति पर्याप्त अक्षर भएर जाँच गरिएको
"""
c = st.heading_coverage(src, t_ne)
(ok if c == 1.0 else bad).append(f"full translation coverage == 1.0 (got {c})")

# Title left English -> coverage must drop below the floor
t_partial = """# DISASTER SITUATION REPORT
**घटना:** नेपाल-तिब्बत बाढी (2026-08-26) रसुवा जिल्ला
## कार्यकारी सारांश
यस हप्ता चार ग्रामीण नगरपालिकाको सडक पहुँच टुटियो।
- स्रोत पंक्ति पर्याप्त अक्षर भएर जाँच गरिएको
"""
c2 = st.heading_coverage(src, t_partial)
(ok if c2 < st.HEADING_COVERAGE_FLOOR else bad).append(
    f"english title detected as partial (coverage {c2:.2f} < {st.HEADING_COVERAGE_FLOOR})")

# Short labels are not themselves checked, but they must stay positionally
# aligned so a substantive source line is never judged against a short target.
t_short = """# नेपाल-तिब्बत बाढी
**घटना:** रसुवा
## कार्यकारी सारांश
यस हप्ता चार ग्रामीण नगरपालिकाको सडक पहुँच टुटियो।
- स्रोत पंक्ति पर्याप्त अक्षर भएर जाँच गरिएको
"""
c3 = st.heading_coverage(src, t_short)
(ok if c3 == 1.0 else bad).append(f"aligned short lines count as complete (got {c3})")

# Truncated translation must count as incomplete, not silently pass
c4 = st.heading_coverage(src, t_ne.split("\n")[0])
(ok if c4 < st.HEADING_COVERAGE_FLOOR else bad).append(
    f"truncated output detected as partial (coverage {c4:.2f})")

# Empty inputs must not raise
c5 = st.heading_coverage("", "")
(ok if c5 == 1.0 else bad).append(f"empty input safe (got {c5})")

# An unsupported target must be rejected before any network call
try:
    st.translate_text("hello", target_lang="fr")
    bad.append("unsupported language raises SarvamError")
except st.SarvamError as e:
    (ok if e.code == "unsupported_language" else bad).append(f"unsupported language -> {e.code}")

# Empty input must be rejected, not sent to the provider
try:
    st.translate_text("   ")
    bad.append("empty input raises SarvamError")
except st.SarvamError as e:
    (ok if e.code == "empty_input" else bad).append(f"empty input -> {e.code}")

print("PASS:")
for m in ok:
    print("  OK  " + m)
if bad:
    print("FAIL:")
    for m in bad:
        print("  XX  " + m)
    sys.exit(1)
print(f"\nALL {len(ok)} COVERAGE TESTS PASSED")