// Copyright © 2026 Hanson Foundry. All rights reserved.

import SwiftUI

@main
struct FoundryHoneApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 900, minHeight: 620)
        }
        .windowStyle(.titleBar)
        .windowToolbarStyle(.unified(showsTitle: true))
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Open Image…") {
                    appState.triggerOpenPanel()
                }
                .keyboardShortcut("o", modifiers: .command)
            }
        }
    }
}

// MARK: - AppState

final class AppState: ObservableObject {
    @Published var openPanelRequested = false

    func triggerOpenPanel() {
        openPanelRequested = true
    }
}
