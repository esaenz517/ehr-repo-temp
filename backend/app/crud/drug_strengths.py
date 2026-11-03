'''
Drug Strengths
Powers the Dose suggestions on the Create Case page: once a medication is picked,
list the strengths it actually comes in (e.g. Metformin -> 500 mg Tab, 850 mg Tab, ...).

Strengths come from the National Library of Medicine's free RxTerms data
(the same service as the medication name suggestions). If it can't be reached,
a built-in table of common medications is used instead.
'''

import json
import re
import urllib.parse
import urllib.request
from functools import lru_cache

from app.crud.drug_suggestions import NLM_TIMEOUT_SECONDS, NLM_URL, _clean_nlm_name

# Built-in strengths for common medications, used when the NLM service is unreachable.
# Each entry is (strength, route); route matches the Route dropdown on the Create Case page.
_PO, _SC, _INH = "PO", "SC", None  # inhalers have no matching route option
COMMON_STRENGTHS: dict[str, list[tuple[str, str | None]]] = {
    "acetaminophen": [("325 mg Tab", _PO), ("500 mg Tab", _PO), ("160 mg/5 mL Liquid", _PO)],
    "albuterol": [("90 mcg/actuation Inhaler", _INH), ("2.5 mg/3 mL Nebulizer Solution", _INH)],
    "amlodipine": [("2.5 mg Tab", _PO), ("5 mg Tab", _PO), ("10 mg Tab", _PO)],
    "amoxicillin": [("250 mg Cap", _PO), ("500 mg Cap", _PO), ("875 mg Tab", _PO), ("400 mg/5 mL Suspension", _PO)],
    "apixaban": [("2.5 mg Tab", _PO), ("5 mg Tab", _PO)],
    "aspirin": [("81 mg Tab", _PO), ("325 mg Tab", _PO)],
    "atorvastatin": [("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO), ("80 mg Tab", _PO)],
    "azithromycin": [("250 mg Tab", _PO), ("500 mg Tab", _PO), ("200 mg/5 mL Suspension", _PO)],
    "bupropion": [("75 mg Tab", _PO), ("100 mg 12HR Tab", _PO), ("150 mg 24HR Tab", _PO), ("300 mg 24HR Tab", _PO)],
    "carvedilol": [("3.125 mg Tab", _PO), ("6.25 mg Tab", _PO), ("12.5 mg Tab", _PO), ("25 mg Tab", _PO)],
    "cephalexin": [("250 mg Cap", _PO), ("500 mg Cap", _PO)],
    "ciprofloxacin": [("250 mg Tab", _PO), ("500 mg Tab", _PO), ("750 mg Tab", _PO)],
    "citalopram": [("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO)],
    "clopidogrel": [("75 mg Tab", _PO)],
    "cyclobenzaprine": [("5 mg Tab", _PO), ("10 mg Tab", _PO)],
    "doxycycline": [("50 mg Cap", _PO), ("100 mg Cap", _PO), ("100 mg Tab", _PO)],
    "duloxetine": [("20 mg Cap", _PO), ("30 mg Cap", _PO), ("60 mg Cap", _PO)],
    "escitalopram": [("5 mg Tab", _PO), ("10 mg Tab", _PO), ("20 mg Tab", _PO)],
    "fluoxetine": [("10 mg Cap", _PO), ("20 mg Cap", _PO), ("40 mg Cap", _PO)],
    "furosemide": [("20 mg Tab", _PO), ("40 mg Tab", _PO), ("80 mg Tab", _PO)],
    "gabapentin": [("100 mg Cap", _PO), ("300 mg Cap", _PO), ("400 mg Cap", _PO), ("600 mg Tab", _PO), ("800 mg Tab", _PO)],
    "glipizide": [("5 mg Tab", _PO), ("10 mg Tab", _PO)],
    "hydrochlorothiazide": [("12.5 mg Cap", _PO), ("25 mg Tab", _PO), ("50 mg Tab", _PO)],
    "hydroxyzine": [("10 mg Tab", _PO), ("25 mg Tab", _PO), ("50 mg Tab", _PO)],
    "ibuprofen": [("200 mg Tab", _PO), ("400 mg Tab", _PO), ("600 mg Tab", _PO), ("800 mg Tab", _PO)],
    "insulin glargine": [("100 units/mL Injection", _SC)],
    "insulin lispro": [("100 units/mL Injection", _SC)],
    "levothyroxine": [(f"{d} mcg Tab", _PO) for d in (25, 50, 75, 88, 100, 112, 125, 137, 150, 175, 200)],
    "lisinopril": [("2.5 mg Tab", _PO), ("5 mg Tab", _PO), ("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO)],
    "losartan": [("25 mg Tab", _PO), ("50 mg Tab", _PO), ("100 mg Tab", _PO)],
    "meloxicam": [("7.5 mg Tab", _PO), ("15 mg Tab", _PO)],
    "metformin": [("500 mg Tab", _PO), ("850 mg Tab", _PO), ("1000 mg Tab", _PO), ("500 mg 24HR Tab", _PO), ("750 mg 24HR Tab", _PO)],
    "metoprolol succinate": [("25 mg 24HR Tab", _PO), ("50 mg 24HR Tab", _PO), ("100 mg 24HR Tab", _PO), ("200 mg 24HR Tab", _PO)],
    "metoprolol tartrate": [("25 mg Tab", _PO), ("50 mg Tab", _PO), ("100 mg Tab", _PO)],
    "montelukast": [("4 mg Chewable Tab", _PO), ("5 mg Chewable Tab", _PO), ("10 mg Tab", _PO)],
    "omeprazole": [("10 mg Cap", _PO), ("20 mg Cap", _PO), ("40 mg Cap", _PO)],
    "ondansetron": [("4 mg Tab", _PO), ("8 mg Tab", _PO), ("4 mg Disintegrating Tab", _PO)],
    "pantoprazole": [("20 mg Tab", _PO), ("40 mg Tab", _PO)],
    "pravastatin": [("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO), ("80 mg Tab", _PO)],
    "prednisone": [("1 mg Tab", _PO), ("5 mg Tab", _PO), ("10 mg Tab", _PO), ("20 mg Tab", _PO), ("50 mg Tab", _PO)],
    "rosuvastatin": [("5 mg Tab", _PO), ("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO)],
    "sertraline": [("25 mg Tab", _PO), ("50 mg Tab", _PO), ("100 mg Tab", _PO)],
    "simvastatin": [("10 mg Tab", _PO), ("20 mg Tab", _PO), ("40 mg Tab", _PO)],
    "spironolactone": [("25 mg Tab", _PO), ("50 mg Tab", _PO), ("100 mg Tab", _PO)],
    "tamsulosin": [("0.4 mg Cap", _PO)],
    "tramadol": [("50 mg Tab", _PO)],
    "trazodone": [("50 mg Tab", _PO), ("100 mg Tab", _PO), ("150 mg Tab", _PO)],
    "warfarin": [(f"{d} mg Tab", _PO) for d in ("1", "2", "2.5", "3", "4", "5", "6", "7.5", "10")],
}


def _route_from_form(form: str) -> str | None:
    '''RxTerms dose form (the part in brackets, e.g. "Oral Pill") -> Route dropdown value.'''
    f = form.lower()
    if "oral" in f or "chewable" in f:
        return "PO"
    if "topical" in f or "transdermal" in f:
        return "Topical"
    if "subcutaneous" in f:
        return "SC"
    if "intravenous" in f:
        return "IV"
    if "intramuscular" in f:
        return "IM"
    return None  # e.g. "Injectable" could be SC, IM or IV - let the instructor choose


@lru_cache(maxsize=512)
def _nlm_strengths(name: str) -> tuple[tuple[str, str | None], ...]:
    '''Ask NLM RxTerms for the strengths of one drug. Raises on network errors.'''
    params = urllib.parse.urlencode({"terms": name, "ef": "STRENGTHS_AND_FORMS", "maxList": 50})
    with urllib.request.urlopen(f"{NLM_URL}?{params}", timeout=NLM_TIMEOUT_SECONDS) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    # Response shape: [total, [display names], {"STRENGTHS_AND_FORMS": [[...], ...]}, ...]
    names = payload[1] if len(payload) > 1 and isinstance(payload[1], list) else []
    extra = payload[2] if len(payload) > 2 and isinstance(payload[2], dict) else {}
    strength_lists = extra.get("STRENGTHS_AND_FORMS") or []

    results: list[tuple[str, str | None]] = []
    for display, strengths in zip(names, strength_lists):
        # Only the entries for this exact drug, e.g. "metFORMIN (Oral Pill)" for "Metformin".
        if not isinstance(display, str) or _clean_nlm_name(display).lower() != name:
            continue
        form = re.search(r"\((.*?)\)", display)
        route = _route_from_form(form.group(1)) if form else None
        for strength in strengths or []:
            clean = " ".join(str(strength).split())
            if clean:
                results.append((clean, route))
    return tuple(results)


def drug_strengths(name: str) -> list[dict]:
    '''The strengths a drug comes in, e.g. [{"strength": "500 mg Tab", "route": "PO"}, ...].'''
    key = " ".join(name.split()).lower()
    if len(key) < 2:
        return []

    try:
        found = list(_nlm_strengths(key))
    except Exception:
        found = []  # NLM unreachable - use the built-in table
    if not found:
        found = COMMON_STRENGTHS.get(key, [])

    seen: set[str] = set()
    results = []
    for strength, route in found:
        if strength.lower() not in seen:
            seen.add(strength.lower())
            results.append({"strength": strength, "route": route})
    return results
