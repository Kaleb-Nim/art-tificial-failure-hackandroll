# Art-tificial failure Image Prediction API Documentation 


## Base URL
```
https://art-ificialfailure-backend.fly.dev
```

## Endpoints

### GET /health

Check the health of the API service.

#### Response body example

```json
{
    "status": "healthy",
    "environment": "development",
    "config_validated": true
}
```

### POST /api/v1/predict

Analyzes multiple images and returns predictions with confidence scores and explanations.

#### Request Specifications
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Max Batch Size**: 10 images
- **Max Image Size**: 4MB per image

#### Request Body Schema

```json
{
  "images": [
    {
      "image_id": "string",
      "base64_data": "string",
      "format": "string"
    }
  ],
  "model": "string",
  "top_k": "integer",
  "confidence_threshold": "float"
}
```

#### Request Fields

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| images | array | Yes | Array of images to analyze | Max 10 images |
| images[].image_id | string | Yes | Unique identifier for the image | - |
| images[].base64_data | string | Yes | Base64 encoded image data | Max 4MB |
| images[].format | string | Yes | Image format/mime type | Must match: image/(png\|jpeg\|jpg\|gif) |
| model | string | Yes | Model to use for prediction | Values: "gemni", "openai" |
| top_k | integer | No | Number of predictions per image | Default: 3, Range: 1-10 |
| confidence_threshold | float | No | Minimum confidence threshold | Default: 0.1, Range: 0.0-1.0 |

#### Example Request

```json
{
  "images": [
    {
      "image_id": "img_123",
      "base64_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "format": "image/jpeg"
    }
  ],
  "model": "openai",
  "top_k": 3,
  "confidence_threshold": 0.5
}
```

### Response

#### Success Response (200 OK)

```json
{
  "request_id": "string",
  "status": "success",
  "model": "string",
  "top_k": "integer",
  "results": [
    {
      "image_id": "string",
      "predictions": [
        {
          "label": "string",
          "confidence": "float",
          "reason": "string"
        }
      ],
      "processed_at": "datetime",
      "processing_time_ms": "float"
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| request_id | string | Unique identifier for the request |
| status | string | Status of the request ("success" or "error") |
| model | string | Model used for prediction |
| top_k | integer | Number of predictions returned per image |
| results | array | Array of prediction results per image |
| results[].image_id | string | ID of the processed image |
| results[].predictions | array | Array of predictions for the image |
| results[].predictions[].label | string | Single-word label/class |
| results[].predictions[].confidence | float | Confidence score (0-1) |
| results[].predictions[].reason | string | Explanation for the prediction |
| results[].processed_at | datetime | Timestamp of processing |
| results[].processing_time_ms | float | Processing time in milliseconds |

#### Example Response

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "model": "openai",
  "top_k": 3,
  "results": [
    {
      "image_id": "img_123",
      "predictions": [
        {
          "label": "cat",
          "confidence": 0.95,
          "reason": "Clear feline features including pointed ears and whiskers"
        },
        {
          "label": "pet",
          "confidence": 0.85,
          "reason": "Indoor setting and groomed appearance"
        }
      ],
      "processed_at": "2025-01-17T21:35:41.862Z",
      "processing_time_ms": 1234.56
    }
  ]
}
```

#### Error Response (400/500)

```json
{
  "request_id": "string",
  "status": "error",
  "error_message": "string"
}
```

### Common Errors

#### 400 Bad Request
- Invalid image format
- Image size exceeds 4MB
- Batch size exceeds 10 images
- Invalid base64 encoding
- Missing required fields

#### 500 Internal Server Error
- Model service unavailable
- Processing error

## Developer Guidelines

### 1. Base64 Image Data
- Images should be base64 encoded
- Remove data URL prefix before sending (optional)
- Supported formats: PNG, JPEG/JPG, GIF

### 2. Performance Considerations
- Processing time scales with number of images
- Consider implementing client-side batching for large sets
- Response time typically 2-5 seconds per batch

### 3. Rate Limiting
- Implement exponential backoff for retries
- Consider implementing client-side queuing

### 4. Testing
- Test endpoint is available at: /api/v1/predict
- Use test images under 1MB for faster development
- Include error scenarios in integration tests

### 5. Security
- All requests must include appropriate authentication headers
- Implement timeout handling
- Validate image content before processing