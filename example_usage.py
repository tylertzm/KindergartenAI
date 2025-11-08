#!/usr/bin/env python3
"""
Parallel Video Generation Pipeline

This script demonstrates how to use the image-to-video and sound generation modules
with parallel processing for multiple images.
"""

import sys
import os
import argparse
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests

# Add the module directories to Python path
sys.path.append(str(Path(__file__).parent / "videogeneration"))
sys.path.append(str(Path(__file__).parent / "soundgeneration"))

from videogeneration import generate_video_from_image
from soundgeneration import generate_sound_for_video


def generate_video_for_image(image_path: str, index: int, output_dir: str, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
    """Generate video for a single image with numbered output."""
    try:
        output_filename = f"video_{index+1:02d}.mp4"
        output_path = os.path.join(output_dir, output_filename)

        print(f"🎬 Generating video {index + 1} from: {os.path.basename(image_path)}")
        
        # Combine system prompt with custom prompt if provided
        system_prompt = "smooth animation, natural movement, facial reactions and actions only, NO Lip movement, high quality"
        if custom_prompt:
            positive_prompt = f"{system_prompt}, {custom_prompt}"
            print(f"   📝 Using custom prompt: {custom_prompt}")
        else:
            positive_prompt = system_prompt

        result = generate_video_from_image(
            image_path=image_path,
            output_path=output_path,
            positive_prompt=positive_prompt,
            duration=5
        )

        print(f"✅ Video {index + 1} completed: {os.path.basename(output_path)}")
        return {
            'index': index,
            'image_path': image_path,
            'video_path': output_path,
            'video_url': result['videoURL'],
            'success': True
        }

    except Exception as e:
        print(f"❌ Video {index + 1} failed: {os.path.basename(image_path)} - {e}")
        return {
            'index': index,
            'image_path': image_path,
            'success': False,
            'error': str(e)
        }


def generate_sound_for_video_result(video_result: Dict[str, Any], output_dir: str) -> Dict[str, Any]:
    """Generate sound for a single video with numbered output."""
    try:
        index = video_result['index']
        
        print(f"🎵 Adding sound to video {index + 1}: {os.path.basename(video_result['video_path'])}")
        
        sound_video_paths = generate_sound_for_video(
            video_source=video_result['video_path'],  # Use local file (no re-download)
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
            'video_path': video_result['video_path'],
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


def main():
    """Main execution with parallel processing."""
    parser = argparse.ArgumentParser(
        description="Generate videos from multiple images with parallel processing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python example_usage.py image1.png image2.png image3.png
    python example_usage.py *.png --max-workers 4
    python example_usage.py image1.png --skip-sound
    python example_usage.py image1.png image2.png --prompts "sunset scene" "ocean waves"
    python example_usage.py image1.png image2.png image3.png --prompts "sunset" "ocean" "mountains"
        """
    )

    parser.add_argument("images", nargs="+", help="Paths to input PNG images")
    parser.add_argument("--output-dir", "-o", default="./output",
                       help="Output directory for generated videos (default: ./output)")
    parser.add_argument("--max-workers", "-w", type=int, default=3,
                       help="Maximum number of parallel workers (default: 3)")
    parser.add_argument("--skip-sound", action="store_true",
                       help="Skip sound generation, only generate videos")
    parser.add_argument("--prompts", nargs="*", default=[],
                       help="Custom prompts for each image (optional, one per image)")

    args = parser.parse_args()

    print("🎬 Parallel Video Generation Pipeline")
    print("=" * 50)
    print(f"📁 Output directory: {args.output_dir}")
    print(f"⚡ Max parallel workers: {args.max_workers}")
    print(f"🎵 Sound generation: {'Disabled' if args.skip_sound else 'Enabled'}")
    print()

    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)

    # Validate input images
    valid_images = []
    for img_path in args.images:
        if os.path.exists(img_path):
            if img_path.lower().endswith('.png'):
                valid_images.append(img_path)
            else:
                print(f"⚠️  Skipping non-PNG file: {img_path}")
        else:
            print(f"❌ Image not found: {img_path}")

    if not valid_images:
        print("❌ No valid PNG images found!")
        return

    print(f"🖼️  Processing {len(valid_images)} image(s)")
    if args.prompts:
        print(f"📝 Custom prompts: {len(args.prompts)} provided")
    print(f"✅ Found {len(valid_images)} valid PNG image(s)")
    print()

    # Create prompt list matching number of images
    image_prompts = args.prompts + [None] * (len(valid_images) - len(args.prompts))
    image_prompts = image_prompts[:len(valid_images)]  # Trim if too many prompts
    
    # Phase 1: Parallel video generation
    print("🎬 Phase 1: Generating videos from images...")
    print("-" * 50)

    video_results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        # Submit all video generation tasks
        future_to_index = {
            executor.submit(generate_video_for_image, img_path, i, args.output_dir, image_prompts[i]): i
            for i, img_path in enumerate(valid_images)
        }

        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_index):
            result = future.result()
            video_results.append(result)

    # Sort results by index
    video_results.sort(key=lambda x: x['index'])

    # Filter successful results
    successful_videos = [r for r in video_results if r['success']]
    failed_videos = [r for r in video_results if not r['success']]

    print(f"\n📊 Video Generation Results:")
    print(f"   ✅ Successful: {len(successful_videos)}")
    print(f"   ❌ Failed: {len(failed_videos)}")

    if failed_videos:
        print("   Failed images:")
        for failure in failed_videos:
            print(f"     - {os.path.basename(failure['image_path'])}: {failure['error']}")

    print()

    if not successful_videos:
        print("❌ No videos were generated successfully!")
        return

    # Phase 2: Parallel sound generation (if not skipped)
    if not args.skip_sound:
        print("🎵 Phase 2: Adding sound effects...")
        print("-" * 50)

        sound_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(args.max_workers, len(successful_videos))) as executor:
            # Submit all sound generation tasks
            future_to_video = {
                executor.submit(generate_sound_for_video_result, video_result, args.output_dir): video_result
                for video_result in successful_videos
            }

            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_video):
                result = future.result()
                sound_results.append(result)

        # Sort results by index
        sound_results.sort(key=lambda x: x['index'])

        # Filter successful results
        successful_sounds = [r for r in sound_results if r['success']]
        failed_sounds = [r for r in sound_results if not r['success']]

        print(f"\n📊 Sound Generation Results:")
        print(f"   ✅ Successful: {len(successful_sounds)}")
        print(f"   ❌ Failed: {len(failed_sounds)}")

        if failed_sounds:
            print("   Failed videos:")
            for failure in failed_sounds:
                print(f"     - {os.path.basename(failure['video_path'])}: {failure['error']}")

        print()

    # Final summary
    print("🎉 Pipeline completed!")
    print("=" * 50)
    print(f"📁 Output directory: {os.path.abspath(args.output_dir)}")
    print(f"📊 Summary:")
    print(f"   Images processed: {len(valid_images)}")
    print(f"   Videos generated: {len(successful_videos)}")

    if not args.skip_sound:
        successful_sounds = [r for r in sound_results if r['success']] if 'sound_results' in locals() else []
        print(f"   Sound videos created: {len(successful_sounds)}")

    # List generated files
    print(f"\n📋 Generated files:")
    try:
        files = sorted(os.listdir(args.output_dir))
        video_files = [f for f in files if f.endswith('.mp4')]
        for file in video_files:
            print(f"   📁 {file}")
    except Exception as e:
        print(f"   ⚠️  Could not list files: {e}")

    print(f"\n� Check the output directory for all results!")


if __name__ == "__main__":
    main()