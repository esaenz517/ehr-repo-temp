'''
Drug Suggestions
Powers the medication autocomplete on the Create Case page (and the patient form).

Instructors can type ANY medication, not just the ones already in dbo.Drugs, so
suggestions come from three places, merged and ranked by how well they match:
  1. Drugs already saved in our database (names this class has used before).
  2. The National Library of Medicine's free RxTerms search
     (https://clinicaltables.nlm.nih.gov), which covers essentially every
     prescription and OTC drug in the US. No API key is needed.
  3. A built-in list of common medications, used when the NLM service can't be
     reached (offline, firewall, outage) so autocomplete still works.
'''

import difflib
import json
import re
import urllib.parse
import urllib.request
from functools import lru_cache

from sqlalchemy.orm import Session

from app.models.drugs import Drug as DrugModel

NLM_URL = "https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search"
NLM_TIMEOUT_SECONDS = 3

# Fallback list of commonly prescribed medications (generic names).
COMMON_MEDICATIONS = [
    "Acetaminophen", "Acyclovir", "Adalimumab", "Albuterol", "Alendronate", "Allopurinol",
    "Alprazolam", "Amiodarone", "Amitriptyline", "Amlodipine", "Amoxicillin",
    "Amoxicillin/Clavulanate", "Amphetamine/Dextroamphetamine", "Anastrozole", "Apixaban",
    "Aripiprazole", "Aspirin", "Atenolol", "Atomoxetine", "Atorvastatin", "Azathioprine",
    "Azithromycin", "Baclofen", "Benazepril", "Benzonatate", "Benztropine", "Bisoprolol",
    "Budesonide", "Budesonide/Formoterol", "Bumetanide", "Buprenorphine",
    "Buprenorphine/Naloxone", "Bupropion", "Buspirone", "Calcitriol", "Calcium Carbonate",
    "Canagliflozin", "Captopril", "Carbamazepine", "Carbidopa/Levodopa", "Carvedilol",
    "Cefdinir", "Cefazolin", "Ceftriaxone", "Cephalexin", "Cetirizine", "Chlorthalidone",
    "Cholecalciferol", "Ciprofloxacin", "Citalopram", "Clarithromycin", "Clindamycin",
    "Clobetasol", "Clonazepam", "Clonidine", "Clopidogrel", "Clotrimazole", "Clozapine",
    "Colchicine", "Cyanocobalamin", "Cyclobenzaprine", "Cyclosporine", "Dabigatran",
    "Dapagliflozin", "Desvenlafaxine", "Dexamethasone", "Dexmethylphenidate", "Diazepam",
    "Diclofenac", "Dicyclomine", "Digoxin", "Diltiazem", "Diphenhydramine", "Divalproex",
    "Docusate", "Donepezil", "Doxazosin", "Doxepin", "Doxycycline", "Dulaglutide",
    "Duloxetine", "Empagliflozin", "Enalapril", "Enoxaparin", "Entecavir", "Epinephrine",
    "Ergocalciferol", "Escitalopram", "Esomeprazole", "Estradiol", "Eszopiclone",
    "Ethinyl Estradiol/Norethindrone", "Etanercept", "Ezetimibe", "Famotidine", "Fenofibrate",
    "Fentanyl", "Ferrous Sulfate", "Fexofenadine", "Finasteride", "Fluconazole",
    "Fludrocortisone", "Fluoxetine", "Fluticasone", "Fluticasone/Salmeterol", "Fluvoxamine",
    "Folic Acid", "Fosinopril", "Furosemide", "Gabapentin", "Gemfibrozil", "Glimepiride",
    "Glipizide", "Glyburide", "Guaifenesin", "Guanfacine", "Haloperidol", "Heparin",
    "Hydralazine", "Hydrochlorothiazide", "Hydrocodone/Acetaminophen", "Hydrocortisone",
    "Hydromorphone", "Hydroxychloroquine", "Hydroxyzine", "Ibuprofen", "Indomethacin",
    "Insulin Aspart", "Insulin Detemir", "Insulin Glargine", "Insulin Lispro",
    "Insulin NPH", "Insulin Regular", "Ipratropium", "Irbesartan", "Isoniazid",
    "Isosorbide Mononitrate", "Ivermectin", "Ketoconazole", "Ketorolac", "Labetalol",
    "Lacosamide", "Lamotrigine", "Lansoprazole", "Latanoprost", "Letrozole", "Levetiracetam",
    "Levocetirizine", "Levofloxacin", "Levonorgestrel", "Levothyroxine", "Lidocaine",
    "Linagliptin", "Liraglutide", "Lisinopril", "Lisinopril/Hydrochlorothiazide", "Lithium",
    "Loperamide", "Loratadine", "Lorazepam", "Losartan", "Losartan/Hydrochlorothiazide",
    "Lovastatin", "Lurasidone", "Magnesium Oxide", "Meclizine", "Medroxyprogesterone",
    "Meloxicam", "Memantine", "Metformin", "Methadone", "Methimazole", "Methocarbamol",
    "Methotrexate", "Methylphenidate", "Methylprednisolone", "Metoclopramide", "Metolazone",
    "Metoprolol Succinate", "Metoprolol Tartrate", "Metronidazole", "Minocycline",
    "Mirtazapine", "Montelukast", "Morphine", "Mupirocin", "Mycophenolate", "Naloxone",
    "Naltrexone", "Naproxen", "Nebivolol", "Nifedipine", "Nitrofurantoin", "Nitroglycerin",
    "Norethindrone", "Nortriptyline", "Nystatin", "Olanzapine", "Olmesartan", "Omeprazole",
    "Ondansetron", "Oseltamivir", "Oxcarbazepine", "Oxybutynin", "Oxycodone",
    "Oxycodone/Acetaminophen", "Pantoprazole", "Paroxetine", "Penicillin V Potassium",
    "Phenazopyridine", "Phenobarbital", "Phentermine", "Phenytoin", "Pioglitazone",
    "Piperacillin/Tazobactam", "Potassium Chloride", "Pramipexole", "Pravastatin",
    "Prazosin", "Prednisolone", "Prednisone", "Pregabalin", "Primidone", "Prochlorperazine",
    "Progesterone", "Promethazine", "Propranolol", "Pseudoephedrine", "Quetiapine",
    "Quinapril", "Raloxifene", "Ramipril", "Ranolazine", "Rifampin", "Risperidone",
    "Rivaroxaban", "Rizatriptan", "Ropinirole", "Rosuvastatin", "Sacubitril/Valsartan",
    "Semaglutide", "Sertraline", "Sildenafil", "Simvastatin", "Sitagliptin",
    "Sodium Bicarbonate", "Spironolactone", "Sucralfate", "Sulfamethoxazole/Trimethoprim",
    "Sumatriptan", "Tacrolimus", "Tadalafil", "Tamoxifen", "Tamsulosin", "Telmisartan",
    "Temazepam", "Terazosin", "Terbinafine", "Testosterone", "Thiamine", "Ticagrelor",
    "Timolol", "Tiotropium", "Tirzepatide", "Tizanidine", "Topiramate", "Torsemide",
    "Tramadol", "Trazodone", "Triamcinolone", "Triamterene/Hydrochlorothiazide",
    "Valacyclovir", "Valproic Acid", "Valsartan", "Vancomycin", "Varenicline", "Venlafaxine",
    "Verapamil", "Vitamin D3", "Warfarin", "Zolpidem",
]

