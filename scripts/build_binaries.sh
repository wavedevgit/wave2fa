#!/usr/bin/env bash

# utils

get_sys() {
    case "$(uname -s)" in
        Linux) echo "linux" ;;
        Darwin) echo "darwin" ;;
        *) echo "unknown" ;;
    esac
}

get_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "x64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) echo "$(uname -m)" ;;
    esac
}

get_node_archive_extension() {
    case "$1" in
        linux-*) echo ".tar.xz" ;;
        win-*) echo ".zip" ;;
        darwin-*) echo ".tar.gz" ;;
        *) return 1 ;;
    esac
}

get_bin_extension() {
    case "$1" in
        win-*) echo ".exe" ;;
        *) echo "" ;;
    esac
}

get_node_archive_bin_location() {
    case "$1" in
        win-*) echo "node.exe" ;;
        *) echo "bin/node" ;;
    esac
}

download_file() {
    wget -qO "$2" "$1"
}

extract_node() {
    mkdir -p "$NODE_BINARIES_DIR"

    case "$NODE_ARCHIVE_PATH" in
        *.zip)
            unzip -q "$NODE_ARCHIVE_PATH" -d "$NODE_BINARIES_DIR"
            ;;
        *.tar.gz|*.tgz)
            tar -xzf "$NODE_ARCHIVE_PATH" -C "$NODE_BINARIES_DIR"
            ;;
        *.tar.xz)
            tar -xf "$NODE_ARCHIVE_PATH" -C "$NODE_BINARIES_DIR"
            ;;
        *.tar)
            tar -xf "$NODE_ARCHIVE_PATH" -C "$NODE_BINARIES_DIR"
            ;;
        *)
            echo "[!] unknown archive format: $NODE_ARCHIVE_PATH" >&2
            return 1
            ;;
    esac
}

get_node_path() {
    if [ "$NODE_VERSION" = "$NODE_TARGET_VERSION" ] && [ "$PLATFORM" = "$TARGET" ]; then
        echo "[+] using system node ($NODE_TARGET_VERSION)" >&2
        echo "$NODE_BIN"
    else
        NODE_ARCHIVE_PATH="$NODE_BINARIES_DIR/${TARGET}${NODE_ARCHIVE_EXT}"
        NODE_EXTRACTED_PATH="$NODE_BINARIES_DIR/$NODE_BUNDLE/$(get_node_archive_bin_location "$TARGET")"

        if [ -f "$NODE_EXTRACTED_PATH" ]; then
            echo "[+] using existing node $NODE_TARGET_VERSION for $TARGET" >&2
        else
            echo "[+] downloading node $NODE_TARGET_VERSION for $TARGET..." >&2

            mkdir -p "$NODE_BINARIES_DIR"

            download_file "$NODE_DOWNLOAD_URL" "$NODE_ARCHIVE_PATH"
            extract_node || return 1

            echo "[+] finished downloading node $NODE_TARGET_VERSION for $TARGET" >&2
        fi

        echo "$NODE_EXTRACTED_PATH"
    fi
}

check_target() {
    if [ -z "${TARGET:-}" ]; then
        echo "error: no build target specified" >&2
        return 1
    fi

    case "$TARGET" in
        linux-x64|linux-arm64|win-x64|win-arm64|darwin-x64|darwin-arm64)
            return 0
            ;;
        *)
            echo "invalid build TARGET: $TARGET" >&2
            return 1
            ;;
    esac
}

build_sea_bundle() {
    echo "[+] building rspack bundle..." >&2
    npm run build
    echo "[+] bundle ready at $ENTRY" >&2
}

generate_sea_blob() {
    echo "[+] generating SEA blob..." >&2
    "$NODE_BIN" --experimental-sea-config "$SEA_CONFIG"
    echo "[+] SEA blob created at $SEA_BLOB" >&2
}

make_final_binary() {
    local NODE_BIN_PATH="$1"
    local SEA_BINARY="$2"

    echo "[+] injecting SEA into Node binary ($NODE_BIN_PATH)..." >&2

    cp "$NODE_BIN_PATH" "$SEA_BINARY"

    npx postject "$SEA_BINARY" \
        NODE_SEA_BLOB \
        "$SEA_BLOB" \
        --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

    echo "[+] final binary: $SEA_BINARY" >&2
}

# config

NODE_TARGET_VERSION="v25.9.0"
NODE_BIN="$(which node)"
NODE_VERSION="$(node --version)"
NODE_BINARIES_DIR="$HOME/.wave2fa-sea-builder/node-binaries"

TARGET="${1:-}"
PLATFORM="$(get_sys)-$(get_arch)"

NODE_ARCHIVE_EXT="$(get_node_archive_extension "$TARGET")"
NODE_BUNDLE="node-$NODE_TARGET_VERSION-$TARGET"
NODE_DOWNLOAD_URL="https://nodejs.org/dist/$NODE_TARGET_VERSION/node-$NODE_TARGET_VERSION-${TARGET}${NODE_ARCHIVE_EXT}"

EXTENSION="$(get_bin_extension "$TARGET")"

OUT_DIR="./dist"
ENTRY="./dist/bundle.cjs"
SEA_CONFIG="./sea.config.json"
SEA_BLOB="./sea.blob"

# main

build() {
    check_target
    build_sea_bundle
    generate_sea_blob

    NODE_PATH="$(get_node_path)" || exit 1

    make_final_binary "$NODE_PATH" "dist/wave2fa-$TARGET$EXTENSION"
}

build