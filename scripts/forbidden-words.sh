#!/usr/bin/env bash
# AC-14 and philosophy.design_doctrine.the_humility_paradox.test
#
# The forbidden adjectives must appear zero times in user-facing content. The check runs over the
# specification's own content strings, the emitted locale catalogues and the module reading
# content. It deliberately does not scan this script, CONTRIBUTING.md or the workflow that names
# the words in order to forbid them.
set -euo pipefail

WORDS=(
  powerful
  advanced
  revolutionary
  seamless
  effortless
  intuitive
  canggih
  revolusioner
  "mudah sekali"
  "tanpa usaha"
)

TARGETS=(
  spec/metrika.spec.json
  packages/app/src/locale
  packages/app/src/curriculum
  content
)

status=0
for word in "${WORDS[@]}"; do
  for target in "${TARGETS[@]}"; do
    [ -e "$target" ] || continue
    if grep -rniF -- "$word" "$target" >/dev/null 2>&1; then
      echo "FORBIDDEN WORD: '$word' found in $target"
      grep -rniF -- "$word" "$target" | head -5
      status=1
    fi
  done
done

if [ "$status" -eq 0 ]; then
  echo "Forbidden adjective check passed: zero occurrences across ${#TARGETS[@]} targets."
fi
exit "$status"