_TALL_MAN = re.compile(r"[a-z]+[A-Z]{2,}")  # e.g. "metFORMIN", "hydrOXYzine"


def _clean_nlm_name(display_name: str) -> str:
    '''"metFORMIN (Oral Pill)" -> "Metformin". Drops the dose-form part in brackets
    and undoes "tall man" capitals, which are only meant to prevent look-alike mix-ups.'''
    name = re.sub(r"\s*\(.*?\)\s*", " ", display_name).strip()
    words = [w.capitalize() if _TALL_MAN.fullmatch(w) else w for w in name.split()]
    name = " ".join(words)
    return name[:1].upper() + name[1:]


@lru_cache(maxsize=512)
def _search_nlm(query: str) -> tuple[str, ...]:
    '''Ask the NLM RxTerms service for names matching the query. Raises on network errors.'''
    params = urllib.parse.urlencode({"terms": query, "maxList": 25})
    with urllib.request.urlopen(f"{NLM_URL}?{params}", timeout=NLM_TIMEOUT_SECONDS) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    # Response shape: [total, [display names], extra fields, [[display]...]]
    names = payload[1] if len(payload) > 1 and isinstance(payload[1], list) else []
    return tuple(_clean_nlm_name(n) for n in names if isinstance(n, str))


def _match_rank(name: str, query: str) -> int | None:
    '''Lower is better. None means the name doesn't match the query at all.'''
    lower = name.lower()
    if lower == query:
        return 0
    if lower.startswith(query):
        return 1
    if any(word.startswith(query) for word in re.split(r"[\s/\-]+", lower)):
        return 2
    if query in lower:
        return 3
    return None


def suggest_drugs(db: Session, query: str, limit: int = 10) -> list[str]:
    '''Most likely medication names for what the user has typed so far, best match first.'''
    q = query.strip().lower()
    if not q:
        return []

    saved = [name for (name,) in db.query(DrugModel.name).all()]

    try:
        external = list(_search_nlm(q))
    except Exception:
        external = []  # NLM unreachable - fall back to the built-in list only

    # Saved names first, then NLM results (already ranked by popularity), then the
    # built-in list. The stable sort below keeps that order among equally good matches.
    candidates = saved + external + COMMON_MEDICATIONS

    seen: set[str] = set()
    ranked: list[tuple[int, str]] = []
    for name in candidates:
        key = name.lower()
        if key in seen:
            continue
        rank = _match_rank(name, q)
        if rank is not None:
            seen.add(key)
            ranked.append((rank, name))
    ranked.sort(key=lambda item: item[0])
    results = [name for _, name in ranked]

    # Nothing matched? The user probably made a typo - offer the closest spellings.
    if not results:
        pool = {name.lower(): name for name in COMMON_MEDICATIONS + saved}
        close = difflib.get_close_matches(q, list(pool), n=3, cutoff=0.75)
        results = [pool[c] for c in close]

    return results[:limit]
