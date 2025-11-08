#!/usr/bin/env python3
"""
Video Generation API Server

A Flask-based REST API for processing images into videos with optional sound.
Supports file uploads and custom prompts for each image.
"""

import os
import sys
import tempfile
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
from werkzeug.utils import secure_filename
import concurrent.futures

# Add the module directories to Python path
sys.path.append(str(Path(__file__).parent / "videogeneration"))
sys.path.append(str(Path(__file__).parent / "soundgeneration"))

from videogeneration import generate_video_from_image
from soundgeneration import generate_sound_for_video

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Configuration
UPLOAD_FOLDER = os.path.abspath('uploads')
OUTPUT_FOLDER = os.path.abspath('output')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Create directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_single_image(image_path: str, index: int, output_dir: str, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
    """Process a single image into video (same as example_usage.py)."""
    try:
        output_filename = f"video_{index+1:02d}.mp4"
        output_path = os.path.join(output_dir, output_filename)

        print(f"🎬 Generating video {index + 1} from: {os.path.basename(image_path)}")
        print(f"   📁 Full image path: {image_path}")
        print(f"   📁 Output path: {output_path}")
        print(f"   📏 File exists: {os.path.exists(image_path)}")
        if os.path.exists(image_path):
            print(f"   📊 File size: {os.path.getsize(image_path)} bytes")

        # Combine system prompt with custom prompt if provided
        system_prompt = "smooth animation, natural movement, facial reactions and actions only, NO Lip movement, high quality"
        if custom_prompt:
            positive_prompt = f"{system_prompt}, {custom_prompt}"
            print(f"   📝 Using custom prompt: {custom_prompt}")
        else:
            positive_prompt = system_prompt

        print(f"   🤖 Using model: bytedance:1@1")
        result = generate_video_from_image(
            image_path=image_path,
            output_path=output_path,
            positive_prompt=positive_prompt,
            duration=5,
            model="bytedance:1@1",
            width=1248,
            height=704,
            fps=24
        )
        
        print(f"✅ Video {index + 1} completed: {os.path.basename(output_path)}")
        return {
            'index': index,
            'image_filename': os.path.basename(image_path),
            'video_filename': output_filename,
            'video_path': output_path,
            'video_url': result['videoURL'],
            'model_used': "bytedance:1@1",
            'success': True
        }

    except Exception as e:
        print(f"❌ Video {index + 1} failed: {os.path.basename(image_path)} - {e}")
        return {
            'index': index,
            'image_filename': os.path.basename(image_path),
            'success': False,
            'error': str(e)
        }

def process_single_sound(video_result: Dict[str, Any], output_dir: str) -> Dict[str, Any]:
    """Add sound to a single video."""
    try:
        index = video_result['index']
        video_path = video_result['video_path']

        print(f"🎵 Adding sound to video {index + 1}: {os.path.basename(video_path)}")

        sound_video_paths = generate_sound_for_video(
            video_source=video_path,  # Use local file (no re-download)
            output_dir=output_dir,
            output_prefix=f"sound_video_{index+1:02d}",
            text_prompt="cinematic sound effects, ambient sounds, facial reactions, actions",
            negative_prompt="speech, talking, dialogue, vocals, words",
            duration=5,
            creativity_coef=6
        )

        print(f"✅ Sound {index + 1} completed: {len(sound_video_paths)} file(s)")
        return {
            'index': index,
            'video_path': video_path,
            'sound_video_paths': sound_video_paths,
            'success': True
        }

    except Exception as e:
        print(f"❌ Sound {index + 1} failed: {os.path.basename(video_result['video_path'])} - {e}")
        return {
            'index': index,
            'video_path': video_result['video_path'],
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    """Serve the main HTML page."""
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Generation API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .file-list { margin: 20px 0; }
        .file-item { display: flex; align-items: center; margin: 10px 0; }
        .progress { width: 100%; background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background: #4CAF50; width: 0%; transition: width 0.3s; }
        .result { margin: 20px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <h1>🎬 Video Generation API</h1>
    <p>Upload PNG images and generate videos with optional custom prompts and sound.</p>

    <form id="uploadForm" enctype="multipart/form-data">
        <div class="upload-area" id="uploadArea">
            <p>Drag & drop images here or click to browse</p>
            <input type="file" id="fileInput" name="files" multiple accept="image/*" style="display: none;">
        </div>

        <div id="fileList" class="file-list"></div>

        <div style="margin: 20px 0;">
            <label>
                <input type="checkbox" id="addSound" checked> Add sound effects to videos
            </label>
        </div>

        <button type="submit" id="submitBtn">Generate Videos</button>
    </form>

    <div id="progress" style="display: none;">
        <h3>Processing...</h3>
        <div class="progress">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        <div id="status"></div>
    </div>

    <div id="results"></div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const uploadForm = document.getElementById('uploadForm');
        const submitBtn = document.getElementById('submitBtn');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progressBar');
        const status = document.getElementById('status');
        const results = document.getElementById('results');

        let selectedFiles = [];

        // Drag and drop functionality
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#007bff';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ccc';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });

        function handleFiles(files) {
            selectedFiles = files.filter(file => file.type.startsWith('image/'));
            updateFileList();
        }

        function updateFileList() {
            fileList.innerHTML = '';
            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <input type="text" placeholder="Custom prompt (optional)" style="margin-left: 20px; flex: 1; padding: 5px;">
                    <button type="button" onclick="removeFile(${index})" style="margin-left: 10px;">❌</button>
                `;
                fileList.appendChild(fileItem);
            });
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            updateFileList();
        }

        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (selectedFiles.length === 0) {
                alert('Please select at least one image file.');
                return;
            }

            const formData = new FormData();
            selectedFiles.forEach(file => formData.append('files', file));

            // Add prompts
            const promptInputs = document.querySelectorAll('#fileList input[type="text"]');
            promptInputs.forEach((input, index) => {
                if (input.value.trim()) {
                    formData.append('prompts', input.value.trim());
                } else {
                    formData.append('prompts', ''); // Empty prompt
                }
            });

            formData.append('add_sound', document.getElementById('addSound').checked.toString());

            submitBtn.disabled = true;
            progress.style.display = 'block';
            results.innerHTML = '';

            try {
                const response = await fetch('/api/generate-videos', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    displayResults(result);
                } else {
                    throw new Error(result.error || 'Processing failed');
                }
            } catch (error) {
                results.innerHTML = `<div class="result error">❌ Error: ${error.message}</div>`;
            } finally {
                submitBtn.disabled = false;
                progress.style.display = 'none';
            }
        });

        function displayResults(data) {
            let html = '<h3>🎉 Processing Complete!</h3>';

            if (data.video_results) {
                html += '<h4>Generated Videos:</h4>';
                data.video_results.forEach(result => {
                    if (result.success) {
                        html += `
                            <div class="result success">
                                ✅ ${result.image_filename} → ${result.video_filename}<br>
                                <a href="${result.video_url}" target="_blank">📺 View Video</a>
                            </div>
                        `;
                    } else {
                        html += `<div class="result error">❌ ${result.image_filename}: ${result.error}</div>`;
                    }
                });
            }

            if (data.sound_results) {
                html += '<h4>Videos with Sound:</h4>';
                data.sound_results.forEach(result => {
                    if (result.success && result.sound_video_paths) {
                        result.sound_video_paths.forEach(path => {
                            const filename = path.split('/').pop();
                            html += `<div class="result success">🎵 ${filename}</div>`;
                        });
                    }
                });
            }

            results.innerHTML = html;
        }
    </script>
</body>
</html>
    """
    return render_template_string(html)

@app.route('/api/generate-videos', methods=['POST'])
def generate_videos():
    """API endpoint to generate videos from uploaded images."""
    try:
        # Check if files were uploaded
        if 'files' not in request.files:
            return jsonify({'error': 'No files uploaded'}), 400

        files = request.files.getlist('files')
        prompts = request.form.getlist('prompts')
        add_sound = request.form.get('add_sound', 'true').lower() == 'true'

        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files selected'}), 400

        # Validate and save uploaded files
        uploaded_files = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                uploaded_files.append(file_path)
            else:
                return jsonify({'error': f'Invalid file type: {file.filename}'}), 400

        # Create prompt list matching number of images
        image_prompts = prompts + [None] * (len(uploaded_files) - len(prompts))
        image_prompts = image_prompts[:len(uploaded_files)]

        # Phase 1: Generate videos in parallel
        video_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(3, len(uploaded_files))) as executor:
            future_to_index = {
                executor.submit(process_single_image, img_path, i, app.config['OUTPUT_FOLDER'], image_prompts[i]): i
                for i, img_path in enumerate(uploaded_files)
            }

            for future in concurrent.futures.as_completed(future_to_index):
                result = future.result()
                video_results.append(result)

        # Sort results by index
        video_results.sort(key=lambda x: x['index'])

        # Filter successful results
        successful_videos = [r for r in video_results if r['success']]

        response_data = {
            'video_results': video_results,
            'successful_videos': len(successful_videos),
            'total_videos': len(video_results)
        }

        # Phase 2: Add sound if requested
        if add_sound and successful_videos:
            sound_results = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=min(3, len(successful_videos))) as executor:
                future_to_video = {
                    executor.submit(process_single_sound, video_result, app.config['OUTPUT_FOLDER']): video_result
                    for video_result in successful_videos
                }

                for future in concurrent.futures.as_completed(future_to_video):
                    result = future.result()
                    sound_results.append(result)

            # Sort results by index
            sound_results.sort(key=lambda x: x['index'])

            response_data['sound_results'] = sound_results
            response_data['successful_sounds'] = len([r for r in sound_results if r['success']])

        # Clean up uploaded files
        for file_path in uploaded_files:
            try:
                os.remove(file_path)
            except:
                pass  # Ignore cleanup errors

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    """Serve generated video files for download."""
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    print("🎬 Video Generation API Server")
    print("📡 Starting server on http://localhost:8080")
    print("🌐 Open your browser to upload images and generate videos!")
    app.run(debug=True, host='0.0.0.0', port=8080)