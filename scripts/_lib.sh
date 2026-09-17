# Shared named-flag helpers for scripts/*.sh. Source only; not a user command.
# Callers must define usage() that accepts an optional exit code (default 1).

tdmusic_require_value() {
  local flag="$1"
  local value="${2:-}"
  if [[ -z "$value" || "$value" == --* ]]; then
    echo "error: ${flag} requires a value" >&2
    usage 1
  fi
}

tdmusic_unknown_arg() {
  echo "error: unknown argument: $1" >&2
  usage 1
}

tdmusic_unexpected_positional() {
  echo "error: unexpected positional argument: $1 (named flags only)" >&2
  usage 1
}

tdmusic_node_cli() {
  if [[ -z "${ROOT:-}" ]]; then
    echo "error: ROOT is not set" >&2
    exit 1
  fi
  node --experimental-strip-types --disable-warning=ExperimentalWarning \
    "$ROOT/scripts/lib/scriptsCli.ts" "$@"
}
