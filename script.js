// Configuration - REPLACE WITH YOUR ACTUAL MODEL URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/PDP2vtgBM/";

console.log("🎨 Tertiary Color Detector Initializing...");

// Global variables
let model = null;
let webcam = null;
let currentImage = null;

// DOM Elements - Using IDs from HTML
const elements = {
    loadModelBtn: document.getElementById('load-model-btn'),
    modelStatus: document.getElementById('model-status'),
    cameraBtn: document.getElementById('camera-btn'),
    fileInput: document.getElementById('file-input'),
    webcamContainer: document.getElementById('webcam-container'),
    webcamElement: document.getElementById('webcam'),
    snapBtn: document.getElementById('snap-btn'),
    imagePreview: document.getElementById('image-preview'),
    detectBtn: document.getElementById('detect-btn'),
    resultsDiv: document.getElementById('results'),
    predictionsDiv: document.getElementById('predictions'),
    previewArea: document.querySelector('.preview-area')
};

console.log("✅ DOM Elements loaded:", Object.keys(elements));

// Initialize the application
function init() {
    console.log("🚀 Initializing application...");
    
    // Add event listeners
    elements.loadModelBtn.addEventListener('click', loadModel);
    elements.fileInput.addEventListener('change', handleImageUpload);
    elements.cameraBtn.addEventListener('click', initWebcam);
    elements.snapBtn.addEventListener('click', capturePhoto);
    elements.detectBtn.addEventListener('click', detectColors);
    
    // Initialize canvas and UI
    initializeCanvas();
    
    console.log("✅ Application initialized successfully!");
}

