// Copyright © 2026 Hanson Foundry. All rights reserved.

import AppKit
import CoreImage

// MARK: - Scale Factor

enum ScaleFactor: Int, CaseIterable, Identifiable {
    case x2 = 2
    case x4 = 4

    var id: Int { rawValue }

    var label: String {
        switch self {
        case .x2: return "2x"
        case .x4: return "4x"
        }
    }
}

// MARK: - Processing Status

enum ProcessingStatus: Equatable {
    case idle
    case processing(phase: ForgePhase, progress: Double)
    case complete
    case failed(String)

    var isProcessing: Bool {
        if case .processing = self { return true }
        return false
    }

    var progressValue: Double {
        if case .processing(_, let p) = self { return p }
        if case .complete = self { return 1.0 }
        return 0
    }

    var statusMessage: String {
        switch self {
        case .idle:
            return "Ready to hone."
        case .processing(let phase, _):
            return phase.message
        case .complete:
            return "Honed to perfection."
        case .failed(let detail):
            return "The forge has cooled. \(detail)"
        }
    }
}

// MARK: - Forge Phase

enum ForgePhase: Equatable {
    case preparing
    case upscaling
    case detectingFaces
    case restoringFace(current: Int, total: Int)
    case finishing

    var message: String {
        switch self {
        case .preparing:
            return "Preparing the forge..."
        case .upscaling:
            return "Honing the blade..."
        case .detectingFaces:
            return "Scanning for faces..."
        case .restoringFace(let current, let total):
            return "Restoring faces (\(current) of \(total))..."
        case .finishing:
            return "Finishing the edges..."
        }
    }
}

// MARK: - ImageDocument

@MainActor
final class ImageDocument: ObservableObject, Identifiable {
    let id = UUID()
    let sourceURL: URL
    let originalImage: NSImage
    let originalCIImage: CIImage

    @Published var enhancedImage: NSImage?
    @Published var enhancedCIImage: CIImage?
    @Published var status: ProcessingStatus = .idle
    @Published var detectedFaceCount: Int = 0
    @Published var scaleFactor: ScaleFactor = .x2

    var fileName: String { sourceURL.lastPathComponent }
    var isComplete: Bool {
        if case .complete = status { return true }
        return false
    }

    init?(url: URL) {
        guard let image = NSImage(contentsOf: url) else { return nil }
        guard let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff),
              let ciImage = CIImage(bitmapImageRep: bitmap) else { return nil }

        self.sourceURL = url
        self.originalImage = image
        self.originalCIImage = ciImage
    }
}
