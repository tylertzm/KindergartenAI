#!/usr/bin/env python3
"""
Video Input Script

This script downloads a video from a URL and uses it as input for video processing.
It loads the Mirelo API key from the .env file.

Usage:
    python video_input.py
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def download_video(url: str, output_path: str = "input_video.mp4") -> str:
    """
    Download a video from a URL and save it locally.
    
    Args:
        url: URL of the video to download
        output_path: Path where to save the downloaded video
        
    Returns:
        Path to the downloaded video file
    """
    print(f"📥 Downloading video from: {url}")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Get total file size if available
        total_size = int(response.headers.get('content-length', 0))
        
        with open(output_path, 'wb') as f:
            if total_size == 0:
                f.write(response.content)
            else:
                downloaded = 0
                chunk_size = 8192
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        # Show progress
                        percent = (downloaded / total_size) * 100
                        print(f"\r   Progress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end='')
        
        print(f"\n✅ Video downloaded successfully to: {output_path}")
        return output_path
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to download video: {str(e)}")


def main():
    """Main function to download and process the video."""
    # Video URL to download
    video_url = "https://vm.runware.ai/video/ws/5/vi/08255342-448e-48a9-a502-ac2ac1f907d6.mp4"
    
    # Get Mirelo API key from environment
    mirelo_api_key = os.getenv("MIRELO_API_KEY")
    if not mirelo_api_key:
        print("❌ Error: MIRELO_API_KEY not found in .env file")
        sys.exit(1)
    
    print("🚀 Starting video download and processing")
    print(f"🔑 Using Mirelo API key: {mirelo_api_key[:8]}...")
    
    try:
        # Download the video
        video_path = download_video(video_url)
        
        print(f"\n🎬 Video ready for processing!")
        print(f"   Video path: {video_path}")
        print(f"   File size: {os.path.getsize(video_path)} bytes")
        
        # TODO: Add your video processing logic here
        # You can use the mirelo_api_key and video_path for further processing
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
