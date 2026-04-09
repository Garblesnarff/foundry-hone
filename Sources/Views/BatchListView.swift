// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI

// MARK: - BatchListView

struct BatchListView: View {
    let documents: [ImageDocument]
    @Binding var selectedDocument: ImageDocument?
    let onAdd: () -> Void
    let onRemove: (ImageDocument) -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header row
            HStack {
                Text("Queue")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                Spacer()
                Button(action: onAdd) {
                    Image(systemName: "plus")
                        .font(.caption)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            Divider()

            // Document list
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 2) {
                    ForEach(documents) { doc in
                        BatchRowView(
                            document: doc,
                            isSelected: selectedDocument?.id == doc.id,
                            onSelect: { selectedDocument = doc },
                            onRemove: { onRemove(doc) }
                        )
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
}

// MARK: - BatchRowView

struct BatchRowView: View {
    @ObservedObject var document: ImageDocument
    let isSelected: Bool
    let onSelect: () -> Void
    let onRemove: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 10) {
            // Thumbnail
            Image(nsImage: document.originalImage)
                .resizable()
                .scaledToFill()
                .frame(width: 40, height: 40)
                .clipped()
                .cornerRadius(5)
                .overlay(
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )

            // Name + status
            VStack(alignment: .leading, spacing: 3) {
                Text(document.fileName)
                    .font(.caption)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .foregroundStyle(isSelected ? .primary : .secondary)

                statusBadge
            }

            Spacer()

            // Remove button
            if isHovered {
                Button(action: onRemove) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .transition(.opacity)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isSelected
                    ? Color.orange.opacity(0.18)
                    : (isHovered ? Color.white.opacity(0.05) : Color.clear))
        )
        .padding(.horizontal, 4)
        .contentShape(Rectangle())
        .onTapGesture(perform: onSelect)
        .onHover { isHovered = $0 }
        .animation(.easeInOut(duration: 0.12), value: isHovered)
    }

    @ViewBuilder
    private var statusBadge: some View {
        switch document.status {
        case .idle:
            Text("Ready")
                .font(.system(size: 9))
                .foregroundStyle(.secondary)

        case .processing(_, let progress):
            ProgressView(value: progress)
                .progressViewStyle(.linear)
                .frame(width: 80)
                .tint(.orange)

        case .complete:
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(.green)
                Text("Honed")
                    .font(.system(size: 9))
                    .foregroundStyle(.green)
            }

        case .failed:
            HStack(spacing: 4) {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(.red)
                Text("Failed")
                    .font(.system(size: 9))
                    .foregroundStyle(.red)
            }
        }
    }
}
