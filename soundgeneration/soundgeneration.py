#!/usr/bin/env python3
"""
Sound Generation Module for Videos

This module provides functionality to add sound effects to videos using the Mirelo API.
It can process videos from URLs and generate synchronized audio tracks.
"""

import os
import sys
import requests
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from video_input import download_video

# Load environment variables from .env
load_dotenv()


def generate_sound_for_video(
    video_source: str,
    output_dir: Optional[str] = None,
    output_prefix: Optional[str] = None,
    api_key: Optional[str] = None,
    duration: int = 10,
    num_samples: int = 1,
    model_version: str = "1.5",
    creativity_coef: int = 5,
    text_prompt: str = "cinematic sound effects, ambient sounds, facial reactions, actions",
    negative_prompt: str = "speech, talking, dialogue, vocals, words",
    steps: int = 25
) -> List[str]:
    """
    Generate sound effects for a video from URL or local file using Mirelo API.
    
    Args:
        video_source: URL of the video to process OR path to local video file
        output_dir: Directory to save output videos (optional, defaults to "./output")
        output_prefix: Prefix for output filenames (optional, defaults to "result_video")
        api_key: Mirelo API key (if not provided, uses MIRELO_API_KEY env var)
        duration: Duration to process in seconds (max 10)
        num_samples: Number of audio tracks to generate
        model_version: Model version to use
        creativity_coef: Creativity level (1-10)
        text_prompt: Text guidance for sound generation
        negative_prompt: What to avoid in sound generation
        steps: Generation quality (higher = better quality, slower)
        
    Returns:
        List of paths to generated video files with sound
        
    Raises:
        ValueError: If API key is missing
        Exception: If processing fails
    """
    # Get API key from parameter or environment
    api_key = api_key or os.getenv("MIRELO_API_KEY")
    if not api_key:
        raise ValueError("API key required. Set MIRELO_API_KEY environment variable or pass api_key parameter")
    
    # Set up output directory
    if output_dir:
        output_path = Path(output_dir)
    else:
        output_path = Path("./output")  # Default to ./output instead of temp dir
    
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Determine if video_source is a URL or local file
    if video_source.startswith(('http://', 'https://')):
        # It's a URL - download it
        input_video_path = output_path / "input_video.mp4"
        print(f"📥 Downloading video from: {video_source}")
        download_video(video_source, str(input_video_path))
        should_cleanup_input = False  # Don't cleanup downloaded files in output dir
    else:
        # It's a local file path
        input_video_path = Path(video_source)
        if not input_video_path.exists():
            raise FileNotFoundError(f"Local video file not found: {video_source}")
        print(f"📁 Using local video file: {video_source}")
        should_cleanup_input = False  # Don't cleanup local files
    
    try:
        # Upload video and get asset ID
        customer_asset_id = _upload_video(str(input_video_path), api_key)
        
        # Generate SFX
        output_urls = _generate_sfx(
            customer_asset_id, api_key, duration, num_samples, model_version,
            creativity_coef, text_prompt, negative_prompt, steps
        )
        
        if not output_urls:
            raise Exception("No output URLs generated")
        
        # Download results
        local_paths = _download_results(output_urls, output_path, output_prefix or "result_video")
        
        print(f"✅ Sound generation completed! Files saved to: {output_path}")
        return local_paths
        
    except Exception as e:
        raise Exception(f"Sound generation failed: {str(e)}")


def _upload_video(video_path: str, api_key: str) -> str:
    """Upload video and get customer_asset_id"""
    
    print("📤 Uploading video...")
    
    if not Path(video_path).exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    BASE_URL = "https://api.mirelo.ai"
    
    # Step 1: Create customer asset
    print("   Creating upload URL...")
    create_response = requests.post(
        f"{BASE_URL}/create-customer-asset",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json"
        },
        json={"contentType": "video/mp4"}
    )
    
    if create_response.status_code != 200:
        raise Exception(f"Failed to create asset: {create_response.json()}")
    
    create_data = create_response.json()
    customer_asset_id = create_data["customer_asset_id"]
    upload_url = create_data["upload_url"]
    
    print(f"   ✅ Customer Asset ID: {customer_asset_id}")
    
    # Step 2: Upload video file
    print(f"   Uploading {video_path}...")
    with open(video_path, "rb") as video_file:
        upload_response = requests.put(
            upload_url,
            data=video_file,
            headers={"Content-Type": "video/mp4"}
        )
    
    if upload_response.status_code not in [200, 204]:
        raise Exception(f"Failed to upload video: {upload_response.status_code}")
    
    print("   ✅ Video uploaded successfully")
    
    return customer_asset_id


