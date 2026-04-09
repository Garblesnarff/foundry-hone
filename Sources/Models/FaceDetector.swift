// Copyright © 2026 Hanson Foundry. All rights reserved.

import CoreImage
import Vision

// MARK: - Detected Face

struct DetectedFace {
    /// Normalized bounding box in [0,1] coordinate space (origin bottom-left).
    let boundingBox: CGRect
    /// Confidence score from Vision framework.
    let confidence: Float
}

// MARK: - FaceDetector

final class FaceDetector {

    /// Detects faces in the given CIImage.
    /// - Returns: Array of DetectedFace values (may be empty).
    func detectFaces(in image: CIImage) async throws -> [DetectedFace] {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNDetectFaceRectanglesRequest { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let faces: [DetectedFace] = (request.results as? [VNFaceObservation] ?? [])
                    .map { obs in
                        DetectedFace(
                            boundingBox: obs.boundingBox,
                            confidence: obs.confidence
                        )
                    }
                    .filter { $0.confidence > 0.5 }

                continuation.resume(returning: faces)
            }

            let handler = VNImageRequestHandler(ciImage: image, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    /// Converts a normalized Vision bounding box to pixel coordinates for a given image size.
    /// Vision boxes have origin at bottom-left; CIImage origin is also bottom-left.
    static func pixelRect(for normalizedRect: CGRect, in imageExtent: CGRect) -> CGRect {
        CGRect(
            x: normalizedRect.minX * imageExtent.width + imageExtent.minX,
            y: normalizedRect.minY * imageExtent.height + imageExtent.minY,
            width: normalizedRect.width * imageExtent.width,
            height: normalizedRect.height * imageExtent.height
        )
    }
}
