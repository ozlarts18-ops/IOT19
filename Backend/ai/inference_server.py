import base64
import io
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from ultralytics import YOLO

# =====================================================
# MODEL PATH RESOLVERS
# =====================================================

def resolve_pest_model_path() -> Path:
    env_path = os.environ.get("YOLO_MODEL_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    candidates = [
        Path(__file__).parent / "best (1).pt",
        Path(__file__).parent / "best(1).pt",
        Path(__file__).resolve().parent.parent.parent / "best (1).pt",
        Path(__file__).parent / "best.pt",
    ]
    for c in candidates:
        if c.exists():
            return c
    return Path(__file__).parent / "best (1).pt"


def resolve_disease_model_path() -> Optional[Path]:
    env_path = os.environ.get("DISEASE_MODEL_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    candidates = [
        Path(__file__).parent / "plant_disease_model.pt",
        Path(__file__).resolve().parent.parent.parent / "plant_disease_model.pt",
        Path(__file__).parent / "plant_disease_model.pt.zip",
        Path(__file__).resolve().parent.parent.parent / "plant_disease_model",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


PEST_MODEL_PATH = resolve_pest_model_path()
DISEASE_MODEL_PATH = resolve_disease_model_path()
CONF_THRESHOLD = 0.35
YOLO_IMG_SIZE = 896

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(title="IOT19 Dual AI Service (Pest: best (1).pt + Disease: plant_disease_model.pt)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# LOAD PEST DETECTION MODEL (YOLO11s best (1).pt)
# =====================================================

print(f"Loading YOLO11 pest model from {PEST_MODEL_PATH}...")
pest_model = YOLO(str(PEST_MODEL_PATH))
PEST_CLASS_NAMES = pest_model.names
print(f"Pest Model [{PEST_MODEL_PATH.name}] loaded successfully. {len(PEST_CLASS_NAMES)} classes available.")


# =====================================================
# LOAD PLANT DISEASE MODEL (ResNet-18 plant_disease_model.pt)
# =====================================================

disease_model = None
DISEASE_CLASSES: List[str] = []

disease_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

TREATMENTS: Dict[str, str] = {
    "Apple_scab": "Apply captan or sulfur-based fungicides. Rake fallen leaves and prune affected shoots.",
    "Black_rot": "Prune out dead or mummified fruit. Apply copper fungicide or myclobutanil at blossom.",
    "Cedar_apple_rust": "Remove nearby eastern red cedar trees if feasible. Apply sulfur or chlorothalonil in early spring.",
    "Powdery_mildew": "Improve canopy ventilation and spacing. Apply wettable sulfur or potassium bicarbonate sprays.",
    "Cercospora_leaf_spot": "Rotate crops, avoid overhead watering, apply chlorothalonil or azoxystrobin fungicides.",
    "Common_rust": "Plant resistant hybrids, monitor early leaf emergence, apply triazole fungicides if pustules spread.",
    "Northern_Leaf_Blight": "Incorporate post-harvest crop residues, practice 2-year crop rotation, use strobilurin fungicides.",
    "Esca_(Black_Measles)": "Protect pruning wounds with natural wound sealants. Minimize vine water stress during hot periods.",
    "Leaf_blight": "Apply protective copper sprays. Remove diseased leaves and ensure clean ground tillage.",
    "Haunglongbing_(Citrus_greening)": "Strictly control Asian citrus psyllid vectors, remove infected trees, use certified pathogen-free nursery stock.",
    "Bacterial_spot": "Apply copper-mancozeb sprays. Avoid overhead irrigation and work in fields only when foliage is dry.",
    "Early_blight": "Apply chlorothalonil or copper fungicide every 7-10 days. Water at root base to prevent splash dispersal.",
    "Late_blight": "HIGH ALERT: Remove severely infected tissue immediately. Apply systemic metalaxyl or protective copper fungicides.",
    "Leaf_Mold": "Increase greenhouse ventilation, keep relative humidity under 85%, use preventative biofungicides.",
    "Septoria_leaf_spot": "Space plants for air flow, mulch under tomatoes to prevent soil splash, apply chlorothalonil.",
    "Spider_mites": "Spray foliage with insecticidal soap or neem oil. Maintain soil moisture to deter dry mite outbreaks.",
    "Target_Spot": "Prune lower diseased foliage, apply preventative fungicides, avoid water splash on leaves.",
    "Tomato_Yellow_Leaf_Curl_Virus": "Control whitefly vectors using fine insect mesh netting and reflective silver mulches.",
    "Tomato_mosaic_virus": "Disinfect garden shears in 10% bleach, wash hands, remove and isolate infected plants.",
    "healthy": "Optimal foliage health: maintain regular irrigation, balanced N-P-K nutrition, and routine scouting."
}


def parse_disease_class(raw_name: str) -> Dict[str, Any]:
    parts = raw_name.split("___")
    crop = parts[0].replace("_", " ").replace("(", " (").strip()
    disease_raw = parts[1] if len(parts) > 1 else "Unknown"
    is_healthy = "healthy" in disease_raw.lower()
    clean_disease = "Healthy (No Disease Detected)" if is_healthy else disease_raw.replace("_", " ").strip()
    
    treatment = "Maintain current care routine."
    for key, text in TREATMENTS.items():
        if key.lower() in disease_raw.lower():
            treatment = text
            break
            
    return {
        "raw_class": raw_name,
        "crop": crop,
        "disease": clean_disease,
        "is_healthy": is_healthy,
        "treatment": treatment
    }


if DISEASE_MODEL_PATH and DISEASE_MODEL_PATH.exists():
    try:
        print(f"Loading Plant Disease ResNet18 model from {DISEASE_MODEL_PATH}...")
        chk = torch.load(str(DISEASE_MODEL_PATH), map_location=device)
        DISEASE_CLASSES = chk.get("classes", [])
        disease_model = models.resnet18(weights=None)
        disease_model.fc = torch.nn.Linear(disease_model.fc.in_features, len(DISEASE_CLASSES))
        disease_model.load_state_dict(chk["model_state_dict"])
        disease_model.to(device)
        disease_model.eval()
        print(f"Disease Model [{DISEASE_MODEL_PATH.name}] loaded successfully. {len(DISEASE_CLASSES)} classes available.")
    except Exception as e:
        print(f"Warning: Failed to load plant disease model from {DISEASE_MODEL_PATH}: {e}")
else:
    print(f"Notice: Plant disease model path not found at {DISEASE_MODEL_PATH}")


# =====================================================
# COMMON HEALTH ENDPOINTS
# =====================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "pest_model": {
            "name": PEST_MODEL_PATH.name,
            "classes": len(PEST_CLASS_NAMES),
            "status": "ONLINE"
        },
        "disease_model": {
            "name": DISEASE_MODEL_PATH.name if DISEASE_MODEL_PATH else "plant_disease_model.pt",
            "classes": len(DISEASE_CLASSES),
            "status": "ONLINE" if disease_model is not None else "UNAVAILABLE"
        }
    }


