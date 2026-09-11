"""Build compact champion changelog summaries from the Official Paladins Wiki."""

from __future__ import annotations

import argparse
import html
import json
import mimetypes
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import OrderedDict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CHAMPION_DATA = ROOT / "public" / "data" / "champion-data.json"
OUTPUT = ROOT / "public" / "data" / "champion-changelogs.json"
IMAGE_ROOT = ROOT / "public" / "images" / "champion-history"
API = "https://paladins.fandom.com/api.php"
USER_AGENT = "PaladinsCat/1.0 (https://paladinscat.com)"
PAGE_ALIASES = {"Vii": "VII"}

CATEGORY_ALIASES = {
    "ability": "Abilities",
    "abilities": "Abilities",
    "weapon": "Weapon",
    "weapons": "Weapon",
    "talent": "Talents",
    "talents": "Talents",
    "legendary card": "Talents",
    "legendary cards": "Talents",
    "card": "Cards",
    "cards": "Cards",
    "general": "General",
    "bug fix": "Fixes",
    "bug fixes": "Fixes",
    "fixes": "Fixes",
}
CATEGORY_ORDER = {name: index for index, name in enumerate(("General", "Weapon", "Abilities", "Talents", "Cards", "Fixes"))}
NUMBER = r"(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d*)?|\.\d+)"
VALUE = rf"[+-]?{NUMBER}(?:\s*\|\s*[+-]?{NUMBER})?(?:%|s|/tick| units?)?"
TRANSITION = re.compile(rf"(?P<prefix>.*?)(?P<old>{VALUE})\s*(?:→|\bto\b)\s*(?P<new>{VALUE})(?P<suffix>.*)", re.I)


def api_json(params: dict[str, str]) -> dict[str, Any]:
    url = f"{API}?{urllib.parse.urlencode(params)}"
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)
    raise RuntimeError("Unreachable API retry state")


