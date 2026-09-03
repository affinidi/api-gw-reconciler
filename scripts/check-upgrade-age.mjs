#!/usr/bin/env node
/**
 * Age-gate for the projen `upgrade` workflow (SEC-3901).
 *
 * The daily upgrade opens a PR that is labelled `auto-approve`, so a dependency
 * version published minutes ago would be approved without a human looking at it.
 * Compromised npm releases are almost always unpublished or flagged within a day
 * or two, so this holds brand-new versions back: it flags any DIRECT dependency
 * in package.json that the upgrade bumped to a version younger than 48h.
 *
 * It compares package.json against the base ref, asks the npm registry when each
 * bumped version was published, and writes `has_new_deps=true|false` to
 * GITHUB_OUTPUT. The workflow uses that to withhold the auto-approve label so the
 * PR needs a human review instead. Fails closed: a version whose publish time
 * cannot be established is treated as new.
 *
 * Scope note: this checks DIRECT dependencies (package.json), which is what the
 * upgrade job chooses to adopt. Transitive/lockfile age-gating is a possible
 * follow-up.
 *
 * Env: BASE_REF (default origin/main), MAX_AGE_HOURS (default 48),
 *      GITHUB_OUTPUT (optional; the workflow sets it).
 */
import { execSync } from 'node:child_process'
import { readFileSync, appendFileSync } from 'node:fs'

const BASE = process.env.BASE_REF || 'origin/main'
const MAX_AGE_HOURS = Number(process.env.MAX_AGE_HOURS || '48')
const REGISTRY = 'https://registry.npmjs.org'

const stripRange = (v) =>
  String(v)
    .replace(/^[\^~>=<\s]+/, '')
    .trim()

function depsOf(text) {
  const p = JSON.parse(text)
  return { ...(p.dependencies || {}), ...(p.devDependencies || {}), ...(p.peerDependencies || {}) }
}

function readBase() {
  try {
    return execSync(`git show ${BASE}:package.json`, { encoding: 'utf8' })
  } catch {
    return '{}'
  }
}

async function publishedAt(name, version) {
  // Encode a scoped name (@scope/pkg -> @scope%2Fpkg) for the registry path.
  const path = name.startsWith('@') ? name.replace('/', '%2f') : name
  const res = await fetch(`${REGISTRY}/${path}`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`registry ${res.status} for ${name}`)
  const meta = await res.json()
  const iso = meta.time && meta.time[version]
  if (!iso) throw new Error(`no publish time for ${name}@${version}`)
  return new Date(iso)
}

async function main() {
  const base = depsOf(readBase())
  const cur = depsOf(readFileSync('package.json', 'utf8'))

  const bumped = []
  for (const [name, range] of Object.entries(cur)) {
    const v = stripRange(range)
    if (base[name] !== undefined && stripRange(base[name]) !== v) bumped.push([name, v])
  }

  if (bumped.length === 0) {
    console.log('age-gate: no direct dependency versions changed.')
    return setOutput(false)
  }

  console.log(`age-gate: checking ${bumped.length} bumped direct dependenc(ies) (threshold ${MAX_AGE_HOURS}h).`)
  const now = Date.now()
  const tooNew = []
  for (const [name, version] of bumped) {
    let ageH
    try {
      ageH = (now - (await publishedAt(name, version)).getTime()) / 3.6e6
    } catch (e) {
      console.log(`  ${name}@${version}: age unverifiable (${e.message}) -> treating as new`)
      tooNew.push(`${name}@${version} (unverifiable)`)
      continue
    }
    const flag = ageH < MAX_AGE_HOURS ? '  <-- TOO NEW' : ''
    console.log(`  ${name}@${version}: ${ageH.toFixed(1)}h old${flag}`)
    if (ageH < MAX_AGE_HOURS) tooNew.push(`${name}@${version} (${ageH.toFixed(1)}h)`)
  }

  if (tooNew.length > 0) {
    console.log(`::warning::age-gate: withholding auto-approve, brand-new dependencies present:`)
    for (const t of tooNew) console.log(`::warning::  ${t}`)
    return setOutput(true)
  }
  console.log('age-gate: all bumped dependencies are older than the threshold.')
  return setOutput(false)
}

function setOutput(hasNew) {
  const line = `has_new_deps=${hasNew ? 'true' : 'false'}\n`
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line)
  console.log(line.trim())
}

main().catch((e) => {
  // Fail closed: an unexpected error means we could not clear the deps, so hold.
  console.log(`::warning::age-gate errored, failing closed (holding auto-approve): ${e.message}`)
  setOutput(true)
})