# =====================================================
# PEST DETECTION ENDPOINTS (YOLO11s)
# =====================================================

@app.get("/model-info")
def pest_model_info():
    return {
        "success": True,
        "model_name": PEST_MODEL_PATH.name,
        "model_file": PEST_MODEL_PATH.name,
        "architecture": "Ultralytics YOLO11s",
        "total_classes": len(PEST_CLASS_NAMES),
        "input_size": YOLO_IMG_SIZE,
        "default_threshold": CONF_THRESHOLD,
        "classes": [PEST_CLASS_NAMES[i] for i in sorted(PEST_CLASS_NAMES.keys())],
        "status": "ONLINE"
    }


@app.post("/predict")
async def predict_pest(file: UploadFile = File(...), conf: float = 0.35):
    start = time.time()
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    effective_conf = max(0.05, min(0.95, float(conf)))

    results = pest_model.predict(
        source=image,
        imgsz=YOLO_IMG_SIZE,
        conf=effective_conf,
        verbose=False,
    )[0]

    detections = []
    if results.boxes is not None:
        for box in results.boxes:
            cls_id = int(box.cls.item())
            conf_val = float(box.conf.item())
            xyxy = [round(v, 1) for v in box.xyxy[0].tolist()]
            detections.append({
                "class_id": cls_id,
                "class_name": PEST_CLASS_NAMES.get(cls_id, f"Class_{cls_id}"),
                "confidence": round(conf_val, 4),
                "bbox": xyxy,  # [x1, y1, x2, y2]
            })

    detections.sort(key=lambda d: d["confidence"], reverse=True)

    annotated_bgr = results.plot()
    success, buffer = cv2.imencode(".jpg", annotated_bgr)
    annotated_b64 = base64.b64encode(buffer).decode("utf-8") if success else None

    inference_time = round((time.time() - start) * 1000, 1)

    return {
        "success": True,
        "model_name": PEST_MODEL_PATH.name,
        "model_architecture": "YOLO11s",
        "inference_ms": inference_time,
        "threshold_used": effective_conf,
        "detections": detections,
        "top_detection": detections[0] if detections else None,
        "pest_count": len(detections),
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}" if annotated_b64 else None,
    }


