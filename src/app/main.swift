// «Беседка.app» — окно с конфигуратором (index.html рядом с приложением) и жест «три пальца вверх/вниз».
// Браузер такие касания странице не отдаёт; приложение получает их напрямую от трекпада (NSTouch) и двигает камеру по вертикали.
// macOS сама занимает три пальца под Mission Control и смахивание между приложениями: их нужно перевести на четыре пальца
// в Системных настройках → Трекпад → Ещё жесты, иначе система перехватит жест раньше приложения.
import AppKit
import WebKit

final class App: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var lastY: CGFloat?
    let selfTest = CommandLine.arguments.contains("--selftest")

    func applicationDidFinishLaunching(_ n: Notification) {
        let cfg = WKWebViewConfiguration()
        cfg.preferences.isElementFullscreenEnabled = true
        cfg.userContentController.addUserScript(WKUserScript(source: "window.__besedkaApp=true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = WKWebView(frame: NSRect(x: 0, y: 0, width: 1440, height: 900), configuration: cfg)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsMagnification = false
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1440, height: 900), styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        window.title = "Беседка"
        window.collectionBehavior = [.fullScreenPrimary]
        window.contentView = web
        window.center()
        window.setFrameAutosaveName("BesedkaMain")
        window.makeKeyAndOrderFront(nil)
        acceptTouches(web)
        // касания трекпада: три пальца — выше/ниже; остальное идёт странице как обычно
        NSEvent.addLocalMonitorForEvents(matching: [.gesture]) { [weak self] e in self?.touch(e); return e }
        // index.html вшит в приложение (Resources) — оно работает одним файлом. Если рядом лежит более свежий index.html (после сборки), берём его
        let side = Bundle.main.bundleURL.deletingLastPathComponent().appendingPathComponent("index.html")
        let inside = Bundle.main.url(forResource: "index", withExtension: "html")
        let mtime = { (u: URL) -> Date in (try? FileManager.default.attributesOfItem(atPath: u.path)[.modificationDate] as? Date) ?? .distantPast }
        var html = inside ?? side
        if FileManager.default.fileExists(atPath: side.path), inside == nil || mtime(side) >= mtime(inside!) { html = side }
        if FileManager.default.fileExists(atPath: html.path) {
            web.loadFileURL(html, allowingReadAccessTo: html.deletingLastPathComponent())
        } else {
            web.loadHTMLString("<body style='font:15px -apple-system;padding:40px'>Не найден index.html рядом с приложением: \(html.path)</body>", baseURL: nil)
            if selfTest { print("SELFTEST no index.html"); exit(2) }
        }
        NSApp.activate(ignoringOtherApps: true)
    }

    // касания приходят только тем видам, что их принимают; у WKWebView много вложенных видов — разрешаем всем
    func acceptTouches(_ v: NSView) { v.allowedTouchTypes = [.indirect]; v.wantsRestingTouches = false; v.subviews.forEach(acceptTouches) }

    func touch(_ e: NSEvent) {
        let t = e.touches(matching: .touching, in: nil)
        guard t.count == 3 else { lastY = nil; return }
        let y = t.reduce(0) { $0 + $1.normalizedPosition.y } / 3
        if let l = lastY {
            // доля высоты трекпада → «пиксели» сдвига; пальцы вверх — сцена едет вверх, как при сдвиге двумя пальцами
            let dy = Double(-(y - l) * 1100)
            if abs(dy) > 0.05 { web.evaluateJavaScript("window.__nativeLift&&window.__nativeLift(\(dy))") }
        }
        lastY = y
    }

    func webView(_ w: WKWebView, didFinish nav: WKNavigation!) {
        acceptTouches(w)
        guard selfTest else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 6) {
            w.evaluateJavaScript("JSON.stringify({ready:!!window.__ready,app:!!window.__besedkaApp,lift:typeof window.__nativeLift,worker:!!(window.App&&App.Q&&App.Q.worker()),title:document.title,steps:window.App&&App.model.steps.length,file:location.pathname.split('/').slice(-3).join('/'),err:(document.querySelector('#err')||{}).textContent||''})") { r, e in
                print("SELFTEST", r ?? "nil", e.map { "\($0)" } ?? "")
                // проверка самого подъёма: камера до и после вызова
                w.evaluateJavaScript("(()=>{const a=App.viewer&&App.viewer.camY?App.viewer.camY():null;window.__nativeLift(-200);return a;})()") { _, _ in exit(0) }
            }
        }
    }

    // ссылки на Лемана ПРО и другие сайты — в браузере, а не внутри окна
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler h: @escaping (WKNavigationActionPolicy) -> Void) {
        if let u = a.request.url, u.scheme == "http" || u.scheme == "https" { NSWorkspace.shared.open(u); h(.cancel); return }
        h(.allow)
    }
    func webView(_ w: WKWebView, createWebViewWith c: WKWebViewConfiguration, for a: WKNavigationAction, windowFeatures f: WKWindowFeatures) -> WKWebView? {
        if let u = a.request.url { NSWorkspace.shared.open(u) }
        return nil
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
let delegate = App()
app.delegate = delegate
app.setActivationPolicy(.regular)
// стандартное меню: ⌘Q, ⌘W, полноэкранный режим ⌃⌘F, копирование/вставка в полях
let main = NSMenu(), appItem = NSMenuItem(); main.addItem(appItem)
let appMenu = NSMenu(); appMenu.addItem(withTitle: "Скрыть Беседку", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
appMenu.addItem(.separator()); appMenu.addItem(withTitle: "Завершить Беседку", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"); appItem.submenu = appMenu
let editItem = NSMenuItem(); main.addItem(editItem); let edit = NSMenu(title: "Правка")
edit.addItem(withTitle: "Отменить", action: Selector(("undo:")), keyEquivalent: "z")
edit.addItem(withTitle: "Вырезать", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
edit.addItem(withTitle: "Копировать", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
edit.addItem(withTitle: "Вставить", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
edit.addItem(withTitle: "Выделить всё", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a"); editItem.submenu = edit
let viewItem = NSMenuItem(); main.addItem(viewItem); let viewM = NSMenu(title: "Вид")
let fs = viewM.addItem(withTitle: "Во весь экран", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f"); fs.keyEquivalentModifierMask = [.control, .command]
viewM.addItem(withTitle: "Обновить", action: #selector(WKWebView.reload(_:)), keyEquivalent: "r"); viewItem.submenu = viewM
let winItem = NSMenuItem(); main.addItem(winItem); let winM = NSMenu(title: "Окно")
winM.addItem(withTitle: "Свернуть", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
winM.addItem(withTitle: "Закрыть", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w"); winItem.submenu = winM
app.mainMenu = main
app.run()
