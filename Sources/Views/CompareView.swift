// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI
import AppKit

// MARK: - CompareView

/// A before/after split comparison view with a draggable divider.
struct CompareView: View {
    @ObservedObject var document: ImageDocument

    @State private var splitPosition: CGFloat = 0.5
    @State private var isDragging = false

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                // --- After (enhanced) image, full width ---
                if let enhanced = document.enhancedImage {
                    Image(nsImage: enhanced)
                        .resizable()
                        .scaledToFit()
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                }

                // --- Before (original) image, clipped to left side ---
                Image(nsImage: document.originalImage)
                    .resizable()
                    .scaledToFit()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .overlay(
                        Rectangle()
                            .fill(.clear)
                            .frame(width: geo.size.width * splitPosition)
                    )
                    .mask(
                        HStack(spacing: 0) {
                            Rectangle()
                                .frame(width: geo.size.width * splitPosition)
                            Spacer()
                        }
                    )

                // --- Divider ---
                Rectangle()
                    .fill(.white.opacity(0.85))
                    .frame(width: 2)
                    .frame(height: geo.size.height)
                    .offset(x: geo.size.width * splitPosition - 1)
                    .shadow(color: .black.opacity(0.4), radius: 3, x: 0, y: 0)

                // --- Handle ---
                dividerHandle(geo: geo)

                // --- Labels ---
                labels(geo: geo)
            }
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        isDragging = true
                        let clamped = value.location.x / geo.size.width
                        splitPosition = max(0.05, min(0.95, clamped))
                    }
                    .onEnded { _ in
                        isDragging = false
                    }
            )
            .cursor(.resizeLeftRight)
        }
        .clipped()
    }

    // MARK: - Subviews

    private func dividerHandle(geo: GeometryProxy) -> some View {
        let x = geo.size.width * splitPosition
        let y = geo.size.height / 2

        return ZStack {
            Circle()
                .fill(isDragging ? Color.orange : Color.white)
                .frame(width: 36, height: 36)
                .shadow(color: .black.opacity(0.3), radius: 4)

            HStack(spacing: 3) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 11, weight: .bold))
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(isDragging ? .white : .black.opacity(0.7))
        }
        .position(x: x, y: y)
        .animation(.easeInOut(duration: 0.1), value: isDragging)
    }

    private func labels(geo: GeometryProxy) -> some View {
        HStack {
            // "Before" label on left
            Text("BEFORE")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.black.opacity(0.55))
                .cornerRadius(5)
                .padding([.top, .leading], 12)

            Spacer()

            // "After" label on right
            Text("AFTER")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.orange.opacity(0.85))
                .cornerRadius(5)
                .padding([.top, .trailing], 12)
        }
    }
}

// MARK: - Cursor Modifier

private struct CursorModifier: ViewModifier {
    let cursor: NSCursor

    func body(content: Content) -> some View {
        content.onHover { inside in
            if inside {
                cursor.push()
            } else {
                NSCursor.pop()
            }
        }
    }
}

extension View {
    fileprivate func cursor(_ cursor: NSCursor) -> some View {
        self.modifier(CursorModifier(cursor: cursor))
    }
}
