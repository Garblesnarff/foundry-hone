// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI
import UniformTypeIdentifiers

// MARK: - ContentView

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var engine = EnhanceEngine()
    @StateObject private var batchQueue = BatchQueue()

    @State private var selectedDocument: ImageDocument?
    @State private var showingExportPanel = false
    @State private var exportFormat: ExportFormat = .png
    @State private var alertMessage: String?
    @State private var showAlert = false

    var body: some View {
        HSplitView {
            // Left: Batch queue / drop zone
            leftPanel
                .frame(minWidth: 220, maxWidth: 300)

            // Right: Main content
            rightPanel
                .frame(minWidth: 560)
        }
        .background(Color("Background").opacity(0.01))
        .preferredColorScheme(.dark)
        .onChange(of: appState.openPanelRequested) { requested in
            if requested {
                openFilePicker()
                appState.openPanelRequested = false
            }
        }
        .alert("Export Error", isPresented: $showAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "Unknown error")
        }
    }

    // MARK: - Left Panel

    private var leftPanel: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "hammer.fill")
                    .foregroundStyle(.orange)
                Text("Foundry Hone")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)

            Divider()

            // Drop zone (if queue is empty)
            if batchQueue.documents.isEmpty {
                DropZoneView { urls in
                    addImages(urls: urls)
                }
                .padding(10)
                Spacer()
            } else {
                BatchListView(
                    documents: batchQueue.documents,
                    selectedDocument: $selectedDocument,
                    onAdd: { openFilePicker() },
                    onRemove: { doc in
                        batchQueue.remove(doc)
                        if selectedDocument?.id == doc.id {
                            selectedDocument = batchQueue.documents.first
                        }
                    }
                )
            }

            Divider()

            // Bottom action bar
            bottomBar
        }
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private var bottomBar: some View {
        VStack(spacing: 8) {
            // Scale picker
            HStack {
                Text("Scale")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Picker("Scale", selection: Binding(
                    get: { selectedDocument?.scaleFactor ?? .x2 },
                    set: { newValue in selectedDocument?.scaleFactor = newValue }
                )) {
                    ForEach(ScaleFactor.allCases) { factor in
                        Text(factor.label).tag(factor)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 100)
            }
            .padding(.horizontal, 14)

            // Process / export buttons
            HStack(spacing: 8) {
                Button {
                    processAll()
                } label: {
                    Label("Hone", systemImage: "flame.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .disabled(batchQueue.documents.isEmpty || batchQueue.isProcessing)

                if let doc = selectedDocument, doc.isComplete {
                    Button {
                        showingExportPanel = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .buttonStyle(.bordered)
                    .fileExporter(
                        isPresented: $showingExportPanel,
                        document: ExportFileDocument(image: doc.enhancedImage),
                        contentType: exportFormat == .png ? .png : .jpeg,
                        defaultFilename: exportFilename(for: doc)
                    ) { result in
                        handleExportResult(result, document: doc)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.bottom, 14)
        }
        .padding(.top, 10)
    }

    // MARK: - Right Panel

    private var rightPanel: some View {
        VStack(spacing: 0) {
            if let doc = selectedDocument {
                ControlsPanel(document: doc, engine: engine)

                Divider()

                if doc.isComplete {
                    CompareView(document: doc)
                } else if doc.status.isProcessing {
                    processingOverlay(for: doc)
                } else {
                    idleImagePreview(for: doc)
                }
            } else {
                DropZoneView { urls in
                    addImages(urls: urls)
                }
                .padding(40)
            }
        }
    }

    private func processingOverlay(for doc: ImageDocument) -> some View {
        VStack(spacing: 20) {
            Spacer()
            ProgressView(value: doc.status.progressValue)
                .progressViewStyle(.linear)
                .frame(width: 340)

            Text(doc.status.statusMessage)
                .font(.callout)
                .foregroundStyle(.secondary)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func idleImagePreview(for doc: ImageDocument) -> some View {
        VStack {
            Spacer()
            Image(nsImage: doc.originalImage)
                .resizable()
                .scaledToFit()
                .cornerRadius(8)
                .padding(24)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Actions

    private func openFilePicker() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = true
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.jpeg, .png, .webP, .tiff, .heic]
        panel.message = "Select images to hone"

        if panel.runModal() == .OK {
            addImages(urls: panel.urls)
        }
    }

    private func addImages(urls: [URL]) {
        for url in urls {
            if let doc = ImageDocument(url: url) {
                batchQueue.add(doc)
                if selectedDocument == nil {
                    selectedDocument = doc
                }
            }
        }
    }

    private func processAll() {
        let pending = batchQueue.documents.filter {
            if case .idle = $0.status { return true }
            if case .failed = $0.status { return true }
            return false
        }

        guard !pending.isEmpty else { return }
        batchQueue.isProcessing = true

        Task {
            for doc in pending {
                if selectedDocument == nil || selectedDocument?.id == doc.id {
                    selectedDocument = doc
                }
                await engine.process(doc)
            }
            await MainActor.run {
                batchQueue.isProcessing = false
            }
        }
    }

    private func exportFilename(for doc: ImageDocument) -> String {
        let base = doc.sourceURL.deletingPathExtension().lastPathComponent
        return "\(base)_honed.\(exportFormat.fileExtension)"
    }

    private func handleExportResult(_ result: Result<URL, Error>, document: ImageDocument) {
        switch result {
        case .success:
            break
        case .failure(let error):
            alertMessage = error.localizedDescription
            showAlert = true
        }
    }
}

// MARK: - BatchQueue

@MainActor
final class BatchQueue: ObservableObject {
    @Published var documents: [ImageDocument] = []
    @Published var isProcessing = false

    func add(_ doc: ImageDocument) {
        guard !documents.contains(where: { $0.id == doc.id }) else { return }
        documents.append(doc)
    }

    func remove(_ doc: ImageDocument) {
        documents.removeAll { $0.id == doc.id }
    }
}

// MARK: - ExportFileDocument

struct ExportFileDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.png, .jpeg] }

    let image: NSImage?

    init(image: NSImage?) {
        self.image = image
    }

    init(configuration: ReadConfiguration) throws {
        self.image = nil
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        guard let image,
              let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff) else {
            throw EnhanceError.renderFailed
        }

        let isPNG = configuration.contentType == .png
        let data: Data?
        if isPNG {
            data = bitmap.representation(using: .png, properties: [:])
        } else {
            data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.92])
        }

        guard let exportData = data else {
            throw EnhanceError.encodingFailed
        }
        return FileWrapper(regularFileWithContents: exportData)
    }
}
