'use strict'
const sodium = require('sodium-native')
const pack = require('bare-pack-drive')
const unpack = require('bare-unpack')
const lex = require('bare-module-lexer')
const traverse = require('bare-module-traverse')

module.exports = async function pearPack(drive, opts = {}) {
  const {
    entry = '/boot.js',
    hosts,
    builtins,
    imports,
    assetsPrefix = '',
    prebuildPrefix = '',
    conditions: conds = ['node', 'bare'],
    extensions: exts = ['.node', '.bare']
  } = opts
  const bundle = await pack(drive, entry, {
    resolve,
    hosts,
    builtins,
    imports
  })
  const prebuilds = new Map()
  const assets = new Map()
  const rebundle = await unpack(
    bundle,
    { addons: true, assets: true, files: false },
    async (key) => {
      const extIx = key.lastIndexOf('.')
      if (extIx === -1) return key
      const extname = key.slice(extIx)
      if (extname !== '.node' && extname !== '.bare') {
        const assetList = new Set(bundle.assets)
        if (assetList.has(key)) {
          const asset = await drive.get(key)
          assets.set(assetsPrefix + key, asset)
        }
        return key
      }
      const hash = Buffer.allocUnsafe(32)
      const addon = await drive.get(key)
      sodium.crypto_generichash(hash, addon)
      const prebuildsPath = key.slice(key.indexOf('/prebuilds/'))
      const prebuild =
        prebuildsPath.slice(0, prebuildsPath.lastIndexOf('/') + 1) +
        hash.toString('hex') +
        extname
      prebuilds.set(prebuild, addon)
      return prebuildPrefix + prebuild
    }
  )
  return {
    bundle: rebundle.toBuffer(),
    prebuilds: prebuilds,
    assets: assets
  }
  function resolve(entry, parentURL, opts = {}) {
    let extensions
    let conditions = opts.hosts.map((host) => [...conds, ...host.split('-')])

    if (entry.type & lex.constants.ADDON) {
      extensions = [...exts]
      conditions = conditions.map((conditions) => ['addon', ...conditions])

      return traverse.resolve.addon(entry.specifier || '.', parentURL, {
        extensions,
        conditions,
        hosts: opts.hosts,
        linked: false,
        ...opts
      })
    }

    if (entry.type & lex.constants.ASSET) {
      conditions = conditions.map((conditions) => ['asset', ...conditions])
    } else {
      extensions = ['.js', '.cjs', '.mjs', '.json', ...exts]

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
}
