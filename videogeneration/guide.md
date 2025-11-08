Video inference API
Generate videos from text prompts, use images to guide video generation, or transform existing videos with Runware's video inference API. Complete reference for all video generation parameters.
Introduction
Video inference enables video generation and transformation. This page is the complete API reference for video inference tasks. All workflows and operations use the single videoInference task type, differentiated through parameter combinations.

Core operations
Text-to-video: Generate videos from text descriptions.
Image-to-video: Generate videos using images to guide content or constrain specific frames.
Video-to-video: Transform existing videos based on prompts.
Advanced features
Style and control: Camera movements with cinematic lens effects, keyframe positioning.
Content generation: Video extension capabilities, multi-shot storytelling with scene transitions.
Visual effects: Effect templates and stylized filters.
Identity and character: Character lip-sync, reference-based generation.
Audio: Native audio generation with synchronized dialogue and effects.
Each feature includes detailed parameter documentation below.

Video generation uses asynchronous processing due to longer processing times. Setting "deliveryMethod": "async" queues your task and returns an immediate acknowledgment. Use the getResponse task to poll for status updates and retrieve the final video when processing completes.

Request
Our API always accepts an array of objects as input, where each object represents a specific task to be performed. The structure varies depending on the workflow and features used.

The following examples demonstrate how different parameter combinations create specific workflows.

{
    "taskType": "videoInference",
    "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d59",
    "positivePrompt": "smooth animation, natural movement, cinematic quality",
    "model": "klingai:3@2",
    "duration": 10,
    "width": 1920,
    "height": 1080,
    "frameImages": [ 
      { 
        "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
        "frame": "first"
      },
      { 
        "inputImage": "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
        "frame": "last"
      } 
    ],
    "numberResults": 1
  }
taskType
string
required
The type of task to be performed. For this task, the value should be videoInference.

taskUUID
string
required
UUID v4
When a task is sent to the API you must include a random UUID v4 string using the taskUUID parameter. This string is used to match the async responses to their corresponding tasks.

If you send multiple tasks at the same time, the taskUUID will help you match the responses to the correct tasks.

The taskUUID must be unique for each task you send to the API.

outputType
"URL"
Default: URL
Specifies the output type in which the video is returned. Currently, only URL delivery is supported for video outputs.

URL: The video is returned as a URL string using the videoURL parameter in the response object.
outputFormat
"MP4" | "WEBM"
Default: MP4
Specifies the format of the output video. Supported formats are: MP4 and WEBM.

MP4: MPEG-4 video format, widely compatible and recommended for most use cases.
WEBM: WebM video format, optimized for web delivery and smaller file sizes.
outputQuality
integer
Min: 20
Max: 99
Default: 95
Sets the compression quality of the output video. Higher values preserve more quality but increase file size, lower values reduce file size but decrease quality.

webhookURL
string
Specifies a webhook URL where JSON responses will be sent via HTTP POST when generation tasks complete. For batch requests with multiple results, each completed item triggers a separate webhook call as it becomes available.

Webhooks can be secured using standard authentication methods supported by your endpoint, such as tokens in query parameters or API keys.

// Basic webhook endpoint
https://api.example.com/webhooks/runware
// With authentication token in query
https://api.example.com/webhooks/runware?token=your_auth_token
// With API key parameter
https://api.example.com/webhooks/runware?apiKey=sk_live_abc123
// With custom tracking parameters
https://api.example.com/webhooks/runware?projectId=proj_789&userId=12345
The webhook POST body contains the JSON response for the completed task according to your request configuration.

deliveryMethod
"sync" | "async"
required
Default: async
Determines how the API delivers task results. Choose between immediate synchronous delivery or polling-based asynchronous delivery depending on your task requirements.

Sync mode ("sync"):

Returns complete results directly in the API response when processing completes within the timeout window. For long-running tasks like video generation or model uploads, the request will timeout before completion, though the task continues processing in the background and results remain accessible through the dashboard.

Async mode ("async"):

Returns an immediate acknowledgment with the task UUID, requiring you to poll for results using getResponse once processing completes. This approach prevents timeout issues and allows your application to handle other operations while waiting.

Polling workflow (async):

Submit request with deliveryMethod: "async".
Receive immediate response with the task UUID.
Poll for completion using getResponse task.
Retrieve final results when status shows "success".
When to use each mode:

Sync: Fast image generation, simple processing tasks.
Async: Video generation, model uploads, or any task that usually takes more than 60 seconds.
Async mode is required for computationally intensive operations to avoid timeout errors.

uploadEndpoint
string
Specifies a URL where the generated content will be automatically uploaded using the HTTP PUT method. The raw binary data of the media file is sent directly as the request body. For secure uploads to cloud storage, use presigned URLs that include temporary authentication credentials.

