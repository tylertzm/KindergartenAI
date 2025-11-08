#!/usr/bin/env python3
"""
Image to Video Generator Script

This script takes an image path and generates a video using the Runware API.
It uses the image-to-video functionality to create a video with the input image
as a frame constraint.

Usage:
    python image_to_video.py <image_path> [options]

Requirements:
    - requests library: pip install requests
    - Valid Runware API credentials
"""

import argparse
import base64
import json
import os
import sys
import time
import uuid
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class ImageToVideoGenerator:
    """Handles image-to-video generation using Runware API."""
    
    def __init__(self, api_key: str, base_url: str = "https://api.runware.ai/v1"):
        """
        Initialize the generator with API credentials.
        
        Args:
            api_key: Runware API key
            base_url: Base URL for the Runware API
        """
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def encode_image_to_base64(self, image_path: str) -> str:
        """
        Encode an image file to base64 string.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded image string with data URI prefix
            
        Raises:
            Exception: If encoding fails
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Determine MIME type based on file extension
        ext = os.path.splitext(image_path)[1].lower()
        mime_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg', 
            '.png': 'image/png',
            '.webp': 'image/webp'
        }
        
        mime_type = mime_type_map.get(ext, 'image/jpeg')
        
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
                base64_encoded = base64.b64encode(image_data).decode('utf-8')
                return f"data:{mime_type};base64,{base64_encoded}"
        except Exception as e:
            raise Exception(f"Failed to encode image: {str(e)}")
    
    def generate_video(
        self,
        image_path: str,
        positive_prompt: str = "",
        duration: int = 5,
        width: int = 1248,
        height: int = 704,
        fps: int = 24,
        model: str = "bytedance:1@1",
        output_format: str = "mp4",
        output_quality: int = 95,
        frame_position: str = "first"
    ) -> Dict[str, Any]:
        """
        Generate a video from an image using Runware API.
        
        Args:
            image_path: Path to the input image file
            positive_prompt: Text prompt to guide video generation
            duration: Video duration in seconds
            width: Video width in pixels
            height: Video height in pixels
            fps: Frames per second
            model: Model to use for generation
            output_format: Output video format (mp4 or webm)
            output_quality: Output quality (20-99)
            frame_position: Position of the input image ("first", "last", or frame number)
            
        Returns:
            Dictionary containing the generation request response
        """
        # Encode image to base64
        print(f"📤 Encoding image: {image_path}")
        image_data = self.encode_image_to_base64(image_path)
        print("✓ Image encoded successfully")
        
        task_uuid = str(uuid.uuid4())
        
        request_data = {
            "taskType": "videoInference",
            "taskUUID": task_uuid,
            "deliveryMethod": "async",
            "model": model,
            "duration": duration,
            "width": width,
            "height": height,
            "fps": fps,
            "outputType": "URL",
            "outputFormat": output_format,
            "outputQuality": output_quality,
            "numberResults": 1,
            "includeCost": True,
            "frameImages": [
                {
                    "inputImage": image_data,
                    "frame": frame_position
                }
            ]
        }
        
        # Add positive prompt if provided
        if positive_prompt:
            request_data["positivePrompt"] = positive_prompt
        
        print(f"🎬 Starting video generation with task UUID: {task_uuid}")
        print(f"   Duration: {duration}s, Resolution: {width}x{height}, FPS: {fps}")
        print(f"   Model: {model}")
        if positive_prompt:
            print(f"   Prompt: {positive_prompt}")
        
        response = requests.post(
            f"{self.base_url}/",
            headers=self.headers,
            json=[request_data]
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to start video generation: {response.text}")
        
        result = response.json()
        if "errors" in result and result["errors"]:
            raise Exception(f"Video generation error: {result['errors'][0]['message']}")
        
        return {"taskUUID": task_uuid, "response": result}
    
    def poll_result(self, task_uuid: str, timeout: int = 300) -> Dict[str, Any]:
        """
        Poll for video generation results.
        
        Args:
            task_uuid: UUID of the generation task
            timeout: Maximum time to wait in seconds
            
        Returns:
            Dictionary containing the final result
        """
        print("⏳ Polling for results...")
        print("💡 Video generation typically takes 2-5 minutes for high-quality results")
        print("   You can press Ctrl+C to cancel if needed")
        start_time = time.time()
        poll_count = 0
        
        while time.time() - start_time < timeout:
            poll_count += 1
            elapsed = int(time.time() - start_time)
            
            poll_request = {
                "taskType": "getResponse",
                "taskUUID": task_uuid
            }
            
            response = requests.post(
                f"{self.base_url}/",
                headers=self.headers,
                json=[poll_request]
            )
            
            if response.status_code != 200:
                print(f"⚠️  Polling error: {response.text}")
                time.sleep(5)
                continue
            
            result = response.json()
            
            # Check if we have data (completed)
            if "data" in result and result["data"]:
                data = result["data"][0]
                if data.get("status") == "success":
                    print("✅ Video generation completed!")
                    return data
                elif data.get("status") == "error":
                    raise Exception(f"Generation failed: {data.get('message', 'Unknown error')}")
            
            # Check for errors
            if "errors" in result and result["errors"]:
                error = result["errors"][0]
                if error.get("code") == "taskNotFound":
                    print(f"⏳ Task still processing... ({elapsed}s elapsed, poll #{poll_count})")
                else:
                    raise Exception(f"Polling error: {error['message']}")
            else:
                print(f"⏳ Still processing... ({elapsed}s elapsed, poll #{poll_count})")
            
            print("   💭 Tip: Video generation is compute-intensive and may take several minutes")
            time.sleep(10)
        
        raise Exception("Timeout waiting for video generation to complete")


def generate_video_from_image(
    image_path: str,
    output_path: Optional[str] = None,
    positive_prompt: str = "smooth animation, natural movement, facial reactions and actions only, NO Lip movement, high quality",
    duration: int = 5,
    width: int = 1248,
    height: int = 704,
    fps: int = 24,
    model: str = "bytedance:1@1",
    output_format: str = "mp4",
    output_quality: int = 95,
    frame_position: str = "first",
    api_key: Optional[str] = None,
    timeout: int = 300
) -> Dict[str, Any]:
    """
    Generate a video from an image using Runware API.
    
    Args:
        image_path: Path to the input image file
        output_path: Optional path to save the generated video
        positive_prompt: Text prompt to guide video generation
        duration: Video duration in seconds
        width: Video width in pixels
        height: Video height in pixels
        fps: Frames per second
        model: Model to use for generation
        output_format: Output video format (mp4 or webm)
        output_quality: Output quality (20-99)
        frame_position: Position of the input image ("first", "last", or frame number)
        api_key: Runware API key (if not provided, uses RUNWARE_API_KEY env var)
        timeout: Timeout for video generation in seconds
        
    Returns:
        Dictionary containing video information including URL and metadata
        
    Raises:
        Exception: If generation fails or API key is missing
    """
    # Get API key from parameter or environment
    api_key = api_key or os.getenv("RUNWARE_API_KEY")
    if not api_key:
        raise ValueError("API key required. Set RUNWARE_API_KEY environment variable or pass api_key parameter")
    
    try:
        # Initialize the generator
        generator = ImageToVideoGenerator(api_key)
        
        # Generate the video
        generation_result = generator.generate_video(
            image_path=image_path,
            positive_prompt=positive_prompt,
            duration=duration,
            width=width,
            height=height,
            fps=fps,
            model=model,
            output_format=output_format,
            output_quality=output_quality,
            frame_position=frame_position
        )
        
        # Poll for results
        result = generator.poll_result(generation_result["taskUUID"], timeout)
        
        # Download video if output path specified
        if output_path:
            print(f"📥 Downloading video to: {output_path}")
            video_response = requests.get(result['videoURL'])
            if video_response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(video_response.content)
                print("✅ Video downloaded successfully!")
                result['local_path'] = output_path
            else:
                print(f"⚠️  Failed to download video: {video_response.status_code}")
        
        return result
        
    except Exception as e:
        raise Exception(f"Video generation failed: {str(e)}")


def main():
    """Main function to handle command line arguments and orchestrate the process."""
    parser = argparse.ArgumentParser(
        description="Generate a video from an image using Runware API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python image_to_video.py photo.jpg
    python image_to_video.py photo.jpg --prompt "A beautiful sunset timelapse"
    python image_to_video.py photo.jpg --duration 10 --width 1280 --height 720
        """
    )
    
    parser.add_argument("image_path", nargs='?', default="./videogeneration/test.png", help="Path to the input image file (default: test.png)")
    parser.add_argument("--prompt", "-p", default="smooth animation, natural movement, facial reactions and actions only, NO Lip movement, high quality", 
                       help="Text prompt to guide video generation")
    parser.add_argument("--duration", "-d", type=int, default=5,
                       help="Video duration in seconds (default: 5)")
    parser.add_argument("--width", "-W", type=int, default=1248,
                       help="Video width in pixels (default: 1248)")
    parser.add_argument("--height", "-H", type=int, default=704,
                       help="Video height in pixels (default: 704)")
    parser.add_argument("--fps", type=int, default=24,
                       help="Frames per second (default: 24)")
    parser.add_argument("--model", "-m", default="bytedance:1@1",
                       help="Model to use for generation (default: bytedance:1@1)")
    parser.add_argument("--format", "-f", choices=["mp4", "webm"], default="mp4",
                       help="Output video format (default: mp4)")
    parser.add_argument("--quality", "-q", type=int, default=95, choices=range(20, 100),
                       help="Output quality 20-99 (default: 95)")
    parser.add_argument("--frame-position", choices=["first", "last"], default="first",
                       help="Position of input image in video (default: first)")
    parser.add_argument("--api-key", 
                       help="Runware API key (or set RUNWARE_API_KEY environment variable)")
    parser.add_argument("--timeout", type=int, default=300,
                       help="Timeout for video generation in seconds (default: 300)")
    parser.add_argument("--output", "-o",
                       help="Output filename (optional, will use video UUID if not specified)")
    
    args = parser.parse_args()
    
    # Get API key from argument or environment
    api_key = args.api_key or os.getenv("RUNWARE_API_KEY")
    if not api_key:
        print("❌ Error: API key required. Set RUNWARE_API_KEY environment variable or use --api-key")
        sys.exit(1)
    
    try:
        # Use the module function
        result = generate_video_from_image(
            image_path=args.image_path,
            output_path=args.output,
            positive_prompt=args.prompt,
            duration=args.duration,
            width=args.width,
            height=args.height,
            fps=args.fps,
            model=args.model,
            output_format=args.format,
            output_quality=args.quality,
            frame_position=args.frame_position,
            api_key=api_key,
            timeout=args.timeout
        )
        
        # Display results
        print("\n🎉 Video Generation Results:")
        print(f"   Video UUID: {result['videoUUID']}")
        print(f"   Video URL: {result['videoURL']}")
        print(f"   Cost: ${result.get('cost', 'N/A')}")
        print(f"   Seed: {result.get('seed', 'N/A')}")
        if 'local_path' in result:
            print(f"   Local file: {result['local_path']}")
        
        print(f"\n🔗 You can download the video from: {result['videoURL']}")
        
    except KeyboardInterrupt:
        print("\n⛔ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()