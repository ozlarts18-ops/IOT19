import io
import os
import time
from typing import Any, Dict, List, Optional

import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import requests

PLANTNET_API_KEY = os.environ.get("PLANTNET_API_KEY", "")
PERENUAL_API_KEY = os.environ.get("PERENUAL_API_KEY", "")

PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all"
GBIF_API_URL = "https://api.gbif.org/v1/species/match"
PERENUAL_API_URL = "https://perenual.com/api/species-list"

app = FastAPI(title="IOT19 Plant Identification & Care Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_green_index(image_bytes: bytes) -> Dict[str, Any]:
    """Calculate the percentage of green pixels in the image using HSV color space

    with image quality assessment (brightness & blur).
    """
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return {"green_index": 0.0, "quality_warning": True}

        # Grayscale for brightness and blur check
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_brightness = float(np.mean(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Quality check: mean brightness < 40 or > 230, or Laplacian variance < 50
        quality_warning = (mean_brightness < 40 or mean_brightness > 230 or laplacian_var < 50)

        # Green color range in HSV: (25, 40, 40) to (95, 255, 255)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_green = np.array([25, 40, 40], dtype=np.uint8)
        upper_green = np.array([95, 255, 255], dtype=np.uint8)

        mask = cv2.inRange(hsv, lower_green, upper_green)
        green_pixels = cv2.countNonZero(mask)
        total_pixels = img.shape[0] * img.shape[1]

        if total_pixels == 0:
            return {"green_index": 0.0, "quality_warning": quality_warning}

        green_ratio = (green_pixels / total_pixels) * 100.0
        return {
            "green_index": round(float(green_ratio), 2),
            "quality_warning": bool(quality_warning),
            "mean_brightness": round(mean_brightness, 1),
            "laplacian_var": round(laplacian_var, 1),
        }
    except Exception as e:
        print(f"Error calculating green index: {e}")
        return {"green_index": 0.0, "quality_warning": True}


def identify_plant(image_bytes: bytes, api_key: str = "") -> Dict[str, Any]:
    """Identify plant species using Pl@ntNet API and extract top 5 results."""
    key = api_key or os.environ.get("PLANTNET_API_KEY", "") or PLANTNET_API_KEY
    if not key:
        print("Warning: PLANTNET_API_KEY is not set.")
        return {
            "success": False,
            "error": "PLANTNET_API_KEY_NOT_SET",
            "common_name": None,
            "scientific_name": None,
            "family": None,
            "genus": None,
            "confidence": 0.0,
            "all_results": [],
        }

    try:
        files = [("images", ("image.jpg", io.BytesIO(image_bytes), "image/jpeg"))]
        data = {"organs": ["leaf"]}
        params = {"api-key": key}

        response = requests.post(
            PLANTNET_API_URL,
            files=files,
            data=data,
            params=params,
            timeout=15,
        )

        if response.status_code == 200:
            res_json = response.json()
            results = res_json.get("results", [])
            if results:
                best = results[0]
                species_info = best.get("species", {})
                common_names = species_info.get("commonNames", [])
                common_name = common_names[0] if common_names else species_info.get("scientificNameWithoutAuthor", "Unknown Plant")
                scientific_name = species_info.get("scientificNameWithoutAuthor", "")
                family = species_info.get("family", {}).get("scientificNameWithoutAuthor", "")
                genus = species_info.get("genus", {}).get("scientificNameWithoutAuthor", "")
                score = round(float(best.get("score", 0.0)), 4)

                all_matches = []
                for r in results[:5]:
                    sp = r.get("species", {})
                    c_names = sp.get("commonNames", [])
                    c_name = c_names[0] if c_names else sp.get("scientificNameWithoutAuthor", "Unknown")
                    s_name = sp.get("scientificNameWithoutAuthor", "")
                    sc = round(float(r.get("score", 0.0)) * 100, 1)
                    all_matches.append({
                        "name": c_name,
                        "scientificName": s_name,
                        "score": sc,
                    })

                return {
                    "success": True,
                    "common_name": common_name,
                    "scientific_name": scientific_name,
                    "family": family,
                    "genus": genus,
                    "confidence": score,
                    "all_results": all_matches,
                }

        return {
            "success": False,
            "error": f"API returned status {response.status_code}: {response.text[:100]}",
            "common_name": None,
            "scientific_name": None,
            "family": None,
            "genus": None,
            "confidence": 0.0,
            "all_results": [],
        }
    except Exception as e:
        print(f"Pl@ntNet API exception: {e}")
        return {
            "success": False,
            "error": str(e),
            "common_name": None,
            "scientific_name": None,
            "family": None,
            "genus": None,
            "confidence": 0.0,
            "all_results": [],
        }


def get_gbif_data(scientific_name: str) -> Dict[str, Any]:
    """Fetch taxonomy hierarchy from GBIF and parse classification array."""
    ranks = {
        "kingdom": None,
        "phylum": None,
        "class": None,
        "order": None,
        "family": None,
        "genus": None,
        "species": None,
    }

    if not scientific_name:
        return ranks

    try:
        params = {"name": scientific_name, "strict": "false"}
        response = requests.get(GBIF_API_URL, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()

            # 1. Parse classification array if present (GBIF v2 / v1 format)
            classification = data.get("classification", [])
            if isinstance(classification, list) and classification:
                for item in classification:
                    if isinstance(item, dict):
                        rank_name = (item.get("rank") or "").lower()
                        item_name = item.get("name")
                        if rank_name in ranks and item_name:
                            ranks[rank_name] = item_name

            # 2. Fall back to top-level fields for any missing ranks
            for rank_key in ranks.keys():
                if ranks[rank_key] is None and rank_key in data and data[rank_key]:
                    ranks[rank_key] = data[rank_key]

            # If species rank not set, use scientific_name or data.get("species")
            if ranks["species"] is None:
                ranks["species"] = data.get("species") or data.get("scientificName") or scientific_name
    except Exception as e:
        print(f"GBIF API error: {e}")

    return ranks


def sanitize_perenual_value(val: Any) -> str:
    """Check if value is premium locked, upgrade message, null, or empty."""
    if val is None:
        return "Not available on current plan"
    if isinstance(val, list):
        if not val:
            return "Not available on current plan"
        val_str = ", ".join(str(x) for x in val if x)
        if not val_str:
            return "Not available on current plan"
        if "upgrade" in val_str.lower() or "premium" in val_str.lower():
            return "Not available on current plan"
        return val_str
    
    val_str = str(val).strip()
    if not val_str or "upgrade" in val_str.lower() or "premium" in val_str.lower():
        return "Not available on current plan"
    return val_str


def get_perenual_data(query: str, api_key: str = "") -> Dict[str, Any]:
    """Fetch care instructions, watering, sunlight, and growth metrics from Perenual."""
    key = api_key or os.environ.get("PERENUAL_API_KEY", "") or PERENUAL_API_KEY

    fields = {
        "watering": None,
        "wateringPeriod": None,
        "sunlight": None,
        "soil": None,
        "growthRate": None,
        "careLevel": None,
        "cycle": None,
        "dimension": None,
        "floweringSeason": None,
        "propagation": None,
        "origin": None,
        "maintenance": None,
    }

    if not key or not query:
        return {k: sanitize_perenual_value(v) for k, v in fields.items()}

    try:
        params = {"key": key, "q": query}
        response = requests.get(PERENUAL_API_URL, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("data", [])
            if items and isinstance(items, list):
                item = items[0]
                fields["watering"] = item.get("watering")
                fields["wateringPeriod"] = item.get("watering_period")
                fields["sunlight"] = item.get("sunlight")
                fields["soil"] = item.get("soil")
                fields["growthRate"] = item.get("growth_rate")
                fields["careLevel"] = item.get("care_level")
                fields["cycle"] = item.get("cycle")
                fields["dimension"] = item.get("dimension")
                fields["floweringSeason"] = item.get("flowering_season")
                fields["propagation"] = item.get("propagation")
                fields["origin"] = item.get("origin")
                fields["maintenance"] = item.get("maintenance")
    except Exception as e:
        print(f"Perenual API error: {e}")

    return {k: sanitize_perenual_value(v) for k, v in fields.items()}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "plant_id",
        "plantnet_configured": bool(os.environ.get("PLANTNET_API_KEY") or PLANTNET_API_KEY),
        "perenual_configured": bool(os.environ.get("PERENUAL_API_KEY") or PERENUAL_API_KEY),
    }


@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    start_time = time.time()
    image_bytes = await file.read()

    # 1. Calculate green pixel growth index & image quality
    green_result = calculate_green_index(image_bytes)
    green_index = green_result.get("green_index", 0.0)
    quality_warning = green_result.get("quality_warning", False)

    # 2. Pl@ntNet species identification
    plant_data = identify_plant(image_bytes)
    common_name = plant_data.get("common_name")
    scientific_name = plant_data.get("scientific_name")
    confidence = plant_data.get("confidence", 0.0)
    family = plant_data.get("family")
    genus = plant_data.get("genus")
    all_results = plant_data.get("all_results", [])

    # 3. GBIF Taxonomy details (parse classification array into kingdom...species)
    gbif_taxonomy = get_gbif_data(scientific_name or common_name or "")

    # 4. Perenual Care & Cultivation data
    perenual_care = get_perenual_data(common_name or scientific_name or "")

    processing_ms = round((time.time() - start_time) * 1000, 1)

    return {
        "success": bool(plant_data.get("success") or green_index > 0),
        "processing_ms": processing_ms,
        "commonName": common_name or (gbif_taxonomy.get("species") if gbif_taxonomy else None) or "Unknown Plant",
        "scientificName": scientific_name or gbif_taxonomy.get("species") or "",
        "confidence": confidence,
        "family": family or gbif_taxonomy.get("family") or "",
        "genus": genus or gbif_taxonomy.get("genus") or "",
        "allResults": all_results,
        "greenIndex": green_index,
        "qualityWarning": quality_warning,
        "gbifTaxonomy": gbif_taxonomy,
        "perenual": perenual_care,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
