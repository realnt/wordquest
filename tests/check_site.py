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
print("Word Quest v1.4.3 static checks passed")
