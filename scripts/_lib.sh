# Shared helpers for scripts/*.sh. Source only; not a user command.
# Callers must define usage() that accepts an optional exit code (default 1).
# usage() should write to stderr (so callers can redirect helper stdout).

die() {
  echo "error: $*" >&2
  usage 1
}

# Expand --key=value into --key value so callers only handle the spaced form.
# Result is stored in the global ARGS array. Restore with:
#   set -- "${ARGS[@]+"${ARGS[@]}"}"   # set -u safe when ARGS is empty
expand_equals() {
  ARGS=()
  local arg
  for arg in "$@"; do
    if [[ "$arg" == --*=* ]]; then
      ARGS+=("${arg%%=*}" "${arg#*=}")
    else
      ARGS+=("$arg")
    fi
  done
}

reject_extra() {
  case "$1" in
    --*) die "unknown argument: $1" ;;
    *) die "unexpected positional argument: $1 (named flags only)" ;;
  esac
}
