'use strict'
const sodium = require('sodium-native')
const pack = require('bare-pack-drive')
const unpack = require('bare-unpack')
const lex = require('bare-module-lexer')
const traverse = require('bare-module-traverse')

module.exports = async function pearPack (drive, { entry = '/boot.js', target, builtins } = {}) {
  const bundle = await pack(drive, entry, { resolve, target, builtins })
  const prebuilds = new Map()
  const rebundle = await unpack(bundle, { addons: true, files: false }, async (key) => {
    const extIx = key.lastIndexOf('.')
    if (extIx === -1) return key
    const extname = key.slice(extIx)
    if (extname !== '.node' && extname !== '.bare') return key
    const hash = Buffer.allocUnsafe(32)
    const addon = await drive.get(key)
    sodium.crypto_generichash(hash, addon)
    const prebuildsPath = key.slice(key.indexOf('/prebuilds/'))
    const prebuild = prebuildsPath.slice(0, prebuildsPath.lastIndexOf('/') + 1) + hash.toString('hex') + extname
    prebuilds.set(prebuild, addon)
    return '/..' + prebuild
  })
  return {
    bundle: rebundle.toBuffer(),
    prebuilds: prebuilds
  }
}

function resolve (entry, parentURL, opts = {}) {
  let extensions
  let conditions = opts.target.map((host) => ['node', 'bare', ...host.split('-')])

  if (entry.type & lex.constants.ADDON) {
    extensions = ['.node', '.bare']
    conditions = conditions.map((conditions) => ['addon', ...conditions])

    return traverse.resolve.addon(entry.specifier || '.', parentURL, {
      extensions,
      conditions,
      hosts: opts.target,
      linked: false,
      ...opts
    })
  }

  if (entry.type & lex.constants.ASSET) {
    conditions = conditions.map((conditions) => ['asset', ...conditions])
  } else {
    extensions = ['.js', '.cjs', '.mjs', '.json', '.node', '.bare']

    if (entry.type & lex.constants.REQUIRE) {
      conditions = conditions.map((conditions) => ['require', ...conditions])
    } else if (entry.type & lex.constants.IMPORT) {
      conditions = conditions.map((conditions) => ['import', ...conditions])
    }
  }

  return traverse.resolve.module(entry.specifier, parentURL, {
    extensions,
    conditions,
    ...opts
  })
}