// Initialize canvas with placeholder
function initializeCanvas() {
    console.log("🖼️ Initializing canvas...");
    
    // Set initial canvas dimensions
    elements.imagePreview.width = 600;
    elements.imagePreview.height = 400;
    elements.imagePreview.style.display = 'none';
    
    // Create placeholder text
    if (elements.previewArea) {
        const placeholder = document.createElement('div');
        placeholder.id = 'canvas-placeholder';
        placeholder.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📷</div>
            <div style="font-size: 18px; color: #666; margin-bottom: 10px;">
                Upload an image or use camera
            </div>
            <div style="font-size: 14px; color: #999;">
                Supported formats: JPG, PNG, GIF
            </div>
        `;
        placeholder.style.padding = '60px 20px';
        elements.previewArea.appendChild(placeholder);
    }
}

// Load the Teachable Machine model
async function loadModel() {
    console.log("🤖 Loading model from:", MODEL_URL);
    
    try {
        // Update UI
        elements.loadModelBtn.innerHTML = '<span class="loading"></span> Loading...';
        elements.loadModelBtn.disabled = true;
        elements.modelStatus.textContent = "🔄 Loading color detection model...";
        elements.modelStatus.style.background = "#fff3cd";
        elements.modelStatus.style.color = "#856404";
        
        // Load the model
        model = await tmImage.load(
            MODEL_URL + "model.json",
            MODEL_URL + "metadata.json"
        );
        
        console.log("✅ Model loaded successfully!");
        console.log("📊 Model has", model.getTotalClasses(), "classes");
        
        // Update UI on success
        elements.loadModelBtn.innerHTML = '✅ Model Loaded';
        elements.loadModelBtn.style.background = "linear-gradient(135deg, #34d399 0%, #059669 100%)";
        elements.modelStatus.textContent = "✅ Model loaded successfully! You can now upload images.";
        elements.modelStatus.style.background = "#d4edda";
        elements.modelStatus.style.color = "#155724";
        elements.cameraBtn.disabled = false;
        
        // Show success message for 3 seconds
        setTimeout(() => {
            elements.modelStatus.textContent = "Ready to detect tertiary colors!";
        }, 3000);
        
    } catch (error) {
        console.error("❌ Error loading model:", error);
        
        // Update UI on error
        elements.loadModelBtn.innerHTML = '🔄 Try Again';
        elements.loadModelBtn.disabled = false;
        elements.modelStatus.textContent = "❌ Error: " + error.message;
        elements.modelStatus.style.background = "#f8d7da";
        elements.modelStatus.style.color = "#721c24";
        
        // Show detailed error in console
        console.log("🔧 Troubleshooting tips:");
        console.log("1. Check if model URL is correct:", MODEL_URL);
        console.log("2. Verify model is uploaded to cloud in Teachable Machine");
        console.log("3. Check browser console for network errors");
    }
}

// Handle image file upload
function handleImageUpload(event) {
    console.log("📁 File upload triggered");
    
    const file = event.target.files[0];
    if (!file) {
        console.log("⚠️ No file selected");
        return;
    }
    
    console.log("📄 Selected file:", {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + ' KB'
    });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert("❌ Please select an image file (JPG, PNG, GIF, etc.)");
        elements.fileInput.value = ''; // Clear file input
        return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ Image is too large. Please select an image under 5MB.");
        elements.fileInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log("✅ File loaded successfully");
        
        // Remove placeholder if exists
        const placeholder = document.getElementById('canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Display the image
        displayImage(e.target.result);
    };
    
    reader.onerror = function(error) {
        console.error("❌ Error reading file:", error);
        alert("❌ Error reading the image file. Please try another image.");
        elements.fileInput.value = '';
    };
    
    reader.onprogress = function(event) {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            console.log(`📥 Loading: ${percent}%`);
        }
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
}

// Display image on canvas
function displayImage(imageSrc) {
    console.log("🖼️ Displaying image...");
    
    const canvas = elements.imagePreview;
    const ctx = canvas.getContext('2d');
    
    // Clear previous image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    
    img.onload = function() {
        console.log("✅ Image loaded:", img.width, "x", img.height);
        
        // Calculate dimensions to fit within canvas while maintaining aspect ratio
        const maxWidth = 600;
        const maxHeight = 400;
        
        let width = img.width;
        let height = img.height;
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Style and show canvas
        canvas.style.display = 'block';
        canvas.style.border = '3px solid #667eea';
        canvas.style.borderRadius = '12px';
        canvas.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
        canvas.style.background = 'white';
        
        console.log("✅ Image displayed on canvas:", canvas.width, "x", canvas.height);
        
        // Store for detection
        currentImage = img;
        
        // Enable detect button if model is loaded
        if (model) {
            elements.detectBtn.disabled = false;
            elements.detectBtn.style.opacity = '1';
            console.log("🔍 Detect button enabled");
        } else {
            console.log("⚠️ Model not loaded yet. Load model first.");
        }
    };
    
    img.onerror = function() {
        console.error("❌ Failed to load image");
        alert("❌ Could not load the image. The file might be corrupted or in an unsupported format.");
        elements.fileInput.value = '';
    };
    
    // Set image source (triggers loading)
    img.src = imageSrc;
    console.log("🔄 Setting image source...");
}

// Initialize webcam
async function initWebcam() {
    console.log("📷 Initializing webcam...");
    
    try {
        // Update UI
        elements.cameraBtn.innerHTML = '<span class="loading"></span> Starting...';
        elements.cameraBtn.disabled = true;
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment' // Prefer rear camera on mobile
            } 
        });
        
        // Set up webcam video
        elements.webcamElement.srcObject = stream;
        elements.webcamContainer.style.display = 'block';
        elements.cameraBtn.style.display = 'none';
        
        // Wait for video to be ready
        elements.webcamElement.onloadedmetadata = function() {
            console.log("✅ Webcam ready:", 
                elements.webcamElement.videoWidth, 
                "x", 
                elements.webcamElement.videoHeight
            );
        };
        
        // Store webcam reference
        webcam = { 
            stream: stream, 
            video: elements.webcamElement 
        };
        
        console.log("✅ Webcam initialized successfully");
        
    } catch (error) {
        console.error("❌ Webcam error:", error);
        
        // Reset UI
        elements.cameraBtn.innerHTML = '📷 Use Camera';
        elements.cameraBtn.disabled = false;
        
        // Show user-friendly error message
        let errorMessage = "Error accessing camera: ";
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += "No camera found. Please connect a camera.";
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += "Camera permission denied. Please allow camera access.";
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += "Camera is already in use by another application.";
        } else {
            errorMessage += error.message;
        }
        
        alert("❌ " + errorMessage);
    }
}

// Capture photo from webcam
function capturePhoto() {
    console.log("📸 Capturing photo...");
    
    if (!webcam || !webcam.video) {
        console.error("❌ Webcam not initialized");
        return;
    }
    
    // Create temporary canvas for capture
    const canvas = document.createElement('canvas');
    canvas.width = webcam.video.videoWidth;
    canvas.height = webcam.video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame
    ctx.drawImage(webcam.video, 0, 0, canvas.width, canvas.height);
    
    // Stop webcam stream
    if (webcam.stream) {
        webcam.stream.getTracks().forEach(track => {
            track.stop();
            console.log("🛑 Stopped track:", track.kind);
        });
    }
    
    // Hide webcam container
    elements.webcamContainer.style.display = 'none';
    elements.cameraBtn.style.display = 'inline-block';
    elements.cameraBtn.innerHTML = '📷 Use Camera';
    elements.cameraBtn.disabled = false;
    
    webcam = null;
    
    // Display captured image
    displayImage(canvas.toDataURL('image/png'));
    
    console.log("✅ Photo captured and displayed");
}

// Detect colors in image
async function detectColors() {
    console.log("🔍 Starting color detection...");
    
    if (!model) {
        alert("⚠️ Please load the model first by clicking 'Load Color Detection Model'!");
        return;
    }
    
    if (!currentImage) {
        alert("⚠️ Please upload an image or capture a photo first!");
        return;
    }
    
    try {
        // Update UI
        elements.detectBtn.innerHTML = '<span class="loading"></span> Detecting...';
        elements.detectBtn.disabled = true;
        
        // Run prediction
        console.log("🤖 Running prediction on image...");
        const startTime = performance.now();
        const predictions = await model.predict(currentImage);
        const endTime = performance.now();
        
        console.log("✅ Predictions received in", (endTime - startTime).toFixed(2), "ms");
        console.log("📊 Predictions:", predictions);
        
        // Display results
        displayPredictions(predictions);
        
        // Update UI
        elements.detectBtn.innerHTML = '🔍 Detect Tertiary Colors';
        elements.detectBtn.disabled = false;
        
    } catch (error) {
        console.error("❌ Detection error:", error);
        
        // Update UI on error
        elements.detectBtn.innerHTML = '🔍 Detect Tertiary Colors';
        elements.detectBtn.disabled = false;
        
        alert("❌ Error detecting colors: " + error.message);
    }
}

// Display prediction results
function displayPredictions(predictions) {
    console.log("📈 Displaying predictions...");
    
    // Show results section
    elements.resultsDiv.style.display = 'block';
    elements.predictionsDiv.innerHTML = '';
    
    // Sort predictions by probability (highest first)
    predictions.sort((a, b) => b.probability - a.probability);
    
    // Find the highest prediction
    const topPrediction = predictions[0];
    const confidence = (topPrediction.probability * 100).toFixed(1);
    
    // Add title with top result
    const title = document.createElement('h3');
    title.innerHTML = `Detected: <span style="color: #667eea;">${topPrediction.className}</span> (${confidence}% confidence)`;
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    elements.predictionsDiv.appendChild(title);
    
    // Display all predictions with progress bars
    predictions.forEach((pred, index) => {
        const probability = (pred.probability * 100).toFixed(2);
        
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        predictionItem.style.animationDelay = (index * 0.1) + 's';
        predictionItem.style.animation = 'fadeIn 0.5s ease forwards';
        predictionItem.style.opacity = '0';
        
        predictionItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 1.1em;">${pred.className}</strong>
                <span style="font-weight: bold; color: #667eea;">${probability}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${probability}%"></div>
            </div>
        `;
        
        elements.predictionsDiv.appendChild(predictionItem);
    });
    
    // Scroll to results
    setTimeout(() => {
        elements.resultsDiv.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
    
    console.log("✅ Predictions displayed");
}

// Add progress bar styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .prediction-item {
        animation: fadeIn 0.5s ease forwards;
    }
`;
document.head.appendChild(style);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

console.log("✨ Tertiary Color Detector ready!");
