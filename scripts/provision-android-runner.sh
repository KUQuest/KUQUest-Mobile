#!/usr/bin/env bash
set -euo pipefail

BUN_VERSION=1.4.0
BUN_SHA256=2d03fb5fb83ac8b567aca0a281b2ce1a1a19d488f56c2968d88c3f25e92fe452
COMMAND_LINE_TOOLS_VERSION=23.0
COMMAND_LINE_TOOLS_BUILD=16111833
COMMAND_LINE_TOOLS_SHA1=e025545c62a8e64c7559119566a569fb1dec5f60
ANDROID_PACKAGES=(
  platform-tools
  'platforms;android-36'
  'build-tools;36.0.0'
  'ndk;27.1.12297006'
  'cmake;3.30.5'
)

runner_user=github-runner
android_sdk_root=/opt/android-sdk
check_only=false

usage() {
  cat <<'USAGE'
Provision the Ubuntu 24.04 x86_64 host for KUQuest Android builds.

Usage:
  sudo ./scripts/provision-android-runner.sh [options]
  ./scripts/provision-android-runner.sh --check [options]

Options:
  --runner-user <name>       Service account for the GitHub runner (default: github-runner)
  --android-sdk-root <path>  Android SDK installation path (default: /opt/android-sdk)
  --check                    Validate without changing the host
  --help                     Show this help

Examples:
  sudo ./scripts/provision-android-runner.sh
  ./scripts/provision-android-runner.sh --check

The script installs the build toolchain only. Register the GitHub Actions runner
separately as the service account with labels: self-hosted, linux, x64, android.
USAGE
}

fail_config() {
  printf 'Configuration error: %s\n' "$1" >&2
  exit 78
}

while (($# > 0)); do
  case "$1" in
    --runner-user)
      [[ $# -ge 2 && -n "$2" ]] || fail_config '--runner-user requires a value'
      runner_user=$2
      shift 2
      ;;
    --android-sdk-root)
      [[ $# -ge 2 && "$2" == /* ]] || fail_config '--android-sdk-root requires an absolute path'
      android_sdk_root=${2%/}
      shift 2
      ;;
    --check)
      check_only=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail_config "unknown option: $1 (run with --help)"
      ;;
  esac
done

[[ $(uname -m) == x86_64 ]] || fail_config 'runner architecture must be x86_64'
# shellcheck disable=SC1091
source /etc/os-release
[[ ${ID:-} == ubuntu && ${VERSION_ID:-} == 24.04 ]] ||
  fail_config 'runner operating system must be Ubuntu 24.04'

cpu_count=$(nproc)
memory_kib=$(awk '/^MemTotal:/ { print $2 }' /proc/meminfo)
disk_kib=$(df -Pk / | awk 'NR == 2 { print $2 }')
(( cpu_count >= 4 )) || fail_config "runner needs at least 4 vCPUs; found $cpu_count"
(( memory_kib >= 3500000 )) || fail_config 'runner needs at least 4 GB RAM'
(( disk_kib >= 35000000 )) || fail_config 'runner filesystem needs at least 40 GB provisioned disk'

check_toolchain() {
  local java_version bun_version package
  command -v java >/dev/null || fail_config 'Java is missing; run this script without --check'
  java_version=$(java -version 2>&1 | awk -F '"' 'NR == 1 { print $2 }')
  [[ $java_version == 17.* ]] || fail_config "Java 17 is required; found $java_version"

  command -v bun >/dev/null || fail_config 'Bun is missing; run this script without --check'
  bun_version=$(bun --version)
  [[ $bun_version == "$BUN_VERSION" ]] ||
    fail_config "Bun $BUN_VERSION is required; found $bun_version"

  [[ -x "$android_sdk_root/cmdline-tools/$COMMAND_LINE_TOOLS_VERSION/bin/sdkmanager" ]] ||
    fail_config 'pinned Android command-line tools are missing'
  for package in "${ANDROID_PACKAGES[@]}"; do
    case "$package" in
      platform-tools) [[ -x "$android_sdk_root/platform-tools/adb" ]] ;;
      'platforms;android-36') [[ -d "$android_sdk_root/platforms/android-36" ]] ;;
      'build-tools;36.0.0') [[ -d "$android_sdk_root/build-tools/36.0.0" ]] ;;
      'ndk;27.1.12297006') [[ -d "$android_sdk_root/ndk/27.1.12297006" ]] ;;
      'cmake;3.30.5') [[ -d "$android_sdk_root/cmake/3.30.5" ]] ;;
    esac || fail_config "Android SDK package is missing: $package"
  done
  printf 'KUQuest Android runner toolchain is ready.\n'
}

