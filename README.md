# Video Generation Modules

This project contains two modular components for video processing:

## 1. Image to Video Generation (`videogeneration/image_to_video.py`)

Converts static images into animated videos using the Runware API.

### Usage as Module

```python
from videogeneration.image_to_video import generate_video_from_image

# Generate video from image
result = generate_video_from_image(
    image_path="path/to/your/image.jpg",
    output_path="output/video.mp4",  # Optional: saves locally
    positive_prompt="smooth animation, natural movement",
    duration=5,  # seconds
    width=1248,
    height=704
)

print(f"Video URL: {result['videoURL']}")
if 'local_path' in result:
    print(f"Saved locally: {result['local_path']}")
```

### Command Line Usage

```bash
cd videogeneration
python image_to_video.py path/to/image.jpg --output output/video.mp4
```

### Parameters

- `image_path`: Path to input image (required)
- `output_path`: Local save path (optional)
- `positive_prompt`: Text to guide animation (default: no-speech prompt)
- `duration`: Video length in seconds (default: 5)
- `width/height`: Resolution (default: 1248x704)
- `fps`: Frames per second (default: 24)
- `model`: AI model to use (default: "bytedance:1@1")
- `api_key`: Runware API key (or set `RUNWARE_API_KEY` env var)

## 2. Sound Generation (`soundgeneration/soundgeneration.py`)

Adds cinematic sound effects to videos using the Mirelo API.

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