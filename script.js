// Configuration
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/PDP2vtgBM/";

console.log("Script loaded. Model URL:", MODEL_URL);

// Global variables
let model = null;

// DOM Elements
const loadModelBtn = document.getElementById('load-model-btn');
const modelStatus = document.getElementById('model-status');

// Load Model Function
async function loadModel() {
    console.log("Load button clicked");
    
    try {
        modelStatus.textContent = "Loading model...";
        modelStatus.style.background = "#fff3cd";
        loadModelBtn.disabled = true;
        
        console.log("Attempting to load model from:", MODEL_URL);
        
        // Test if URLs are accessible
        console.log("Testing model.json URL:", MODEL_URL + "model.json");
        console.log("Testing metadata.json URL:", MODEL_URL + "metadata.json");
        
        // Try to fetch the model.json first
        const modelResponse = await fetch(MODEL_URL + "model.json");
        console.log("Model fetch response:", modelResponse.status);
        
        if (!modelResponse.ok) {
            throw new Error(`HTTP ${modelResponse.status}: ${modelResponse.statusText}`);
        }
        
        // Load the model
        console.log("Loading with tmImage.load...");
        model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
        
        console.log("Model loaded successfully!");
        modelStatus.textContent = "✅ Model loaded successfully!";
        modelStatus.style.background = "#d4edda";
        
        // Enable other buttons
        document.getElementById('camera-btn').disabled = false;
        document.getElementById('detect-btn').disabled = false;
        
    } catch (error) {
        console.error("Detailed error:", error);
        modelStatus.textContent = `❌ Error: ${error.message}`;
        modelStatus.style.background = "#f8d7da";
        
        // Try alternative URL format
        console.log("Trying alternative URL format...");
        tryAlternativeURL();
    }
}

// Try alternative URL format
async function tryAlternativeURL() {
    const altURL = MODEL_URL.replace(/\/$/, '') + "/model.json";
    console.log("Trying alternative URL:", altURL);
    
    try {
        const response = await fetch(altURL);
        if (response.ok) {
            modelStatus.textContent += "\n⚠️ Try removing / from MODEL_URL";
        }
    } catch (e) {
        console.log("Alternative also failed:", e.message);
    }
}

// Initialize
function init() {
    console.log("Initializing app...");
    
    // Check if Teachable Machine library is loaded
    if (typeof tmImage === 'undefined') {
        modelStatus.textContent = "❌ Teachable Machine library not loaded";
        return;
    }
    
    console.log("tmImage available:", typeof tmImage);
    
    loadModelBtn.addEventListener('click', loadModel);
    
    // Simple file upload handler for testing
    document.getElementById('file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.getElementById('image-preview');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    window.currentImage = img;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);
