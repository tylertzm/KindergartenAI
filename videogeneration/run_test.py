#!/usr/bin/env python3
"""
Simple script to run image-to-video generation with test.webp
This script loads the API key from .env and generates a video from test.webp
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Check if test.png exists
    if not os.path.exists("test.png"):
        print("❌ Error: test.png not found in current directory")
        sys.exit(1)
    
    # Check if API key is loaded
    api_key = os.getenv("RUNWARE_API_KEY")
    if not api_key:
        print("❌ Error: RUNWARE_API_KEY not found in .env file")
        sys.exit(1)
    
    print("🚀 Running image-to-video generation with test.png")
    print(f"🔑 Using API key: {api_key[:8]}...")
    
    # Prepare the command with faster settings
    cmd = [
        sys.executable,  # Use the same Python interpreter
        "image_to_video.py",
        "test.png",
        "--prompt", "A beautiful animated scene with smooth motion and cinematic quality",
        "--duration", "3",  # Shorter duration for faster processing
        "--width", "1280",  # Lower resolution for faster processing
        "--height", "720",  # Lower resolution for faster processing
        "--format", "mp4",
        "--quality", "90"  # Slightly lower quality for faster processing
    ]
    
    print(f"📝 Command: {' '.join(cmd)}")
    print("⏳ Starting video generation...")
    
    try:
        # Run the command
        result = subprocess.run(cmd, check=True, text=True)
        print("✅ Video generation completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running image_to_video.py: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⛔ Process interrupted by user")
        sys.exit(1)

if __name__ == "__main__":
    main()