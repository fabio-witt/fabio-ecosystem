"""Import Lingora's vocabulary from the supplied LERNWERK and frequency files.

Usage: python3 scripts/import-vocabulary.py /path/to/sprachlernapp /path/to/frequency-files
The frequency directory contains de/en/es/fr/it/pl/ru.txt (FrequencyWords 2018),
ga.txt (Měchura's list) and gsw.txt (NTREX Zurich reference sentences).
"""
from collections import Counter
import json
from pathlib import Path
import re
import sys
import unicodedata

archive, frequency_dir = map(Path, sys.argv[1:])
destination = Path(__file__).resolve().parent.parent / "src/features/vocabulary"

THEMES = (
    "First words", "Numbers and quantities", "Family and people", "Home", "Food",
    "Drinks and dining", "Travel and transport", "Town and places", "Work and office",
    "School and learning", "Technology", "Body and health", "Clothing and shopping",
    "Nature and weather", "Animals", "Sports and leisure", "Feelings and personality",
    "Time and calendar", "Everyday verbs", "Conversation",
)

def read_json_assignment(file):
    text = file.read_text(encoding="utf-8-sig")
    return json.JSONDecoder().raw_decode(text[text.index("{"):])[0]

def key(word):
    return unicodedata.normalize("NFC", word).casefold().replace("’", "'")

def compact_file(file, groups):
    content = ",\n".join(
        f"  {json.dumps(lang)}: {json.dumps(group, ensure_ascii=False, separators=(',', ':'))}"
        for lang, group in groups.items()
    )
    file.write_text("{\n" + content + "\n}\n", encoding="utf-8")

def rank_words(language):
    source = (frequency_dir / (language + ".txt")).read_text(encoding="utf-8-sig")
    if language == "gsw":
        tokens = re.findall(r"[^\W\d_]+(?:['’-][^\W\d_]+)*", source)
        candidates = (word for word, _ in Counter(map(key, tokens)).most_common())
    elif language == "ga":
        candidates = (row.split("\t")[1] for row in source.splitlines() if re.match(r"^\d+\t", row))
    else:
        candidates = (row.rsplit(maxsplit=1)[0] for row in source.splitlines() if row.strip())

    words = {}
    for word in candidates:
        word = word.strip()
        normalized = key(word)
        if not re.fullmatch(r"[^\W\d_]+(?:['’-][^\W\d_]+)*", word):
            continue
        if language == "ru" and not re.fullmatch(r"[а-яё]+(?:[-'][а-яё]+)*", normalized):
            continue
        words.setdefault(normalized, "I" if language == "en" and word == "i" else word)
        if len(words) == 500:
            break
    if len(words) != 500:
        raise ValueError(f"{language}: expected 500 unique lexical entries")
    return list(words.values())

lessons = json.loads((destination.parent / "learn/grammarfirst.json").read_text())
source = read_json_assignment(archive / "data.js")["languages"]
stories = read_json_assignment(archive / "stories-data.js")
short_courses = read_json_assignment(archive / "course-data-v48.js")

def examples_for(course):
    examples = []
    for unit in course["units"]:
        for lesson in unit["lessons"]:
            examples += [{"text": pair[0], **({"translation": pair[1]} if len(pair) > 1 else {})}
                         for pair in lesson["examples"]]
        if "reading" in unit:
            r = unit["reading"]
            examples.append({"text": r["text"].replace("**", ""),
                             **({"translation": r["tr"]} if r.get("tr") else {})})
    examples.extend({"text": story["text"]} for story in stories.get(course["id"], []))
    examples.extend({"text": pair[0]} for lesson in source.get(course["id"], {}).get("grammar", [])
                    for pair in lesson["examples"])
    examples.extend({"text": pair["target"]} for lesson in short_courses.get(course["id"], {}).get("lessons", [])
                    for pair in lesson["pairs"])
    return examples

def terms_in(text, terms):
    normalized = key(text)
    return {term for term in terms if re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", normalized)}

def context_for(examples, current, previous):
    ranked = []
    for example in examples:
        focus = terms_in(example["text"], current)
        review = terms_in(example["text"], previous) - focus
        if focus:
            ranked.append((len(focus) + min(len(review), 3), len(focus), len(review), example))
    ranked.sort(key=lambda item: item[:3], reverse=True)
    result = []
    used = set()
    for _, focus, review, example in ranked:
        if example["text"] in used:
            continue
        result.append({**example, "focus": focus, "review": review})
        used.add(example["text"])
        if len(result) == 2:
            break
    return result

thematic = {}
frequency = {}
for course in lessons:
    lang = course["id"]
    frequency[lang] = rank_words(lang)
    if lang not in source:
        continue
    categories = source[lang]["vocab"]
    english = source["en"]["vocab"]
    if len(categories) != len(THEMES):
        raise ValueError(f"{lang}: unexpected category count")
    examples = examples_for(course)
    previous = set()
    groups = []
    previous_example = None
    for name, category, english_category in zip(THEMES, categories, english):
        seen = set()
        if len(category["items"]) != len(english_category["items"]):
            raise ValueError(f"{lang}: mismatched glossary lengths for {name}")
        pairs = []
        for item, english_item in zip(category["items"], english_category["items"]):
            term = item[0]
            german = item[0] if lang == "de" else item[1]
            if german != english_item[1]:
                raise ValueError(f"{lang}: gloss does not align for {term}")
            if key(term) not in seen:
                pairs.append([term, english_item[0]])
                seen.add(key(term))

        # Select words from the same theme that actually occur in the best
        # available context, then fill out the list in the source's order.
        selection = context_for(examples, seen, previous)
        priority = set()
        for example in selection:
            priority.update(terms_in(example["text"], seen))
        priority_words = [pair for pair in pairs if key(pair[0]) in priority]
        words = (priority_words + [pair for pair in pairs if key(pair[0]) not in priority])[:20]
        seen = {key(pair[0]) for pair in words}
        if len(words) != 20:
            raise ValueError(f"{lang}: {name} is incomplete")
        contextual = context_for(examples, seen, previous)
        group = {"title": name, "words": words, "examples": contextual}
        if previous_example and not any(example["review"] for example in contextual):
            if all(example["text"] != previous_example["text"] for example in contextual):
                group["recap"] = previous_example
        if contextual:
            previous_example = {"theme": name, **contextual[0]}
        groups.append(group)
        previous.update(seen)
    thematic[lang] = groups

compact_file(destination / "themes.json", thematic)
compact_file(destination / "frequency.json", frequency)
print(f"{len(thematic)} languages with {len(THEMES)} themes of 20 entries; {len(frequency)} frequency lists of 500.")
