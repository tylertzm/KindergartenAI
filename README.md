# 🎬 KindergartenAI - Turn Stories into Cinematic Videos

<div align="center">

![KindergartenAI Banner](https://img.shields.io/badge/KindergartenAI-Story_to_Video-FF6B6B?style=for-the-badge&logo=movie-camera&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=flat-square&logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=flat-square&logo=flask&logoColor=white)

**Transform your storyboards into Hollywood-worthy videos with AI-powered animation and cinematic sound effects**

[🚀 Quick Start](#-quick-start) • [🎯 Features](#-features) • [📖 Documentation](#-documentation) • [🛠️ Tech Stack](#️-tech-stack)

</div>

---

## 🌟 What is KindergartenAI?

**For Storytellers & Creators:** Imagine bringing your storyboards to life with just a few clicks! KindergartenAI takes your static images and transforms them into smooth, animated videos complete with professional sound effects. Whether you're a children's book author, animator, or content creator, turn your visual stories into cinematic experiences.

**For Developers:** A modular Python framework with React frontend that leverages Runware and Mirelo APIs for AI-powered video generation. Features parallel processing, custom prompts, and a RESTful API for seamless integration.

---

## ✨ Features

### 🎨 Creative Tools
- **Storyboard to Video**: Convert static images into fluid animations
- **Cinematic Sound Design**: Add professional sound effects and ambient audio
- **Custom Prompts**: Guide the AI with your creative vision
- **Individual Regeneration**: Fix and improve specific scenes without reprocessing everything

### ⚡ Performance
- **Parallel Processing**: Generate multiple videos simultaneously
- **Smart Caching**: Avoid redundant downloads and processing
- **Real-time Progress**: Visual feedback during generation
- **Batch Operations**: Process entire storyboards at once

### 🎯 User Experience
- **Intuitive Interface**: Drag-and-drop storyboard creation
- **Audio Integration**: Combine narration with generated sound effects
- **Theme Selection**: Multiple visual styles and moods
- **Fullscreen Preview**: Professional video playback experience

---

## 🚀 Quick Start

### For Non-Technical Users

1. **Download the Project**
   ```bash
   git clone https://github.com/tylertzm/KindergartenAI.git
   cd KindergartenAI
   ```

2. **Install Dependencies**
   ```bash
   # Backend (Python)
   pip install -r requirements.txt

   # Frontend (React)
   cd _frontend
   npm install
   cd ..
   ```

3. **Get API Keys**
   - Sign up for [Runware API](https://runware.ai) (for video generation)
   - Sign up for [Mirelo API](https://mirelo.ai) (for sound effects)

4. **Configure Environment**
   ```bash
   # Create .env file
   RUNWARE_API_KEY=your_runware_key_here
   MIRELO_API_KEY=your_mirelo_key_here
   ```

5. **Launch the Application**
   ```bash
   # Start backend (Terminal 1)
   python server.py

   # Start frontend (Terminal 2)
   cd _frontend && npm run dev
   ```

6. **Create Your First Video!**
   - Open http://localhost:5173
   - Upload your storyboard images
   - Add custom prompts for each scene
   - Click "Generate Videos" and watch the magic happen!

### For Developers

```python
from kindergartenai import VideoGenerator

# Initialize with your API keys
generator = VideoGenerator(
    runware_key="your_runware_key",
    mirelo_key="your_mirelo_key"
)

# Generate video from single image
result = generator.generate_from_image(
    image_path="storyboard_scene_1.jpg",
    prompt="smooth camera movement, magical atmosphere",
    add_sound=True
)

print(f"Video ready: {result['video_url']}")
```

---

## 🎬 How It Works

### The Magic Pipeline

1. **📸 Storyboard Input**: Upload your scene images
2. **🎭 AI Animation**: Runware transforms static images into fluid motion
3. **🔊 Sound Design**: Mirelo adds cinematic audio layers
4. **🎞️ Final Video**: Professional-quality videos with synchronized sound

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   Flask Backend │    │   AI APIs       │
│                 │    │                 │    │                 │
│ • Storyboard UI │◄──►│ • REST API      │◄──►│ • Runware       │
│ • Video Player  │    │ • File Upload   │    │ • Mirelo        │
│ • Progress UI   │    │ • Parallel Proc │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📖 Documentation

### API Reference

#### Generate Videos Endpoint
```http
POST /api/generate-videos
Content-Type: multipart/form-data

# Form Data:
files: [image1.jpg, image2.jpg, ...]  # Your storyboard images
prompts: ["scene description 1", "scene description 2", ...]  # Optional custom prompts
add_sound: "true"  # Whether to add sound effects
```

**Response:**
```json
{
  "video_results": [
    {
      "index": 0,
      "success": true,
      "video_filename": "video_01.mp4",
      "video_url": "http://localhost:8080/api/download/video_01.mp4"
    }
  ],
  "sound_results": [
    {
      "index": 0,
      "success": true,
      "sound_video_paths": ["output/sound_video_01_1.mp4"]
    }
  ],
  "successful_videos": 2,
  "total_videos": 2
}
```

### Module Usage

#### Video Generation
```python
from videogeneration.videogeneration import generate_video_from_image

result = generate_video_from_image(
    image_path="scene.jpg",
    output_path="output/video.mp4",
    positive_prompt="smooth camera pan, magical lighting",
    duration=5,
    width=1248,
    height=704
)
```

#### Sound Generation
```python
from soundgeneration.soundgeneration import generate_sound_for_video

videos_with_sound = generate_sound_for_video(
    video_source="path/to/video.mp4",
    output_dir="./output",
    text_prompt="cinematic atmosphere, ambient sounds",
    creativity_coef=7
)
```

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+**: Core runtime
- **Flask**: REST API framework
- **ThreadPoolExecutor**: Parallel processing
- **Runware API**: AI video generation
- **Mirelo API**: Sound effect generation

### Frontend
- **React 19.2**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling (implied from component classes)

### Development
- **Git**: Version control
- **pip**: Python package management
- **npm**: Node package management

---

## 🎯 Use Cases

### 📚 Children's Book Authors
Transform illustrated storybooks into animated videos for digital publishing.

### 🎬 Content Creators
Create engaging video content from storyboards and mood boards.

### 🎮 Game Developers
Generate animated scenes and cinematics from concept art.

### 🎓 Educators
Bring historical events or scientific concepts to life with animated explanations.

### 📱 Social Media
Create eye-catching video content from static designs and illustrations.

---

## 🔧 Configuration

### Environment Variables
```bash
# Required API Keys
RUNWARE_API_KEY=your_runware_api_key
MIRELO_API_KEY=your_mirelo_api_key

# Optional: Custom Paths
UPLOAD_FOLDER=./uploads
OUTPUT_FOLDER=./output
```

### Video Settings
- **Resolution**: 1248x704 (optimized for Runware API)
- **Duration**: 5 seconds per scene
- **Format**: MP4 with H.264 encoding
- **Frame Rate**: 24 FPS

### Sound Settings
- **Duration**: 10 seconds processing
- **Creativity**: 1-10 scale (5 = balanced)
- **Style**: Cinematic, ambient, atmospheric

---

## 🚨 Troubleshooting

### Common Issues

**❌ "API Key Invalid"**
- Double-check your API keys in `.env`
- Ensure keys are for the correct services

**❌ "Video Generation Failed"**
- Verify image format (PNG/JPG/JPEG/WEBP)
- Check image resolution (recommended: 1024x576+)
- Try different prompts

**❌ "Sound Generation Failed"**
- Ensure video file exists and is accessible
- Check Mirelo API quota
- Try adjusting creativity coefficient

**❌ "Frontend Won't Load"**
- Confirm backend is running on port 8080
- Check CORS settings
- Clear browser cache

### Performance Tips

- **Batch Processing**: Process multiple images together for efficiency
- **Parallel Workers**: Limit to 3 concurrent operations to avoid API rate limits
- **Image Quality**: Higher resolution images produce better videos
- **Prompt Engineering**: Specific, descriptive prompts yield better results

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### For Everyone
- 🐛 **Report Bugs**: Found an issue? [Open an issue](https://github.com/tylertzm/KindergartenAI/issues)
- 💡 **Suggest Features**: Have an idea? [Start a discussion](https://github.com/tylertzm/KindergartenAI/discussions)
- 📖 **Improve Docs**: Help make our documentation better

### For Developers
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Development Setup
```bash
# Clone and setup
git clone https://github.com/your-username/KindergartenAI.git
cd KindergartenAI

# Install all dependencies
pip install -r requirements.txt
cd _frontend && npm install && cd ..

# Run tests
python -m pytest

# Start development servers
python server.py &  # Backend
cd _frontend && npm run dev  # Frontend
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Runware AI**: For their incredible video generation technology
- **Mirelo**: For professional sound design capabilities
- **React & Flask Communities**: For amazing web development tools
- **Open Source Community**: For the foundation that makes this possible

---

<div align="center">

**Made with ❤️ for storytellers, creators, and dreamers**

[⭐ Star us on GitHub](https://github.com/tylertzm/KindergartenAI) • [📧 Contact Us](mailto:hello@kindergartenai.com) • [🐛 Report Issues](https://github.com/tylertzm/KindergartenAI/issues)

</div>

### Usage as Module

```python
from soundgeneration.soundgeneration import generate_sound_for_video

# Add sound effects to video from URL
result_paths = generate_sound_for_video(
    video_source="https://example.com/video.mp4",  # URL or local file path
    output_dir="./output",  # Optional: defaults to "./output"
    text_prompt="cinematic sound effects, ambient sounds",
    negative_prompt="speech, talking, dialogue, vocals, words",
    duration=10,  # seconds to process
    creativity_coef=5  # 1-10 scale
)

print(f"Generated videos: {result_paths}")
```

### Command Line Usage

```bash
cd soundgeneration
# From URL
python soundgeneration.py "https://example.com/video.mp4" --output-dir ./output
# From local file
python soundgeneration.py "/path/to/local/video.mp4" --output-dir ./output
```

### Parameters

- `video_source`: URL of video to process OR path to local video file (required)
- `output_dir`: Directory for results (optional, defaults to "./output")
- `output_prefix`: Prefix for output filenames (optional, defaults to "result_video")
- `text_prompt`: Sound style guidance
- `negative_prompt`: Sounds to avoid (default: no speech)
- `duration`: Processing length in seconds (default: 10, max: 10)
- `creativity_coef`: Sound variety (1-10, default: 5)
- `num_samples`: Number of variations (default: 1)
- `api_key`: Mirelo API key (or set `MIRELO_API_KEY` env var)

### Command Line Usage

```bash
cd soundgeneration
python soundgeneration.py "https://example.com/video.mp4" --output-dir ./output --output-prefix my_video
```

### Parameters

- `video_url`: URL of video to process (required)
- `output_dir`: Directory for results (optional)
- `text_prompt`: Sound style guidance
- `negative_prompt`: Sounds to avoid (default: no speech)
- `duration`: Processing length in seconds (default: 10, max: 10)
- `creativity_coef`: Sound variety (1-10, default: 5)
- `num_samples`: Number of variations (default: 1)
- `api_key`: Mirelo API key (or set `MIRELO_API_KEY` env var)

## Usage

### Parallel Processing with Multiple Images

```bash
# Basic usage with multiple images
python example_usage.py image1.png image2.png image3.png

# Advanced options
python example_usage.py *.png --max-workers 4 --output-dir ./my_videos --skip-sound
```

**Parameters:**
- `images`: One or more PNG image paths (required)
- `--max-workers`: Number of parallel workers (default: 3)
- `--output-dir`: Output directory (default: ./output)
- `--prompts`: Custom prompts for each image (optional, one per image)
- `--skip-sound`: Skip sound generation, only create videos

**Custom Prompts:**
You can provide custom prompts for each image that will be combined with the system prompt:

```bash
# Different prompts for each image
python example_usage.py image1.png image2.png --prompts "sunset over mountains" "ocean waves at dawn"

# Some images with custom prompts, others use default
python example_usage.py image1.png image2.png image3.png --prompts "sunset" "ocean"
```

### Individual Module Usage

**Image to Video:**
```python
from videogeneration.image_to_video import generate_video_from_image

result = generate_video_from_image("photo.jpg", "output/video.mp4")
```

**Sound Generation:**
```python
from soundgeneration.soundgeneration import generate_sound_for_video

result_paths = generate_sound_for_video(
    video_source="video.mp4", 
    output_dir="./output",
    output_prefix="my_custom_video"  # Custom filename prefix
)
```

## Setup

1. Install dependencies:
```bash
pip install requests python-dotenv
```

2. Create `.env` file in project root:
```
RUNWARE_API_KEY=your_runware_key_here
MIRELO_API_KEY=your_mirelo_key_here
```

3. Import and use the modules in your Python code as shown above.

## Pipeline Example

See `example_usage.py` for a complete pipeline that:
1. Generates videos from multiple images with parallel processing
2. Adds sound effects to each video (no re-download)
3. Saves all files with numbered names

```bash
# Process multiple images in parallel
python example_usage.py image1.png image2.png image3.png

# Use wildcards and limit workers
python example_usage.py *.png --max-workers 4

# Skip sound generation
python example_usage.py image1.png --skip-sound

# Custom prompts for each image
python example_usage.py image1.png image2.png --prompts "sunset scene" "ocean waves"
```

**Output files will be numbered:**
- `video_01.mp4`, `video_02.mp4`, etc. (generated videos)
- `sound_video_01_1.mp4`, `sound_video_02_1.mp4`, etc. (videos with sound)