"""Rebuild src/features/vocabulary/frequency.json with up to 2000 words per course.

Usage: python3 scripts/extend-frequency.py /path/to/frequency-files [count]

Same sources and filters as scripts/import-vocabulary.py:
  de/en/es/fr/it/pl/ru/pt/hr.txt  FrequencyWords 2018 (Hermit Dave, CC BY-SA 4.0)
  ga.txt                          Irish Word Frequency List (Měchura, ODbL 1.0)
  gsw.txt                         NTREX Zurich German reference (CC BY-SA 4.0)
Serbo-Croatian (sh) uses the Croatian list (hr.txt).
"""
from collections import Counter
import json
from pathlib import Path
import re
import sys
import unicodedata

frequency_dir = Path(sys.argv[1])
count = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
destination = Path(__file__).resolve().parent.parent / "src/features/vocabulary/frequency.json"
sources = {"de": "de", "en": "en", "es": "es", "fr": "fr", "ru": "ru", "pl": "pl", "gsw": "gsw",
           "it": "it", "ga": "ga", "pt": "pt", "sh": "hr"}


def key(word):
    return unicodedata.normalize("NFC", word).casefold().replace("’", "'")


def rank_words(course, file):
    source = (frequency_dir / (file + ".txt")).read_text(encoding="utf-8-sig")
    if file == "gsw":
        tokens = re.findall(r"[^\W\d_]+(?:['’-][^\W\d_]+)*", source)
        candidates = (word for word, _ in Counter(map(key, tokens)).most_common())
    elif file == "ga":
        candidates = (row.split("\t")[1] for row in source.splitlines() if re.match(r"^\d+\t", row))
    else:
        candidates = (row.rsplit(maxsplit=1)[0] for row in source.splitlines() if row.strip())

    words = {}
    for word in candidates:
        word = word.strip()
        normalized = key(word)
        if not re.fullmatch(r"[^\W\d_]+(?:['’-][^\W\d_]+)*", word):
            continue
        if file == "ru" and not re.fullmatch(r"[а-яё]+(?:[-'][а-яё]+)*", normalized):
            continue
        # The subtitle lists contain stray single letters; keep only real words.
        if len(normalized) == 1 and file not in ("ga", "gsw") and normalized not in {"a", "i", "o", "y", "e", "u", "à", "è", "w", "z", "v", "k", "s", "и", "в", "с", "к", "я", "а", "о", "у"}:
            continue
        words.setdefault(normalized, "I" if file == "en" and word == "i" else word)
        if len(words) == count:
            break
    return list(words.values())


previous = json.loads(destination.read_text(encoding="utf-8"))
result = {}
for course, file in sources.items():
    words = rank_words(course, file)
    old = previous.get(course, [])
    same = sum(1 for a, b in zip(old, words) if a == b)
    print(f"{course}: {len(words)} words" + (f", first {len(old)} unchanged: {same}/{len(old)}" if old else " (new)"))
    result[course] = words

content = ",\n".join(f"  {json.dumps(lang)}: {json.dumps(words, ensure_ascii=False, separators=(',', ':'))}"
                     for lang, words in result.items())
destination.write_text("{\n" + content + "\n}\n", encoding="utf-8")