# =====================================================
# PLANT DISEASE DETECTION ENDPOINTS (ResNet-18)
# =====================================================

@app.get("/disease/model-info")
def disease_model_info():
    parsed_classes = [parse_disease_class(c) for c in DISEASE_CLASSES]
    return {
        "success": True,
        "model_name": DISEASE_MODEL_PATH.name if DISEASE_MODEL_PATH else "plant_disease_model.pt",
        "architecture": "PyTorch ResNet-18",
        "total_classes": len(DISEASE_CLASSES),
        "classes": DISEASE_CLASSES,
        "classes_parsed": parsed_classes,
        "status": "ONLINE" if disease_model is not None else "OFFLINE"
    }


@app.post("/predict-disease")
async def predict_disease(file: UploadFile = File(...)):
    if disease_model is None:
        return {
            "success": False,
            "message": "Plant disease model is not loaded"
        }

    start = time.time()
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    tensor = disease_transforms(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = disease_model(tensor)
        probs = torch.nn.functional.softmax(output[0], dim=0)

    top5_probs, top5_indices = torch.topk(probs, min(5, len(DISEASE_CLASSES)))

    top_idx = int(top5_indices[0].item())
    top_prob = float(top5_probs[0].item())
    raw_class = DISEASE_CLASSES[top_idx]
    parsed_top = parse_disease_class(raw_class)

    top5_list = []
    for p, idx in zip(top5_probs, top5_indices):
        c_idx = int(idx.item())
        prob_val = round(float(p.item()), 4)
        c_raw = DISEASE_CLASSES[c_idx]
        c_parsed = parse_disease_class(c_raw)
        top5_list.append({
            "className": c_raw,
            "crop": c_parsed["crop"],
            "disease": c_parsed["disease"],
            "isHealthy": c_parsed["is_healthy"],
            "probability": prob_val,
            "probabilityPercent": round(prob_val * 100, 1)
        })

    # Calculate health score:
    # If top prediction is healthy: score is 90% - 98%
    # If diseased: score degrades proportionally to confidence (e.g. 100 - conf * 75)
    if parsed_top["is_healthy"]:
        health_score = round(85 + top_prob * 14)
        status_label = "HEALTHY"
    else:
        health_score = max(10, round(100 - top_prob * 75))
        status_label = "INFECTED" if top_prob >= 0.50 else "SUSPECTED_INFECTION"

    inference_time = round((time.time() - start) * 1000, 1)

    return {
        "success": True,
        "model_name": DISEASE_MODEL_PATH.name if DISEASE_MODEL_PATH else "plant_disease_model.pt",
        "model_architecture": "PyTorch ResNet-18",
        "inference_ms": inference_time,
        "crop": parsed_top["crop"],
        "disease": parsed_top["disease"],
        "raw_class": raw_class,
        "is_healthy": parsed_top["is_healthy"],
        "confidence": round(top_prob, 4),
        "confidencePercent": round(top_prob * 100, 1),
        "health_score": health_score,
        "status": status_label,
        "treatment": parsed_top["treatment"],
        "top5_predictions": top5_list
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