def _generate_sfx(
    customer_asset_id: str, api_key: str, duration: int, num_samples: int,
    model_version: str, creativity_coef: int, text_prompt: str,
    negative_prompt: str, steps: int
) -> List[str]:
    """Generate SFX for the uploaded video"""
    
    print("🎵 Generating sound effects...")
    
    BASE_URL = "https://api.mirelo.ai"
    
    # Request parameters
    payload = {
        "customer_asset_id": customer_asset_id,
        "duration": duration,
        "num_samples": num_samples,
        "model_version": model_version,
        "creativity_coef": creativity_coef,
        "return_audio_only": False,
        "text_prompt": text_prompt,
        "negative_prompt": negative_prompt,
        "steps": steps,
    }
    
    print(f"⏱️  Duration: {payload['duration']} seconds")
    print(f"🎬 Return format: Video with audio")
    print(f"🎨 Creativity: {payload['creativity_coef']}/10")
    print(f"📝 Text guidance: {payload['text_prompt']}")
    print(f"🚫 Negative prompt: {payload['negative_prompt']}")
    
    # Make API request
    response = requests.post(
        f"{BASE_URL}/video-to-sfx",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    if response.status_code != 201:
        print(f"❌ Error: {response.status_code}")
        print(response.json())
        return []
    
    result = response.json()
    output_urls = result.get("output_paths", [])
    
    print(f"✅ Generated {len(output_urls)} output file(s)")
    
    return output_urls


def _download_results(output_urls: List[str], output_dir: Path, filename_prefix: str = "result_video") -> List[str]:
    """Download the generated video files"""
    
    print("📥 Downloading results...")
    
    local_paths = []
    for idx, video_url in enumerate(output_urls, 1):
        print(f"   Downloading result {idx}...")
        
        video_response = requests.get(video_url)
        if video_response.status_code == 200:
            output_path = output_dir / f"{filename_prefix}_{idx}.mp4"
            output_path.write_bytes(video_response.content)
            local_paths.append(str(output_path))
            print(f"   ✅ Saved to: {output_path}")
        else:
            print(f"   ❌ Failed to download: {video_response.status_code}")
    
    return local_paths


# Legacy functions for backward compatibility
def upload_video():
    """Legacy function - use generate_sound_for_video instead"""
    raise DeprecationWarning("This function is deprecated. Use generate_sound_for_video() instead.")


def generate_sfx(customer_asset_id):
    """Legacy function - use generate_sound_for_video instead"""
    raise DeprecationWarning("This function is deprecated. Use generate_sound_for_video() instead.")


def download_results(output_urls):
    """Legacy function - use generate_sound_for_video instead"""
    raise DeprecationWarning("This function is deprecated. Use generate_sound_for_video() instead.")


def main():
    """Main execution flow for command line usage"""
    
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate sound effects for a video using Mirelo API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python soundgeneration.py "https://example.com/video.mp4"
    python soundgeneration.py "https://example.com/video.mp4" --output-dir ./output
    python soundgeneration.py "https://example.com/video.mp4" --duration 8 --creativity 7
        """
    )
    
    parser.add_argument("video_source", help="URL of the video to process or path to local video file")
    parser.add_argument("--output-dir", "-o", help="Output directory for generated videos")
    parser.add_argument("--output-prefix", "-p", default="result_video", help="Prefix for output filenames (default: result_video)")
    parser.add_argument("--api-key", help="Mirelo API key (or set MIRELO_API_KEY environment variable)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration to process in seconds (default: 10)")
    parser.add_argument("--samples", "-n", type=int, default=1, help="Number of audio tracks to generate (default: 1)")
    parser.add_argument("--creativity", "-c", type=int, default=5, choices=range(1, 11), help="Creativity level 1-10 (default: 5)")
    parser.add_argument("--text-prompt", "-t", default="cinematic sound effects, ambient sounds, facial reactions, actions", 
                       help="Text guidance for sound generation")
    parser.add_argument("--negative-prompt", "-N", default="speech, talking, dialogue, vocals, words",
                       help="What to avoid in sound generation")
    parser.add_argument("--steps", "-s", type=int, default=25, help="Generation quality (default: 25)")
    
    args = parser.parse_args()
    
    # Get API key from argument or environment
    api_key = args.api_key or os.getenv("MIRELO_API_KEY")
    if not api_key:
        print("❌ Error: API key required. Set MIRELO_API_KEY environment variable or use --api-key")
        sys.exit(1)
    
    try:
        # Generate sound for video
        result_paths = generate_sound_for_video(
            video_source=args.video_source,
            output_dir=args.output_dir,
            output_prefix=args.output_prefix,
            api_key=api_key,
            duration=args.duration,
            num_samples=args.samples,
            creativity_coef=args.creativity,
            text_prompt=args.text_prompt,
            negative_prompt=args.negative_prompt,
            steps=args.steps
        )
        
        print("\n🎉 Sound Generation Results:")
        print(f"   Generated {len(result_paths)} video(s) with sound:")
        for path in result_paths:
            print(f"   📁 {path}")
        
    except KeyboardInterrupt:
        print("\n⛔ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
