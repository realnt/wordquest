from pathlib import Path
root=Path(__file__).resolve().parents[1]
for p in ["index.html","content.js","quest.js","quest.css","speech.js","speech.css"]+[f"unit{i}.html" for i in range(1,7)]:
 assert (root/p).is_file(),f"Missing: {p}"
for i in range(1,7):
 html=(root/f"unit{i}.html").read_text(encoding="utf8")
 assert 'speech.js' in html and 'speech.css' in html,f"Missing speech assets: Unit {i}"
for p in ["quest.js","unit1.html"]:
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
assert "const VERSION='1.4.7'" in (root/"site-version.js").read_text(encoding="utf8")
speech=(root/"speech.js").read_text(encoding="utf8")
assert "speech-settings-trigger" in speech and "speech-settings-confirm" in speech
assert "new MutationObserver(ensureControl)" in speech
print("Word Quest v1.4.7 static checks passed")
