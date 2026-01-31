const test = require('brittle')
const Localdrive = require('localdrive')
const path = require('path')

const pearPack = require('..')

const dir = __dirname + '/fixtures'

test('simple require test', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-require'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')
  t.ok(result.bundle.length > 0, 'bundle should have content')

  const bundleStr = result.bundle.toString()
  t.ok(bundleStr.includes('hello world'), 'bundle should contain file content')
  t.ok(
    bundleStr.includes('simple-module.js'),
    'bundle should include dependencies'
  )

  t.ok(result.prebuilds instanceof Map, 'should return prebuilds map')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('simple import test', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-import'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')
  t.ok(result.bundle.length > 0, 'bundle should have content')

  const bundleStr = result.bundle.toString()
  t.ok(bundleStr.includes('hello world'), 'bundle should contain file content')
  t.ok(
    bundleStr.includes('simple-module.js'),
    'bundle should include dependencies'
  )

  t.ok(result.prebuilds instanceof Map, 'should return prebuilds map')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('native addons with require.native', async (t) => {
  const drive = new Localdrive(path.join(dir, '/native-addon'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('".":"/prebuilds/linux-x64/') &&
      bundleStr.includes('.node'),
    'bundle should include reference to native addon'
  )

  t.is(result.prebuilds.size, 1, 'should capture one prebuild')
})

test('native bare addons with require.native', async (t) => {
  const drive = new Localdrive(path.join(dir, '/native-addon-bare'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('".":"/prebuilds/linux-x64/') &&
      bundleStr.includes('.bare'),
    'bundle should include reference to native addon'
  )

  t.is(result.prebuilds.size, 1, 'should capture one prebuild')
})

test('assets with require.asset', async (t) => {
  const drive = new Localdrive(path.join(dir, '/asset'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })
  t.ok(
    result.assets.get('/data.txt'),
    'assets /data.txt contains data.txt buffer'
  )
  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('assets with require.asset + assetsPrefix', async (t) => {
  const drive = new Localdrive(path.join(dir, '/asset'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64'],
    assetsPrefix: '/foo/bar'
  })
  t.ok(
    result.assets.get('/foo/bar/data.txt'),
    'assets /data.txt contains data.txt buffer'
  )
  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('custom entry point', async (t) => {
  const drive = new Localdrive(path.join(dir, '/custom-entry'))

  const result = await pearPack(drive, {
    entry: '/main.js',
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should pack with custom entry')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('custom entry point'),
    'should include custom entry point content'
  )
  t.ok(
    bundleStr.includes('"main":"/main.js"'),
    'should include reference to entry point'
  )

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('missing entry point should error', async (t) => {
  const drive = new Localdrive(path.join(dir, '/missing-entry'))

  await t.exception(
    pearPack(drive, { entry: '/nonexistent.js', hosts: ['linux-x64'] }),
    /nonexistent\.js/,
    'should throw error for missing entry file'
  )
})

test('empty directory should error', async (t) => {
  const drive = new Localdrive(path.join(dir, '/empty'))

  await t.exception(
    pearPack(drive, { hosts: ['linux-x64'] }),
    /boot\.js/,
    'should throw error for missing entry file in empty directory'
  )
})

test('multiple hostss', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-require'))

  const result = await pearPack(drive, {
    hosts: ['darwin-x64', 'linux-x64', 'win32-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should handle multiple hostss')
  t.ok(result.bundle.length > 0, 'multi-hosts bundle should have content')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('JSON modules', async (t) => {
  const drive = new Localdrive(path.join(dir, '/json-module'))
  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  const bundleStr = result.bundle.toString()
  t.ok(bundleStr.includes('config-data'), 'should include JSON module content')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('circular dependencies', async (t) => {
  const drive = new Localdrive(path.join(dir, '/circular-deps'))

  const result = await pearPack(drive, {
    hosts: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should handle circular dependencies')
  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('"/moduleA.js"') && bundleStr.includes('"/moduleB.js"'),
    'should include both circular modules'
  )

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})