def slug(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def strip_markup(value: str) -> str:
    value = value.replace("{{v}}", "→").replace("{{V}}", "→").replace("{{!}}", "|")
    value = re.sub(r"<ref\b[^>]*>.*?</ref>|<ref\b[^>]*/>", "", value, flags=re.I | re.S)
    value = re.sub(r"\[\[File:[^\]]+\]\]", "", value, flags=re.I)
    value = re.sub(r"\[\[[^]|]+\|([^]]+)\]\]", r"\1", value)
    value = re.sub(r"\[\[([^]]+)\]\]", r"\1", value)
    for _ in range(3):
        value = re.sub(r"\{\{[^{}|]+\|([^{}]+)\}\}", lambda match: match.group(1).split("|")[-1], value)
        value = re.sub(r"\{\{[^{}]+\}\}", "", value)
    def expand_scaling(match: re.Match[str]) -> str:
        base = float(match.group(1))
        step = float(match.group(2))
        return f"{base:g}|{step:g}"
    value = re.sub(r"\{\s*(?:scale\s*=\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\|\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}", expand_scaling, value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("'''", "").replace("''", "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip(" -–—:.;\ufeff")


def changelog_blocks(wikitext: str) -> list[str]:
    heading = re.search(r"^==\s*Changelog\s*==\s*$", wikitext, re.I | re.M)
    if not heading:
        return []
    text = wikitext[heading.start():]
    blocks: list[str] = []
    cursor = 0
    marker = "{{ChangelogItem"
    while (start := text.find(marker, cursor)) >= 0:
        depth = 0
        index = start
        while index < len(text) - 1:
            pair = text[index:index + 2]
            if pair == "{{":
                depth += 1
                index += 2
                continue
            if pair == "}}":
                depth -= 1
                index += 2
                if depth == 0:
                    blocks.append(text[start:index])
                    cursor = index
                    break
                continue
            index += 1
        else:
            break
    return blocks


def normalize_category(value: str) -> str | None:
    key = strip_markup(value).lower()
    return CATEGORY_ALIASES.get(key)


def file_name(value: str) -> str | None:
    match = re.search(r"\[\[File:([^|\]]+)", value, re.I)
    return match.group(1).strip() if match else None


def file_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower())


def entity_name(value: str) -> str:
    value = re.sub(r"(?:\[|\()?\s*\*?NEW\*?\s*(?:\]|\))?", "", value, flags=re.I)
    value = re.sub(r"^\d+px\s*\|\s*link\s*=\s*", "", value, flags=re.I)
    value = re.sub(r"^\*?Reworked\*?\s+|\s*[-–—]\s*Reworked$", "", value, flags=re.I)
    if re.match(r"^(?:Changed|Removed|The following|Reworked)\b", value, re.I) or len(value) > 70:
        return "General"
    return re.sub(r"\s+", " ", value).strip(" -–—:.;")


def parse_champion(name: str, wikitext: str) -> list[dict[str, Any]]:
    grouped: OrderedDict[tuple[str, str], dict[str, Any]] = OrderedDict()
    for revision, block in enumerate(changelog_blocks(wikitext)):
        content_marker = block.find("|content=")
        if content_marker < 0:
            continue
        content = block[content_marker + len("|content="):-2]
        category: str | None = None
        current_key: tuple[str, str] | None = None

        bullets: list[tuple[int, str]] = []
        for raw_line in content.splitlines():
            match = re.match(r"^(\*+)\s*(.+?)\s*$", raw_line)
            if not match:
                continue
            bullets.append((len(match.group(1)), match.group(2)))

        for line_index, (depth, body) in enumerate(bullets):
            clean = strip_markup(body)
            if not clean:
                continue
            recognized = normalize_category(body)
            image = file_name(body)
            next_depth = bullets[line_index + 1][0] if line_index + 1 < len(bullets) else 0

            if depth == 1 and recognized:
                category = recognized
                current_key = None
                continue

            if depth == 1 and next_depth > depth:
                category = "Abilities"
                current_key = (category, entity_name(clean))
            elif depth == 2 and normalize_category(clean) == "Fixes" and next_depth > depth:
                category = "Fixes"
                current_key = None
                continue
            elif depth == 2 and next_depth > depth:
                current_key = (category or "General", entity_name(clean))
            else:
                if current_key is None:
                    current_key = (category or "General", name)
                entry = grouped.setdefault(current_key, {
                    "category": current_key[0],
                    "name": current_key[1],
                    "file": None,
                    "revisions": OrderedDict(),
                })
                entry["revisions"].setdefault(revision, []).append(clean)
                continue

            entry = grouped.setdefault(current_key, {
                "category": current_key[0],
                "name": current_key[1],
                "file": image,
                "revisions": OrderedDict(),
            })
            if image and not entry["file"]:
                entry["file"] = image

        # Retain image metadata for entries whose first line had no child bullet.
    return list(grouped.values())


def metric_label(prefix: str, suffix: str) -> str:
    label = re.sub(r"\b(?:increased?|reduced?|decreased?|lowered?|raised?|changed?|adjusted?|maximum|minimum)\b", "", prefix, flags=re.I)
    label = re.sub(r"\bfrom\b", "", label, flags=re.I)
    label = re.sub(r"\s+", " ", label).strip(" -–—:.;")
    suffix = re.sub(r"^[,.;:\s]+", "", suffix)
    if suffix and len(suffix) <= 45 and not re.search(r"\b(?:and|but|while)\b", suffix, re.I):
        label = f"{label} {suffix}".strip()
    return label[:1].upper() + label[1:] if label else "Value"


def human_value(value: str) -> str:
    value = re.sub(r"\s+", "", value)
    scaling = re.fullmatch(rf"(?P<base>[+-]?{NUMBER})\|(?P<step>[+-]?{NUMBER})(?P<unit>%|s|/tick|units?)?", value, re.I)
    if not scaling:
        return value
    base, step, unit = scaling.group("base"), scaling.group("step"), scaling.group("unit") or ""
    if base == step:
        return f"{base}{unit}/level"
    return f"{base}{unit} + {step}{unit}/level"


def canonical_metric_label(label: str) -> str:
    label = re.sub(r"^(?:the|your|base)\s+", "", label.strip(), flags=re.I)
    label = re.sub(r"\s+gain$", "", label, flags=re.I)
    return label[:1].upper() + label[1:] if label else "Value"


def summarize_line(line: str) -> tuple[str, str, str] | str | None:
    line = re.sub(r"^(?:NEW|OLD)\s*:\s*", "", line, flags=re.I).strip()
    transition = TRANSITION.fullmatch(line)
    if transition:
        return (
            metric_label(transition.group("prefix"), transition.group("suffix")),
            human_value(transition.group("new")),
            human_value(transition.group("old")),
        )

    by_amount = re.match(r"^(Increased?|Raised|Reduced?|Decreased|Lowered)\s+(.+?)\s+by\s+(.+)$", line, re.I)
    if by_amount:
        sign = "+" if by_amount.group(1).lower().startswith(("increase", "raise")) else "−"
        return f"{by_amount.group(2).strip().capitalize()}: {sign}{human_value(by_amount.group(3).strip())}"

    renamed = re.search(r"\bRenamed to\s+(.+)$", line, re.I)
    if renamed:
        return f"Renamed → {renamed.group(1).strip()}"
    if re.search(r"\bRemoved\b", line, re.I):
        return "Removed"
    if re.search(r"\bReworked\b", line, re.I):
        return "Reworked"
    if re.search(r"\b(?:Fixed|Resolved|Addressed)\b", line, re.I):
        return "Bug fix"
    if re.search(r"\bdescription\b", line, re.I):
        return "Description updated"
    if re.search(r"\b(?:visual|animation|texture|model)\b", line, re.I):
        return "Visuals updated"
    if re.search(r"\b(?:audio|sound)\b", line, re.I):
        return "Audio updated"
    if re.search(r"\b(?:Added|New)\b", line, re.I):
        return "Added"
    if re.search(r"\b(?:Increased|Reduced|Decreased|Lowered|Raised|Changed|Adjusted|Now|No longer|Does not)\b", line, re.I):
        values = re.findall(VALUE, line, re.I)
        return f"Behavior adjusted ({', '.join(human_value(value) for value in values[:4])})" if values else "Behavior adjusted"
    return None


def build_trends(entry: dict[str, Any]) -> list[str]:
    trends: OrderedDict[str, list[str]] = OrderedDict()
    notes: list[str] = []

    def add_metric(label: str, *values: str) -> None:
        label = canonical_metric_label(label)
        chain = trends.setdefault(slug(label), [label])
        for value in values:
            if chain[-1].casefold() != value.casefold():
                chain.append(value)

    for changes in entry["revisions"].values():
        old_description = next((item for item in changes if re.match(r"^OLD\s*:", item, re.I)), None)
        new_description = next((item for item in changes if re.match(r"^NEW\s*:", item, re.I)), None)
        if new_description:
            summary = summarize_line(new_description)
            if isinstance(summary, str) and "Reworked" not in notes:
                notes.append("Reworked")
            changes = [item for item in changes if item not in {old_description, new_description}]

        for change in changes:
            summary = summarize_line(change)
            if not summary:
                continue
            if isinstance(summary, tuple):
                label, newest, older = summary
                add_metric(label, newest, older)
            elif ":" in summary:
                label, value = summary.split(":", 1)
                add_metric(label, value.strip())
            elif summary not in notes:
                notes.append(summary)

    # Fandom revisions arrive newest-first. Reverse the collected values so
    # each trend reads chronologically from its oldest state to the current one.
    compact = [f"{parts[0]}: {' → '.join(reversed(parts[1:]))}" for parts in trends.values()]
    compact.extend(notes)
    return compact


def local_icon(champion: dict[str, Any], category: str, entity_name: str) -> str | None:
    collections: list[list[dict[str, Any]]] = []
    if category in {"Weapon", "Abilities"}:
        collections = [champion.get("skills", [])]
    elif category == "Talents":
        collections = [champion.get("talents", [])]
    elif category == "Cards":
        collections = [champion.get("loadouts", []), champion.get("cards", [])]
    needle = slug(entity_name)
    for collection in collections:
        for item in collection:
            if slug(str(item.get("name", ""))) == needle and item.get("iconUrl"):
                return str(item["iconUrl"])
    return None


def canonical_category(champion: dict[str, Any], category: str, name: str, source_file: str | None) -> str:
    if category == "Fixes":
        return category
    needle = slug(name)
    if any(slug(str(item.get("name", ""))) == needle for item in champion.get("talents", [])):
        return "Talents"
    if any(slug(str(item.get("name", ""))) == needle for item in champion.get("loadouts", [])):
        return "Cards"
    if any(slug(str(item.get("name", ""))) == needle for item in champion.get("skills", [])):
        return "Weapon" if category == "Weapon" else "Abilities"
    file_key = (source_file or "").lower()
    if file_key.startswith("talent "):
        return "Talents"
    if file_key.startswith("card "):
        return "Cards"
    if file_key.startswith("weapon"):
        return "Weapon"
    if file_key.startswith("ability "):
        return "Abilities"
    return category


def resolve_image_urls(files: list[str]) -> dict[str, str]:
    resolved: dict[str, str] = {}
    for start in range(0, len(files), 40):
        titles = "|".join(f"File:{name}" for name in files[start:start + 40])
        payload = api_json({
            "action": "query",
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": "96",
            "titles": titles,
            "format": "json",
            "formatversion": "2",
        })
        for page in payload.get("query", {}).get("pages", []):
            title = str(page.get("title", "")).removeprefix("File:")
            info = (page.get("imageinfo") or [{}])[0]
            url = info.get("thumburl") or info.get("url")
            if title and url:
                resolved[title] = str(url)
        time.sleep(0.1)
    return resolved


def download_legacy_icons(records: dict[str, Any]) -> None:
    requests: dict[str, tuple[str, str]] = {}
    for champion_slug, champion in records.items():
        for category in champion["categories"]:
            if category["name"] != "Talents":
                continue
            for entry in category["entries"]:
                if entry.get("iconUrl"):
                    continue
                for source in entry.get("sourceFiles", []):
                    requests[source] = (champion_slug, slug(entry["name"]))

    request_by_key = {file_key(source): target for source, target in requests.items()}
    for source_name, url in resolve_image_urls(sorted(requests)).items():
        target_info = request_by_key.get(file_key(source_name))
        if not target_info:
            continue
        champion_slug, entity_slug = target_info
        content: bytes | None = None
        mime = "image/png"
        for attempt in range(3):
            try:
                request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(request, timeout=30) as response:
                    content = response.read()
                    mime = response.headers.get_content_type()
                break
            except Exception as error:
                if attempt == 2:
                    print(f"Warning: skipped legacy icon {source_name}: {error}")
                else:
                    time.sleep(1 + attempt)
        if content is None:
            continue
        extension = mimetypes.guess_extension(mime) or Path(urllib.parse.urlparse(url).path).suffix or ".png"
        if extension == ".jpe":
            extension = ".jpg"
        directory = IMAGE_ROOT / champion_slug
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / f"{entity_slug}{extension}"
        target.write_bytes(content)
        records[champion_slug]["legacyIcons"][file_key(source_name)] = f"/images/champion-history/{champion_slug}/{target.name}"

    for champion in records.values():
        icons = champion.pop("legacyIcons")
        for category in champion["categories"]:
            for entry in category["entries"]:
                sources = entry.pop("sourceFiles", [])
                if sources and not entry.get("iconUrl"):
                    entry["iconUrl"] = next((icons[file_key(source)] for source in sources if file_key(source) in icons), None)
        talents = next((category["entries"] for category in champion["categories"] if category["name"] == "Talents"), [])
        for _ in range(len(talents)):
            by_name = {slug(entry["name"]): entry.get("iconUrl") for entry in talents if entry.get("iconUrl")}
            changed = False
            for entry in talents:
                if entry.get("iconUrl"):
                    continue
                renamed = next((re.match(r"Renamed to (.+)", trend, re.I) for trend in entry["trends"] if re.match(r"Renamed to (.+)", trend, re.I)), None)
                if renamed and by_name.get(slug(renamed.group(1))):
                    entry["iconUrl"] = by_name[slug(renamed.group(1))]
                    changed = True
            if not changed:
                break


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--champion", help="Generate one champion into a separate output file")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--no-images", action="store_true")
    args = parser.parse_args()

    champion_data: dict[str, dict[str, Any]] = json.loads(CHAMPION_DATA.read_text(encoding="utf-8"))
    selected = [(key, value) for key, value in champion_data.items() if not args.champion or slug(value["name"]) == slug(args.champion)]
    if not selected:
        raise SystemExit(f"Unknown champion: {args.champion}")

    records: dict[str, Any] = {}
    for index, (champion_slug, champion) in enumerate(selected):
        source_page = PAGE_ALIASES.get(champion["name"], champion["name"])
        payload = api_json({
            "action": "parse",
            "page": source_page,
            "prop": "wikitext",
            "format": "json",
            "formatversion": "2",
        })
        entries = parse_champion(champion["name"], payload["parse"]["wikitext"])
        merged: OrderedDict[tuple[str, str], dict[str, Any]] = OrderedDict()
        for entry in entries:
            entry["category"] = canonical_category(champion, entry["category"], entry["name"], entry["file"])
            key = (entry["category"], slug(entry["name"]))
            target = merged.setdefault(key, {
                "category": entry["category"],
                "name": entry["name"],
                "file": entry["file"],
                "revisions": OrderedDict(),
            })
            if entry["file"] and not target["file"]:
                target["file"] = entry["file"]
            for revision, changes in entry["revisions"].items():
                target["revisions"].setdefault(revision, []).extend(changes)

        categories: OrderedDict[str, list[dict[str, Any]]] = OrderedDict()
        for entry in merged.values():
            trends = build_trends(entry)
            if not trends:
                continue
            item = {
                "name": entry["name"],
                "iconUrl": local_icon(champion, entry["category"], entry["name"]),
                "sourceFiles": [entry["file"]] if entry["file"] else [],
                "trends": trends,
            }
            if entry["category"] == "Talents" and not item["iconUrl"] and slug(entry["name"]) != champion_slug:
                compact_champion = re.sub(r"[^A-Za-z0-9]", "", champion["name"])
                compact_entity = re.sub(r"[^A-Za-z0-9]", "", entry["name"])
                item["sourceFiles"].extend([
                    f"Talent {champion['name']} {entry['name']}.png",
                    f"Talent {champion['name']} {compact_entity}.png",
                    f"Talent {compact_champion} {compact_entity}.png",
                ])
                item["sourceFiles"] = list(dict.fromkeys(item["sourceFiles"]))
            categories.setdefault(entry["category"], []).append(item)
        records[champion_slug] = {
            "sourceUrl": f"https://paladins.fandom.com/wiki/{urllib.parse.quote(source_page.replace(' ', '_'))}",
            "legacyIcons": {},
            "categories": [
                {"name": category, "entries": rows}
                for category, rows in sorted(categories.items(), key=lambda pair: CATEGORY_ORDER.get(pair[0], 99))
            ],
        }
        print(f"[{index + 1}/{len(selected)}] {champion['name']}: {len(entries)} grouped entries")
        time.sleep(0.1)

    if args.no_images:
        for champion in records.values():
            champion.pop("legacyIcons")
            for category in champion["categories"]:
                for entry in category["entries"]:
                    entry.pop("sourceFiles", None)
    else:
        download_legacy_icons(records)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
