#!/bin/sh
# собирает «Беседка.app» рядом с index.html: sh src/app/build_app.sh
set -e
D="$(cd "$(dirname "$0")/../.." && pwd)"
A="$D/Беседка.app"
rm -rf "$A"; mkdir -p "$A/Contents/MacOS" "$A/Contents/Resources"
cat > "$A/Contents/Info.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Беседка</string><key>CFBundleDisplayName</key><string>Беседка</string>
<key>CFBundleIdentifier</key><string>local.dacha.besedka</string><key>CFBundleExecutable</key><string>Besedka</string>
<key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>1.0</string><key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>13.0</string><key>NSHighResolutionCapable</key><true/>
<key>LSApplicationCategoryType</key><string>public.app-category.productivity</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
</dict></plist>
PL
swiftc -O -target arm64-apple-macos13 "$D/src/app/main.swift" -o "$A/Contents/MacOS/Besedka" -framework AppKit -framework WebKit
cp "$D/src/app/icon/AppIcon.icns" "$A/Contents/Resources/AppIcon.icns"
cp "$D/index.html" "$A/Contents/Resources/index.html"   # конфигуратор внутри: приложение работает одним файлом
xattr -cr "$A"; codesign --force --deep -s - "$A" >/dev/null
echo "собрано: $A"
