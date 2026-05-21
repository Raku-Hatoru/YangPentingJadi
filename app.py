import os
import json
from flask import Flask, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from ultralytics import YOLO
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# LLM Client Configuration (from .env)
client = OpenAI(
    base_url=os.environ.get("LLM_BASE_URL", "http://10.10.3.155:5000/v1"),
    api_key=os.environ.get("LLM_API_KEY", "sk-no-key-required")
)
LLM_MODEL = os.environ.get("LLM_MODEL_NAME", "default-model")

# Flask Configuration (from .env)
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.environ.get("UPLOAD_FOLDER", "static/uploads")
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get("MAX_CONTENT_MB", 16)) * 1024 * 1024

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load FAQ and Prompt configurations (from .jsonc files)
try:
    with open('faq.jsonc', 'r') as f:
        faq_list = json.load(f)
    with open('prompt.jsonc', 'r') as f:
        prompt_config = json.load(f)
        faq_prompt = prompt_config['system_prompt']
        healthy_prompt_template = prompt_config['healthy_prompt']
        disease_prompt_template = prompt_config['disease_prompt']
except Exception as e:
    print(f"Warning: Could not load JSONC config - {e}")
    faq_list = []
    faq_prompt = "Anda adalah asisten AI ahli pertanian. Jawab secara ringkas."
    healthy_prompt_template = ""
    disease_prompt_template = ""

# Load YOLO model (path from .env)
yolo_model_path = os.environ.get("YOLO_MODEL_PATH", "model/best.pt")
yolo_confidence = float(os.environ.get("YOLO_CONFIDENCE", 0.25))
try:
    model = YOLO(yolo_model_path)
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

def get_llm_recommendation(predicted_class):
    if "Healthy" in predicted_class:
        prompt = healthy_prompt_template.replace("{predicted_class}", predicted_class)
    else:
        prompt = disease_prompt_template.replace("{predicted_class}", predicted_class)

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.choices[0].message.content.strip()
        # Clean up markdown if LLM still includes it
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {
            "status": "Error",
            "penyakit": "Gagal memproses dengan AI",
            "penyebab": str(e),
            "solusi_dapur": "-",
            "solusi_kimia": "-"
        }

@app.route("/", methods=['GET'])
def index():
    return render_template("index.html")

@app.route("/predict", methods=['POST'])
def predict():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
        
    if file and model is not None:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Run YOLO prediction
        results = model.predict(filepath, conf=yolo_confidence)
        
        # Get the highest confidence prediction
        if len(results) > 0 and len(results[0].boxes) > 0:
            # Assuming we take the first detected object (highest confidence usually)
            box = results[0].boxes[0]
            class_id = int(box.cls[0].item())
            predicted_class = model.names[class_id]
            
            # Check if it's a chili class (ignore/exclude)
            if "Chili" in predicted_class or "chili" in predicted_class.lower():
                # For chili, we might want to return an error message
                return render_template("result.html", 
                                       image_url=filepath,
                                       predicted_class="Tanaman Cabai tidak didukung",
                                       error="Sistem ini difokuskan pada Terong, Kentang, dan Tomat.",
                                       data=None)
                                       
            # Get LLM Recommendation
            data = get_llm_recommendation(predicted_class)
            
            return render_template("result.html", 
                                   image_url=filepath,
                                   predicted_class=predicted_class,
                                   data=data,
                                   faqs=faq_list)
        else:
            return render_template("result.html", 
                                   image_url=filepath,
                                   predicted_class="Tidak terdeteksi",
                                   error="YOLO tidak mendeteksi penyakit/tanaman pada gambar ini.",
                                   data=None)
                                   
    return redirect(url_for('index'))

@app.route("/ask_faq", methods=['POST'])
def ask_faq():
    data = request.json
    question = data.get('question')
    predicted_class = data.get('predicted_class')
    
    if not question or not predicted_class:
        return jsonify({"error": "Invalid request"}), 400
        
    try:
        system_content = faq_prompt + f"\nKonteks Penyakit Tanaman Saat Ini: {predicted_class}"
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": question}
            ]
        )
        answer = response.choices[0].message.content.strip()
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"FAQ API Error: {e}")
        return jsonify({"error": "Gagal menghubungi AI."}), 500

if __name__ == "__main__":
    flask_host = os.environ.get("FLASK_HOST", "0.0.0.0")
    flask_port = int(os.environ.get("FLASK_PORT", 8080))
    app.run(debug=True, host=flask_host, port=flask_port)