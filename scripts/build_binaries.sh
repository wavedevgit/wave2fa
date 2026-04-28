#!/usr/bin/env bash

# utils
get_sys() {
    case "$(uname -s)" in
        Darwin)
            echo "darwin"
            ;;

        Linux)
            if [ -n "$ANDROID_ROOT" ] || [ -n "$ANDROID_DATA" ] || [ -n "$ANDROID_RUNTIME_ROOT" ] \
               || grep -qi "android" /proc/version 2>/dev/null; then
                echo "android"
            else
                echo "linux"
            fi
            ;;

        *)
            echo "unknown"
            ;;
    esac
}

get_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "x64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) echo "$(uname -m)" ;;
    esac
}
get_arch_android() {
    case "$(uname -m)" in
        aarch64|arm64)
            echo "aarch64"
            ;;

        x86_64|amd64)
            echo "x86_64"
            ;;

        armv7l|armv8l|arm)
            echo "arm"
            ;;

        *)
            echo "unsupported"
            ;;
    esac
}

get_node_archive_extension() {
    case "$1" in
        linux-*) echo ".tar.xz" ;;
        win-*) echo ".zip" ;;
        darwin-*) echo ".tar.gz" ;;
        android-*) echo ".deb" ;;
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

extract_node_android() {
    mkdir -p "$NODE_BINARIES_DIR"
    mkdir -p "node_$TARGET"
    ar x $NODE_ARCHIVE_PATH && tar -xf data.tar.* -C "node_$TARGET"
    mv "node_$TARGET/data/data/com.termux/files/usr/" "$NODE_BINARIES_DIR/node-$NODE_TARGET_VERSION-$TARGET"
    rm -rf "node_$TARGET"
    rm -rf $NODE_ARCHIVE_PATH
    rm -rf control.tar.xz 
    rm -rf data.tar.xz 
    rm -rf debian-binary 
}
get_node_path_android() {
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
            extract_node_android || return 1

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
        linux-x64|linux-arm64|win-x64|win-arm64|darwin-x64|darwin-arm64|android-x86_64|android-aarch64|android-arm)
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

    echo "[+] preparing SEA binary ($SEA_BINARY)..." >&2

    cp "$NODE_BIN_PATH" "$SEA_BINARY"

    if [ "$IS_ANDROID" = "y" ]; then
        echo "[+] Android detected -> using llvm-objcopy (postject doesnt work)" >&2

        llvm-objcopy \
        --add-section NODE_SEA_BLOB="$SEA_BLOB" \
        --set-section-flags NODE_SEA_BLOB=alloc,readonly \
        --add-section NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2=/dev/null \
        --set-section-flags NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2=alloc,readonly \
        "$SEA_BINARY" "$SEA_BINARY.tmp"

        mv "$SEA_BINARY.tmp" "$SEA_BINARY"

    else
        echo "[+] non-Android -> using postject" >&2

        npx postject "$SEA_BINARY" \
            NODE_SEA_BLOB \
            "$SEA_BLOB" \
            --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
    fi

    echo "[+] final binary ready: $SEA_BINARY" >&2
}

# config

TARGET="${1:-}"
if [[ "$TARGET" == android-* ]]; then
    IS_FOR_ANDROID="y"
else
    IS_FOR_ANDROID=""
fi


# termux node currently only has 25.8.2
if [ $IS_FOR_ANDROID = "y" ]; then
    NODE_TARGET_VERSION="25.8.2"
else
    NODE_TARGET_VERSION="v25.9.0"
fi
NODE_BIN="$(which node)"
NODE_VERSION="$(node --version)"
NODE_BINARIES_DIR="$HOME/.wave2fa-sea-builder/node-binaries"

if [ "$(get_sys)" = "android" ]; then
    ARCH=$(get_arch_android)
else
    ARCH=$(get_arch)
fi
PLATFORM="$(get_sys)-$ARCH"

NODE_ARCHIVE_EXT="$(get_node_archive_extension "$TARGET")"
NODE_BUNDLE="node-$NODE_TARGET_VERSION-$TARGET"

TARGET_ARCH="${TARGET#*-}"

if [ "$IS_FOR_ANDROID" = "y" ]; then 
    NODE_DOWNLOAD_URL="https://packages.termux.dev/apt/termux-main/pool/main/n/nodejs/nodejs_${NODE_TARGET_VERSION}_$TARGET_ARCH.deb"
else
    NODE_DOWNLOAD_URL="https://nodejs.org/dist/$NODE_TARGET_VERSION/node-$NODE_TARGET_VERSION-${TARGET}${NODE_ARCHIVE_EXT}"
fi 

echo $NODE_DOWNLOAD_URL
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

    if [ "$IS_FOR_ANDROID" = "y" ]; then
        NODE_PATH="$(get_node_path_android)" || exit 1
    else
        NODE_PATH="$(get_node_path)" || exit 1
    fi

    make_final_binary "$NODE_PATH" "dist/wave2fa-$TARGET$EXTENSION"
}

build