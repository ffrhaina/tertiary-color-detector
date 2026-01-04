// Configuration - REPLACE WITH YOUR MODEL URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/";

// Global variables
let model = null;
let webcam = null;
let currentImage = null;

// DOM Elements
const loadModelBtn = document.getElementById('load-model-btn');
const modelStatus = document.getElementById('model-status');
const cameraBtn = document.getElementById('camera-btn');
const fileInput = document.getElementById('file-input');
const webcamContainer = document.getElementById('webcam-container');
const webcamElement = document.getElementById('webcam');
const snapBtn = document.getElementById('snap-btn');
const imagePreview = document.getElementById('image-preview');
const detectBtn = document.getElementById('detect-btn');
const resultsDiv = document.getElementById('results');
const predictionsDiv = document.getElementById('predictions');

// Initialize
async function init() {
    // Load model when button is clicked
    loadModelBtn.addEventListener('click', loadModel);
    
    // File input handler
    fileInput.addEventListener('change', handleImageUpload);
    
    // Camera button handler
    cameraBtn.addEventListener('click', initWebcam);
    
    // Snap photo handler
    snapBtn.addEventListener('click', capturePhoto);
    
    // Detect button handler
    detectBtn.addEventListener('click', detectColors);
}

// Load Teachable Machine model
async function loadModel() {
    try {
        modelStatus.textContent = "Loading model...";
        modelStatus.style.background = "#fff3cd";
        loadModelBtn.disabled = true;
        
        // Load the model
        model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
        
        modelStatus.textContent = "✅ Model loaded successfully!";
        modelStatus.style.background = "#d4edda";
        cameraBtn.disabled = false;
        detectBtn.disabled = false;
        
        console.log("Model loaded successfully");
    } catch (error) {
        modelStatus.textContent = "❌ Error loading model: " + error.message;
        modelStatus.style.background = "#f8d7da";
        console.error("Error loading model:", error);
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        displayImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Initialize webcam
async function initWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'environment'
            } 
        });
        
        webcamElement.srcObject = stream;
        webcamContainer.style.display = 'block';
        cameraBtn.style.display = 'none';
        
        webcam = {
            stream: stream,
            video: webcamElement
        };
    } catch (error) {
        alert("Error accessing camera: " + error.message);
    }
}

// Capture photo from webcam
function capturePhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamElement, 0, 0);
    
    displayImage(canvas.toDataURL('image/png'));
    
    // Stop webcam
    webcam.stream.getTracks().forEach(track => track.stop());
    webcamContainer.style.display = 'none';
    cameraBtn.style.display = 'inline-block';
    webcam = null;
}

// Display image on canvas
function displayImage(imageSrc) {
    const ctx = imagePreview.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Set canvas dimensions
        imagePreview.width = Math.min(800, img.width);
        imagePreview.height = (img.height / img.width) * imagePreview.width;
        
        // Draw image
        ctx.drawImage(img, 0, 0, imagePreview.width, imagePreview.height);
        
        // Store current image
        currentImage = img;
        
        // Show detect button if model is loaded
        if (model) {
            detectBtn.disabled = false;
        }
    };
    
    img.src = imageSrc;
}

// Detect colors in image
async function detectColors() {
    if (!model) {
        alert("Please load the model first!");
        return;
    }
    
    if (!currentImage && !webcam) {
        alert("Please upload an image or use the camera first!");
        return;
    }
    
    try {
        detectBtn.disabled = true;
        detectBtn.textContent = "Detecting...";
        
        let predictions;
        
        if (currentImage) {
            // Use uploaded image
            predictions = await model.predict(currentImage);
        } else {
            // Use webcam frame
            predictions = await model.predict(webcamElement);
        }
        
        displayPredictions(predictions);
        
    } catch (error) {
        console.error("Detection error:", error);
        alert("Error detecting colors: " + error.message);
    } finally {
        detectBtn.disabled = false;
        detectBtn.textContent = "🔍 Detect Tertiary Colors";
    }
}

// Display predictions
function displayPredictions(predictions) {
    resultsDiv.style.display = 'block';
    predictionsDiv.innerHTML = '';
    
    // Sort predictions by probability
    predictions.sort((a, b) => b.probability - a.probability);
    
    // Display top predictions
    predictions.forEach(pred => {
        const probability = (pred.probability * 100).toFixed(2);
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        predictionItem.innerHTML = `
            <strong>${pred.className}:</strong> ${probability}%
            <div class="progress-bar">
                <div class="progress" style="width: ${probability}%"></div>
            </div>
        `;
        predictionsDiv.appendChild(predictionItem);
    });
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Add CSS for progress bar
const style = document.createElement('style');
style.textContent = `
    .progress-bar {
        width: 100%;
        height: 20px;
        background: #e0e0e0;
        border-radius: 10px;
        margin-top: 5px;
        overflow: hidden;
    }
    .progress {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 10px;
        transition: width 0.5s;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
