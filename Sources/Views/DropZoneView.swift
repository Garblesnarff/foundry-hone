// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI
import UniformTypeIdentifiers

// MARK: - DropZoneView

struct DropZoneView: View {
    let onDrop: ([URL]) -> Void

    @State private var isTargeted = false

    private let acceptedTypes: [UTType] = [.jpeg, .png, .webP, .tiff, .heic, .image]

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(
                    isTargeted ? Color.orange : Color.secondary.opacity(0.35),
                    style: StrokeStyle(lineWidth: 2, dash: [8, 5])
                )
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isTargeted
                            ? Color.orange.opacity(0.08)
                            : Color(nsColor: .controlBackgroundColor).opacity(0.4))
                )
                .animation(.easeInOut(duration: 0.18), value: isTargeted)

            VStack(spacing: 14) {
                Image(systemName: isTargeted ? "photo.badge.plus.fill" : "photo.on.rectangle.angled")
                    .font(.system(size: 44))
                    .foregroundStyle(isTargeted ? .orange : .secondary)
                    .animation(.easeInOut(duration: 0.15), value: isTargeted)

                Text("Drop images here")
                    .font(.title3)
                    .foregroundStyle(.primary)

                Text("JPEG · PNG · WebP · TIFF · HEIC")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Button("Choose Files…") {
                    openFilePicker()
                }
                .buttonStyle(.bordered)
                .padding(.top, 4)
            }
            .padding(24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onDrop(of: acceptedTypes, isTargeted: $isTargeted) { providers in
            handleDrop(providers: providers)
        }
    }

    // MARK: - Drop Handling

    private func handleDrop(providers: [NSItemProvider]) -> Bool {
        let fileURLTypeID = UTType.fileURL.identifier
        var remaining = providers.filter {
            $0.hasItemConformingToTypeIdentifier(fileURLTypeID)
        }.count
        guard remaining > 0 else { return false }

        var collectedURLs: [URL] = []

        for provider in providers {
            guard provider.hasItemConformingToTypeIdentifier(fileURLTypeID) else { continue }

            // NSItemProvider callbacks are delivered on an arbitrary queue;
            // we collect results and dispatch back to main.
            provider.loadItem(forTypeIdentifier: fileURLTypeID, options: nil) { item, _ in
                var resolved: URL?
                if let data = item as? Data {
                    resolved = URL(dataRepresentation: data, relativeTo: nil)
                } else if let url = item as? URL {
                    resolved = url
                }

                DispatchQueue.main.async {
                    if let url = resolved {
                        collectedURLs.append(url)
                    }
                    remaining -= 1
                    if remaining == 0, !collectedURLs.isEmpty {
                        onDrop(collectedURLs)
                    }
                }
            }
        }
        return true
    }

    // MARK: - File Picker

    private func openFilePicker() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = true
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.jpeg, .png, .webP, .tiff, .heic]
        panel.message = "Select images to hone"

        if panel.runModal() == .OK {
            onDrop(panel.urls)
        }
    }
}