Common use cases:

Cloud storage: Upload directly to S3 buckets, Google Cloud Storage, or Azure Blob Storage using presigned URLs.
CDN integration: Upload to content delivery networks for immediate distribution.
// S3 presigned URL for secure upload
https://your-bucket.s3.amazonaws.com/generated/content.mp4?X-Amz-Signature=abc123&X-Amz-Expires=3600
// Google Cloud Storage presigned URL
https://storage.googleapis.com/your-bucket/content.jpg?X-Goog-Signature=xyz789
// Custom storage endpoint
https://storage.example.com/uploads/generated-image.jpg
The content data will be sent as the request body to the specified URL when generation is complete.

safety
object
Configuration object for content safety checking to detect and filter inappropriate content in generated media.

safety
checkContent
checkContent
boolean
Default: false
Simple toggle for enabling content safety checking. When enabled, defaults to fast mode for optimal performance while maintaining content safety.

This provides an easy way to enable safety checking without needing to specify detailed mode configurations.

safety
mode
mode
"none" | "fast" | "full"
Default: none
Advanced control over safety checking intensity and coverage for content moderation.

Available values:

none: No content safety checking performed.
fast: Check first, middle, and last frames (video) or single check (images).
full: Check all frames in video content, adds slight processing delay.
When both checkContent and mode are specified, the mode parameter takes precedence over the checkContent setting.

ttl
integer
Min: 60
Specifies the time-to-live (TTL) in seconds for generated content when using URL output. This determines how long the generated content will be available at the provided URL before being automatically deleted.

This parameter only takes effect when outputType is set to "URL". It has no effect on other output types.

includeCost
boolean
Default: false
If set to true, the cost to perform the task will be included in the response object.

positivePrompt
string
required
Min: 2
The text description that guides the video generation process. This prompt defines what you want to see in the video, including subject matter, visual style, actions, and atmosphere.

The model processes this text to understand the desired content and creates a video that matches your description. More detailed and specific prompts typically produce better results.

For optimal results, describe the motion, scene composition, and visual characteristics you want to see in the generated video.

negativePrompt
string
Specifies what you want to avoid in the generated video. This parameter helps steer the generation away from undesired visual elements, styles, or characteristics.

Common negative prompts for video include terms like "blurry", "low quality", "distorted", "static", "flickering", or specific content you want to exclude.

frameImages
object[]
An array of objects that define key frames to guide video generation. Each object specifies an input image and optionally its position within the video timeline.

The frameImages parameter allows you to constrain specific frames within the video sequence, ensuring that particular visual content appears at designated points. This is different from referenceImages, which provide overall visual guidance without constraining specific timeline positions.

When the frame parameter is omitted from frameImages objects, automatic distribution rules apply:

1 image: Used as the first frame.
2 images: First and last frames.
3+ images: First and last frames, with intermediate images evenly spaced between.
frameImages[]
inputImages
inputImages
string
required
Specifies the input image that will be used to constrain the video content at the specified frame position. The image can be specified in one of the following formats:

An UUID v4 string of a previously uploaded image or a generated image.
A data URI string representing the image. The data URI must be in the format data:<mediaType>;base64, followed by the base64-encoded image. For example: data:image/png;base64,iVBORw0KGgo....
A base64 encoded image without the data URI prefix. For example: iVBORw0KGgo....
A URL pointing to the image. The image must be accessible publicly.
Supported formats are: PNG, JPG and WEBP.

frameImages[]
frame
frame
string | integer
Specifies the position of this frame constraint within the video timeline.

Named positions:

"first": Places the image at the beginning of the video.
"last": Places the image at the end of the video.
Numeric positions:

0: First frame (equivalent to "first").
Any positive integer: Specific frame number. Must be within the total frame count (duration × fps).
referenceImages
string[]
An array containing reference images used to condition the generation process. These images provide visual guidance to help the model generate content that aligns with the style, composition, or characteristics of the reference materials.

Unlike frameImages which constrain specific timeline positions, reference images guide the general appearance that should appear consistently across the video.

Reference images work in combination with your text prompt to provide both textual and visual guidance for the generation process.

Each image can be specified in one of the following formats:

An UUID v4 string of a previously uploaded image or a generated image.
A data URI string representing the image. The data URI must be in the format data:<mediaType>;base64, followed by the base64-encoded image. For example: data:image/png;base64,iVBORw0KGgo....
A base64 encoded image without the data URI prefix. For example: iVBORw0KGgo....
A URL pointing to the image. The image must be accessible publicly.
Supported formats are: PNG, JPG and WEBP.

