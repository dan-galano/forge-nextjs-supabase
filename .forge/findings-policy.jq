# Forge findings policy evaluator (D-177).
#
# Applies the deployment's findings policy to one gate's SARIF before it is
# uploaded and judged. Run from a gate job as:
#
#   jq --slurpfile policy .forge/findings-policy.json \
#      --arg gate scan-deps --arg lane scaffolded \
#      -f .forge/findings-policy.jq sarif/findings.sarif
#
# For every result, the first policy rule that matches stamps
# properties["forge-policy"] = {action, rule, reason} and sets the result's
# level: "warning" for action "warn" (it never blocks), "error" for action
# "block" (it always blocks). A result no rule matches is left untouched and
# gets the gate's own verdict. Nothing is ever removed.
#
# Written for jq 1.6+ (GitHub's ubuntu runners). Dispatch writes this file
# into the App's repo at first Publish; the copy in pkg/findingspolicy is the
# source.

def globre:
  "(^|/)"
  + (gsub("(?<c>[.+?^${}()|\\[\\]\\\\])"; "\\\(.c)")
     | gsub("\\*\\*/"; "\u0002")
     | gsub("\\*\\*"; "\u0001")
     | gsub("\\*"; "[^/]*")
     | gsub("\u0002"; "(.*/)?")
     | gsub("\u0001"; ".*"))
  + "$";

def nameglob: "^" + (globre | ltrimstr("(^|/)"));

def anyglob($xs; $v; f):
  ($xs // []) as $xs
  | ($xs | length) == 0 or ($v != null and ([ $xs[] | select(. as $g | $v | test($g | f)) ] | length) > 0);

def rank: {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}[.] // 0;

def trivy_bucket($rule):
  ($rule.properties?["security-severity"]? // null) as $raw
  | (if ($raw | type) == "number" then $raw
     elif ($raw | type) == "string" then ($raw | gsub("^\\s+|\\s+$"; "") | if . == "" then null else (tonumber? // null) end)
     else null end) as $cvss
  | ([ ($rule.properties?.tags? // [])[]? | strings | ascii_upcase
       | select(. == "CRITICAL" or . == "HIGH" or . == "MEDIUM" or . == "LOW") ] | first // "NONE") as $sevlabel
  | if $cvss == null or $cvss <= 0 then $sevlabel
    elif $cvss >= 9 then "CRITICAL" elif $cvss >= 7 then "HIGH"
    elif $cvss >= 4 then "MEDIUM" else "LOW" end;

def level_bucket:
  (.level // "") | (if type == "string" then ascii_downcase else "" end)
  | if . == "error" then "HIGH" elif . == "warning" then "MEDIUM" else "LOW" end;

($policy[0].rules // []) as $rules
| (.runs // []) |= map(
    (reduce ((.tool?.driver?.rules? // [])[]? | objects) as $r ({};
      if ($r.id | type) == "string" and $r.id != "" then .[$r.id] = $r else . end)) as $ruledefs
    | (.results // []) |= map(
        . as $res
        | ($res.message?.text? // "") as $text
        | (if ($gate == "scan-deps" or $gate == "scan-image") then
             (if ($text | test("Installed Version:")) then "vulnerability" else "misconfiguration" end)
           elif $gate == "scan-secrets" then "secret"
           elif $gate == "scan-sast" then "sast"
           else "lint" end) as $kind
        | (($text | (capture("Package: *(?<p>[^\\s]+)") // {}) | .p) // null) as $package
        | (($res.locations?[0]?.physicalLocation?.artifactLocation?.uri? // "") | sub("^file://"; "")) as $file
        | (if ($res.ruleId | type) == "string" then $ruledefs[$res.ruleId] else null end) as $ruledef
        | (if $kind == "secret" then "CRITICAL"
           elif ($gate == "scan-deps" or $gate == "scan-image") then trivy_bucket($ruledef)
           else ($res | level_bucket) end) as $severity
        | ([ $rules[]
             | select((.gate // $gate) == $gate)
             | select((.kind // $kind) == $kind)
             | select((.lane // $lane) == $lane)
             | select(anyglob(.packages; $package; nameglob))
             | select(anyglob(.rules; $res.ruleId; nameglob))
             | select(anyglob(.files; $file; globre))
             | select((.min_severity // "") == "" or ($severity | rank) >= (.min_severity | rank))
           ] | first) as $hit
        | if $hit == null then .
          else
            .properties = ((.properties // {}) + {"forge-policy": {action: $hit.action, rule: $hit.name, reason: ($hit.reason // "")}})
            | .level = (if $hit.action == "warn" then "warning" else "error" end)
          end
      )
  )