if $check_only; then
  check_toolchain
  exit 0
fi

(( EUID == 0 )) || fail_config 'run provisioning as root (sudo)'

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install --yes --no-install-recommends \
  ca-certificates \
  curl \
  git \
  jq \
  openjdk-17-jdk-headless \
  unzip

if ! id "$runner_user" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$runner_user"
fi

install_bun() {
  local archive temporary_directory
  temporary_directory=$(mktemp -d)
  archive="$temporary_directory/bun-linux-x64.zip"
  curl --fail --location --retry 3 \
    "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64.zip" \
    --output "$archive"
  printf '%s  %s\n' "$BUN_SHA256" "$archive" | sha256sum --check --status
  unzip -q "$archive" -d "$temporary_directory"
  install -m 0755 "$temporary_directory/bun-linux-x64/bun" /usr/local/bin/bun
  rm -rf "$temporary_directory"
}

if ! command -v bun >/dev/null || [[ $(bun --version) != "$BUN_VERSION" ]]; then
  install_bun
fi

install_command_line_tools() {
  local archive temporary_directory
  temporary_directory=$(mktemp -d)
  archive="$temporary_directory/command-line-tools.zip"
  curl --fail --location --retry 3 \
    "https://dl.google.com/android/repository/commandlinetools-linux-${COMMAND_LINE_TOOLS_BUILD}_latest.zip" \
    --output "$archive"
  printf '%s  %s\n' "$COMMAND_LINE_TOOLS_SHA1" "$archive" | sha1sum --check --status
  unzip -q "$archive" -d "$temporary_directory"
  mkdir -p "$android_sdk_root/cmdline-tools/$COMMAND_LINE_TOOLS_VERSION"
  cp -a "$temporary_directory/cmdline-tools/." \
    "$android_sdk_root/cmdline-tools/$COMMAND_LINE_TOOLS_VERSION/"
  ln -sfn "$COMMAND_LINE_TOOLS_VERSION" "$android_sdk_root/cmdline-tools/latest"
  rm -rf "$temporary_directory"
}

sdkmanager="$android_sdk_root/cmdline-tools/$COMMAND_LINE_TOOLS_VERSION/bin/sdkmanager"
if [[ ! -x "$sdkmanager" ]]; then
  install_command_line_tools
fi

set +o pipefail
yes | "$sdkmanager" --sdk_root="$android_sdk_root" --licenses >/dev/null
license_status=${PIPESTATUS[1]}
set -o pipefail
(( license_status == 0 )) || fail_config 'Android SDK license acceptance failed'
"$sdkmanager" --sdk_root="$android_sdk_root" "${ANDROID_PACKAGES[@]}"
chown -R "$runner_user:$runner_user" "$android_sdk_root"
chmod -R u=rwX,go=rX "$android_sdk_root"

cat > /etc/profile.d/kuquest-android.sh <<PROFILE
export ANDROID_HOME=$android_sdk_root
export ANDROID_SDK_ROOT=$android_sdk_root
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=\"\$PATH:$android_sdk_root/platform-tools:$android_sdk_root/cmdline-tools/latest/bin\"
PROFILE
chmod 0644 /etc/profile.d/kuquest-android.sh

check_toolchain
printf '\nNext: register the repository-scoped GitHub Actions runner as %s.\n' "$runner_user"
printf 'Required custom label: android (default labels provide self-hosted, linux, x64).\n'