referenceVideos
string[]
An array containing reference videos used to influence the generation process. These videos provide visual and motion guidance to help the model generate content that aligns with the style, movement patterns, or characteristics of the reference materials.

Unlike frameImages which define specific timeline positions, reference videos guide the general appearance and motion dynamics that should influence the output without rigidly constraining it.

Reference videos work in combination with your text prompt and other inputs to provide comprehensive guidance for the generation process.

Each video can be specified in one of the following formats:

An UUID v4 string of a previously uploaded video or a generated video.
A data URI string representing the video. The data URI must be in the format data:<mediaType>;base64, followed by the base64-encoded video. For example: data:video/mp4;base64,AAAAIGZ0eXB....
A base64 encoded video without the data URI prefix. For example: AAAAIGZ0eXB....
A URL pointing to the video. The video must be accessible publicly.
Supported formats are: MP4, MOV and WEBM.

inputAudios
string[]
An array containing audio files used to drive video generation for models that support audio input. These audio files provide temporal guidance to help the model generate content that synchronizes with the audio, such as lip-sync or audio-driven character animation.

Audio files work in combination with your text prompt and reference images to provide both auditory and visual guidance for the generation process.

Each audio can be specified in one of the following formats:

An UUID v4 string of a previously uploaded audio or a generated audio.
A data URI string representing the audio. The data URI must be in the format data:<mediaType>;base64, followed by the base64-encoded audio. For example: data:audio/wav;base64,UklGRnoG....
A base64 encoded audio without the data URI prefix. For example: UklGRnoG....
A URL pointing to the audio file. The audio must be accessible publicly.
Supported formats are: MP3, WAV and FLAC.

width
integer
Min: 256
Max: 1920
The width of the generated video in pixels. Must be a multiple of 8 for compatibility with video encoding standards.

Higher resolutions produce more detailed videos but require significantly more processing time and computational resources. Consider your intended use case and quality requirements when selecting dimensions.

Work within your model's supported resolution range for optimal results. Some models may have specific aspect ratio recommendations.

height
integer
Min: 256
Max: 1080
The height of the generated video in pixels. Must be a multiple of 8 for compatibility with video encoding standards.

Higher resolutions produce more detailed videos but require significantly more processing time and computational resources. Consider your intended use case and quality requirements when selecting dimensions.

Work within your model's supported resolution range for optimal results. Some models may have specific aspect ratio recommendations.

model
string
required
The AI model to use for video generation. Different models excel at different types of content, styles, and quality levels.

Models are identified by their AIR (Artificial Intelligence Resource) identifier in the format provider:id@version. Use the Model Search utility to discover available video models and their capabilities.

Choose models based on your desired output quality and supported features like resolution or duration limits.

duration
float
required
Min: 1
Max: 10
The length of the generated video in seconds. This parameter directly affects the total number of frames produced based on the specified frame rate.

Total frames are calculated as duration × fps. For example, a 5-second video at 24 fps will contain 120 frames.

Longer durations require significantly more processing time and computational resources. Consider your specific use case when choosing duration length.

fps
integer
Min: 15
Max: 60
Default: 24
The frame rate (frames per second) of the generated video. Higher frame rates create smoother motion but require more processing time and result in larger file sizes.

Common frame rates:

24 fps: Standard cinematic frame rate, natural motion feel.
30 fps: Common for web video, smooth motion.
60 fps: High frame rate, very smooth motion for action content.
Note that using the same duration with higher frame rates creates smoother motion by generating more intermediate frames. The frame rate combines with duration to determine total frame count: duration × fps = total frames.

steps
integer
Min: 10
Max: 50
The number of denoising steps the model performs during video generation. More steps typically result in higher quality output but require longer processing time.

Each step refines the entire sequence, improving temporal consistency and visual quality. Higher step counts are particularly important for achieving smooth motion and reducing visual artifacts.

Most video models work well with 20-40 steps. Values below 20 may produce lower quality results, while values above 40 provide diminishing returns for most use cases.

seed
integer
Min: 1
Max: 9223372036854776000
Default: Random
A seed is a value used to randomize the video generation. If you want to make videos reproducible (generate the same video multiple times), you can use the same seed value.

Note: Random seeds are generated as 32-bit values for platform compatibility, but you can specify any value if your platform supports it (JavaScript safely supports up to 53-bit integers).

CFGScale
float
Min: 0
Max: 50
Controls how closely the video generation follows your prompt. Higher values make the model adhere more strictly to your text description, while lower values allow more creative freedom. CFGScale affects both visual content and temporal consistency.

Recommended range is 6.0-10.0 for most video models. Values above 12 may cause over-guidance artifacts or unnatural motion patterns.

speech
object
Configuration object for text-to-speech generation. This parameter allows you to generate audio from text input.

