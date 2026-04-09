// Copyright © 2026 Hanson Foundry. All rights reserved.

import CoreImage
import CoreImage.CIFilterBuiltins
import Metal
import AppKit

// MARK: - Enhancement Settings

struct EnhancementSettings {
    var scaleFactor: ScaleFactor = .x2
    /// Sharpening radius applied to face regions (0.5 – 5.0).
    var sharpenRadius: Float = 1.5
    /// Sharpening intensity (0.0 – 2.0).
    var sharpenIntensity: Float = 0.8
    /// Noise reduction level applied to face regions (0.0 – 0.1).
    var noiseReductionLevel: Float = 0.02
    /// Noise reduction sharpness (0.0 – 2.0).
    var noiseSharpness: Float = 0.4
}

// MARK: - EnhanceEngine

@MainActor
final class EnhanceEngine: ObservableObject {

    private let context: CIContext
    private let faceDetector = FaceDetector()

    @Published var settings = EnhancementSettings()

    init() {
        // Use Metal if available, otherwise fall back to CPU.
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            context = CIContext(mtlDevice: metalDevice)
        } else {
            context = CIContext()
        }
    }

    // MARK: - Main Pipeline

    /// Processes an ImageDocument through the full enhancement pipeline.
    func process(_ document: ImageDocument) async {
        document.status = .processing(phase: .preparing, progress: 0.05)

        do {
            // Step 1: Upscale
            document.status = .processing(phase: .upscaling, progress: 0.10)
            let upscaled = try upscale(document.originalCIImage, factor: document.scaleFactor)
            document.status = .processing(phase: .upscaling, progress: 0.40)

            // Step 2: Face detection on upscaled image
            document.status = .processing(phase: .detectingFaces, progress: 0.45)
            let faces = try await faceDetector.detectFaces(in: upscaled)
            document.detectedFaceCount = faces.count
            document.status = .processing(phase: .detectingFaces, progress: 0.55)

            // Step 3: Enhance detected faces
            var result = upscaled
            if !faces.isEmpty {
                let progressPerFace = 0.35 / Double(faces.count)
                for (index, face) in faces.enumerated() {
                    let phase = ForgePhase.restoringFace(current: index + 1, total: faces.count)
                    let currentProgress = 0.55 + Double(index) * progressPerFace
                    document.status = .processing(phase: phase, progress: currentProgress)

                    result = enhanceFaceRegion(face, in: result)
                }
            }

            // Step 4: Finish
            document.status = .processing(phase: .finishing, progress: 0.92)
            let finalNSImage = renderToNSImage(result)

            document.enhancedCIImage = result
            document.enhancedImage = finalNSImage
            document.status = .complete

        } catch {
            document.status = .failed(error.localizedDescription)
        }
    }

    // MARK: - Upscaling

    private func upscale(_ image: CIImage, factor: ScaleFactor) throws -> CIImage {
        let scale = Float(factor.rawValue)

        guard let filter = CIFilter(name: "CILanczosScaleTransform") else {
            throw EnhanceError.filterUnavailable("CILanczosScaleTransform")
        }
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(scale, forKey: kCIInputScaleKey)
        filter.setValue(1.0, forKey: kCIInputAspectRatioKey)

        guard let output = filter.outputImage else {
            throw EnhanceError.filterFailed("CILanczosScaleTransform produced no output")
        }
        return output
    }

    // MARK: - Face Enhancement

    private func enhanceFaceRegion(_ face: DetectedFace, in image: CIImage) -> CIImage {
        let pixelRect = FaceDetector.pixelRect(
            for: face.boundingBox,
            in: image.extent
        )

        // Add padding around face region (20% on each side).
        let padding = min(pixelRect.width, pixelRect.height) * 0.20
        let paddedRect = pixelRect.insetBy(dx: -padding, dy: -padding)
            .intersection(image.extent)

        guard !paddedRect.isEmpty else { return image }

        // Crop the face region.
        let faceRegion = image.cropped(to: paddedRect)

        // Apply noise reduction first to smooth artifacts.
        let denoised = applyNoiseReduction(to: faceRegion)

        // Apply sharpening to recover detail.
        let sharpened = applySharpen(to: denoised)

        // Composite the enhanced face back over the full image.
        let translated = sharpened.transformed(
            by: CGAffineTransform(translationX: paddedRect.minX, y: paddedRect.minY)
                .concatenating(CGAffineTransform(translationX: -sharpened.extent.minX, y: -sharpened.extent.minY))
        )
        // Clamp enhanced region to its bounds then composite.
        let clamped = translated.cropped(to: paddedRect)

        return clamped.composited(over: image)
    }

    private func applyNoiseReduction(to image: CIImage) -> CIImage {
        guard let filter = CIFilter(name: "CINoiseReduction") else { return image }
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(settings.noiseReductionLevel, forKey: "inputNoiseLevel")
        filter.setValue(settings.noiseSharpness, forKey: "inputSharpness")
        return filter.outputImage ?? image
    }

    private func applySharpen(to image: CIImage) -> CIImage {
        guard let filter = CIFilter(name: "CISharpenLuminance") else { return image }
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(settings.sharpenRadius, forKey: kCIInputRadiusKey)
        filter.setValue(settings.sharpenIntensity, forKey: kCIInputSharpnessKey)
        return filter.outputImage ?? image
    }

    // MARK: - Rendering

    private func renderToNSImage(_ ciImage: CIImage) -> NSImage {
        let extent = ciImage.extent
        guard let cgImage = context.createCGImage(ciImage, from: extent) else {
            return NSImage()
        }
        return NSImage(cgImage: cgImage, size: extent.size)
    }

    // MARK: - Export

    /// Writes the enhanced image to disk at the specified URL.
    func export(_ document: ImageDocument, to url: URL, format: ExportFormat) throws {
        guard let ciImage = document.enhancedCIImage else {
            throw EnhanceError.noOutputImage
        }

        let extent = ciImage.extent
        guard let cgImage = context.createCGImage(ciImage, from: extent) else {
            throw EnhanceError.renderFailed
        }

        let nsImage = NSImage(cgImage: cgImage, size: extent.size)
        guard let tiff = nsImage.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff) else {
            throw EnhanceError.renderFailed
        }

        let data: Data?
        switch format {
        case .png:
            data = bitmap.representation(using: .png, properties: [:])
        case .jpeg:
            data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.92])
        }

        guard let exportData = data else {
            throw EnhanceError.encodingFailed
        }

        try exportData.write(to: url, options: .atomic)
    }
}

// MARK: - Export Format

enum ExportFormat: String, CaseIterable, Identifiable {
    case png = "PNG"
    case jpeg = "JPEG"

    var id: String { rawValue }
    var fileExtension: String {
        switch self {
        case .png: return "png"
        case .jpeg: return "jpg"
        }
    }
}

// MARK: - Errors

enum EnhanceError: LocalizedError {
    case filterUnavailable(String)
    case filterFailed(String)
    case noOutputImage
    case renderFailed
    case encodingFailed

    var errorDescription: String? {
        switch self {
        case .filterUnavailable(let name):
            return "Core Image filter unavailable: \(name)"
        case .filterFailed(let detail):
            return "Filter failed: \(detail)"
        case .noOutputImage:
            return "No enhanced image to export."
        case .renderFailed:
            return "Could not render image."
        case .encodingFailed:
            return "Could not encode image data."
        }
    }
}
