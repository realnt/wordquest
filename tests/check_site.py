from pathlib import Path
root=Path(__file__).resolve().parents[1]
for p in ["index.html","content.js","quest.js","quest.css","unit1-data.js","site.css","site-shell.js","site-version.js","speech.js","speech.css"]+[f"unit{i}.html" for i in range(1,7)]:
 assert (root/p).is_file(),f"Missing: {p}"
for i in range(1,7):
 html=(root/f"unit{i}.html").read_text(encoding="utf8")
 assert 'speech.js' in html and 'speech.css' in html,f"Missing speech assets: Unit {i}"
for p in ["quest.js"]:
 data=(root/p).read_text(encoding="utf8")
 assert 'speak-word' in data and 'speak-sentence' in data,f"Missing controls: {p}"
assert "semester_v1" in (root/"quest.js").read_text()
assert "wordquest_speech_accent_v1" in (root/"speech.js").read_text(encoding="utf8")
assert "speech-accent-control" in (root/"speech.css").read_text(encoding="utf8")
assert "wordquest_speech_speed_v1" in (root/"speech.js").read_text(encoding="utf8")
assert "speech-speed-range" in (root/"speech.css").read_text(encoding="utf8")
assert "wordquest_speech_voice_v1" in (root/"speech.js").read_text(encoding="utf8")
assert "speech-voice-select" in (root/"speech.js").read_text(encoding="utf8")
assert "Automatic</option>" not in (root/"speech.js").read_text(encoding="utf8")
assert "background-image:linear-gradient" in (root/"speech.css").read_text(encoding="utf8")
for page in ["index.html"]+[f"unit{i}.html" for i in range(1,7)]:
 assert 'site-version.js' in (root/page).read_text(encoding="utf8"),f"No version script on {page}"
assert "const VERSION='1.5.3'" in (root/"site-version.js").read_text(encoding="utf8")
speech=(root/"speech.js").read_text(encoding="utf8")
assert "speech-settings-trigger" in speech and "speech-settings-confirm" in speech
assert "new MutationObserver(ensureControl)" in speech
for i in range(1,7):
 html=(root/f"unit{i}.html").read_text(encoding="utf8")
 assert 'site.css' in html and 'site-shell.js' in html,f"Missing shared layout: Unit {i}"
 assert '<style' not in html and '<script>' not in html,f"Embedded code: Unit {i}"
 assert 'quest.js' in html and 'quest.css' in html,f"Wrong engine/styles on Unit {i}"
 assert 'unit1.js' not in html and 'unit1.css' not in html,f"Old Unit 1 engine still loaded"
if (root/"unit1.html").read_text(encoding="utf8").count('unit1-data.js')!=1:
 raise AssertionError("Unit 1 textbook data missing")
assert 'site-shell.js' in (root/"index.html").read_text(encoding="utf8")
assert 'wordquest_g7u1_v1' in (root/"quest.js").read_text(encoding="utf8")
assert 'const missions=[' in (root/"unit1-data.js").read_text(encoding="utf8")
assert 'wordquest_g7u' in (root/"quest.js").read_text(encoding="utf8")
for name in ["playwright.config.js", "tests/browser/wordquest.spec.js", "tests/check_content.js"]:
 assert (root/name).is_file(),f"Missing regression test: {name}"
assert "practice:true" in (root/"quest.js").read_text(encoding="utf8")
print("Word Quest v1.5.3 static checks passed")