"speech": {
  "voice": "Emily",
  "text": "Hello, this is a sample text for speech synthesis."
}
numberResults
integer
Min: 1
Max: 4
Default: 1
Specifies how many videos to generate for the given parameters. Each video will have the same parameters but different seeds, resulting in variations of the same concept.

acceleration
"none" | "low" | "medium" | "high"
Default: none
Applies optimized acceleration presets that automatically configure multiple generation parameters for the best speed and quality balance. This parameter serves as an abstraction layer that intelligently adjusts acceleratorOptions, steps, scheduler, and other underlying settings.

Available values:

none: No acceleration applied, uses default parameter values.
low: Minimal acceleration with optimized settings for lowest quality loss.
medium: Balanced acceleration preset with moderate speed improvements.
high: Maximum acceleration with caching and aggressive optimizations for fastest generation.
Acceleration presets serve as a base configuration that can be overridden. You can still manually specify scheduler, steps, acceleratorOptions, and other parameters to customize the preset's default values.

When overriding individual parameters on top of acceleration presets, results may be unexpected since the preset's optimized parameter combinations are designed to work together. Manual overrides may interfere with the preset's performance optimizations.

advancedFeatures
object
A container for specialized features that extend the functionality of the generation process. This object groups advanced capabilities that enhance specific aspects of the generation pipeline.

acceleratorOptions
object
Advanced caching mechanisms to significantly speed up generation by reducing redundant computation. This object allows you to enable and configure acceleration technologies for your specific model architecture.

These caching methods will not perform well with stochastic schedulers (those with SDE or Ancestral in the name). The random noise added by these schedulers prevents the cache from working effectively. For best results, use deterministic schedulers like Euler or DDIM.

lora
object[]
With LoRA (Low-Rank Adaptation), you can adapt a model to specific styles or features by emphasizing particular aspects of the data. This technique enhances the quality and relevance of generated content and can be especially useful when the output needs to adhere to a specific artistic style or follow particular guidelines.

Multiple LoRA models can be used simultaneously to achieve different adaptation goals.

The lora parameter is an array of objects. Each object contains properties that define the configuration for a specific LoRA model.

providerSettings
object
Contains provider-specific configuration settings that customize the behavior of different AI models and services. Each provider has its own set of parameters that control various aspects of the generation process.

The providerSettings parameter is an object that contains nested objects for each supported provider.

providerSettings
google
google
object
Configuration settings specific to Google's video generation models (Veo 2 and Veo 3). These settings control various aspects of the generation process including prompt enhancement and audio generation capabilities.

providerSettings
bytedance
bytedance
object
Configuration settings specific to ByteDance's video generation models. These settings control camera behavior and movement during video generation.

providerSettings
klingai
klingai
object
Configuration settings specific to KlingAI's video generation models.

providerSettings
minimax
minimax
object
Configuration settings specific to MiniMax's video generation models. These settings control prompt processing and optimization features.

providerSettings
pixverse
pixverse
object
Configuration object for PixVerse-specific features and effects. PixVerse offers unique capabilities like viral effects, camera movements, and artistic styles that enhance video generation.

The effect and cameraMovement parameters are mutually exclusive. You can use one or the other, but not both in the same request.

providerSettings
vidu
vidu
object
Configuration settings specific to Vidu's video generation models. These settings control movement dynamics, background music generation, and visual styles for video content.

Response
Video inference operations require polling to retrieve results due to asynchronous processing. You'll need to use the getResponse task to check status and retrieve the final video.

When you submit a video task, you receive immediate confirmation that your request was accepted and processing has started, or an error response if validation fails.

{
  "data": [
    {
      "taskType": "videoInference",
      "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d1"
    }
  ]
}
To retrieve the actual video results, use the getResponse task with the returned taskUUID. The response format depends on the current processing status:

{
  "data": [
    {
      "taskType": "videoInference",
      "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d1",
      "status": "processing",
    }
  ]
}
taskType
string
The API will return the taskType you sent in the request. In this case, it will be videoInference. This helps match the responses to the correct task type.

taskUUID
string
UUID v4
The API will return the taskUUID you sent in the request. This way you can match the responses to the correct request tasks.

videoUUID
string
UUID v4
A unique identifier for the generated video. This UUID can be used to reference the video in subsequent operations or for tracking purposes.

The videoUUID is different from the taskUUID. While taskUUID identifies the generation request, videoUUID identifies the specific video output.

videoURL
string
If outputType is set to URL, this parameter contains the URL of the video to be downloaded.

seed
integer
The seed value that was used to generate this video. This value can be used to reproduce the same video when using identical parameters in another request.

cost
float
if includeCost is set to true, the response will include a cost field for each task object. This field indicates the cost of the request in USD.