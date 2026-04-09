// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI

// MARK: - ControlsPanel

struct ControlsPanel: View {
    @ObservedObject var document: ImageDocument
    @ObservedObject var engine: EnhanceEngine

    var body: some View {
        HStack(spacing: 16) {
            // File name
            Label(document.fileName, systemImage: "photo")
                .font(.subheadline)
                .foregroundStyle(.primary)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: 200)

            Divider().frame(height: 20)

            // Scale factor
            HStack(spacing: 6) {
                Text("Scale")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Picker("Scale", selection: $document.scaleFactor) {
                    ForEach(ScaleFactor.allCases) { factor in
                        Text(factor.label).tag(factor)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 100)
                .disabled(document.status.isProcessing)
            }

            Divider().frame(height: 20)

            // Sharpen intensity
            HStack(spacing: 6) {
                Text("Sharpen")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Slider(value: $engine.settings.sharpenIntensity, in: 0...2, step: 0.1)
                    .frame(width: 80)
                    .disabled(document.status.isProcessing)
                Text(String(format: "%.1f", engine.settings.sharpenIntensity))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: 24)
            }

            Divider().frame(height: 20)

            // Noise reduction
            HStack(spacing: 6) {
                Text("Denoise")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Slider(value: $engine.settings.noiseReductionLevel, in: 0...0.1, step: 0.005)
                    .frame(width: 80)
                    .disabled(document.status.isProcessing)
                Text(String(format: "%.3f", engine.settings.noiseReductionLevel))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: 36)
            }

            Spacer()

            // Face detection count badge
            if document.isComplete {
                faceCountBadge
            }

            // Status text
            statusText
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }

    // MARK: - Subviews

    private var faceCountBadge: some View {
        HStack(spacing: 5) {
            Image(systemName: "face.smiling")
                .font(.caption)
                .foregroundStyle(.orange)
            Text("\(document.detectedFaceCount) face\(document.detectedFaceCount == 1 ? "" : "s")")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.orange.opacity(0.12))
        .cornerRadius(6)
    }

    private var statusText: some View {
        Text(document.status.statusMessage)
            .font(.caption)
            .foregroundStyle(statusColor)
            .lineLimit(1)
            .animation(.easeInOut, value: document.status.statusMessage)
    }

    private var statusColor: Color {
        switch document.status {
        case .idle: return .secondary
        case .processing: return .orange
        case .complete: return .green
        case .failed: return .red
        }
    }
}
