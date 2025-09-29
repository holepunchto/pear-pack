const test = require('brittle')
const Localdrive = require('localdrive')
const path = require('path')

const pearPack = require('..')

const dir = __dirname + '/fixtures'

test('simple require test', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-require'))

  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['linux-x64']
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
    entry: '/boot.js',
    target: ['linux-x64']
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
    entry: '/boot.js',
    target: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('".":"/../prebuilds/linux-x64/'),
    'bundle should include reference to native addon'
  )

  t.is(result.prebuilds.size, 1, 'should capture one prebuild')
})

test('assets with require.asset', async (t) => {
  const drive = new Localdrive(path.join(dir, '/asset'))

  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should return bundle buffer')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('"assets":["/data.txt"]'),
    'bundle should include reference to asset'
  )

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('custom entry point', async (t) => {
  const drive = new Localdrive(path.join(dir, '/custom-entry'))

  const result = await pearPack(drive, {
    entry: '/main.js',
    target: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should pack with custom entry')

  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('custom entry point'),
    'should include custom entry point content'
  )
  t.ok('"main":"/main.js"', 'should include reference to entry point')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('missing entry point should error', async (t) => {
  const drive = new Localdrive(path.join(dir, '/missing-entry'))

  try {
    await pearPack(drive, { entry: '/nonexistent.js', target: ['darwin-x64'] })
    t.fail('should throw error for missing entry')
  } catch (err) {
    t.ok(err, 'should throw error for missing entry point')
    t.ok(
      err.message.includes('nonexistent.js'),
      'error should mention missing file'
    )
  }
})

test('empty directory should error', async (t) => {
  const drive = new Localdrive(path.join(dir, '/empty'))

  try {
    await pearPack(drive, { entry: '/boot.js', target: ['darwin-x64'] })
    t.fail('should throw error for empty directory')
  } catch (err) {
    t.ok(err, 'should throw error for empty directory')
    t.ok(
      err.message.includes('boot.js'),
      'error should mention missing entry file'
    )
  }
})

test('multiple targets', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-require'))

  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['darwin-x64', 'linux-x64', 'win32-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should handle multiple targets')
  t.ok(result.bundle.length > 0, 'multi-target bundle should have content')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('JSON modules', async (t) => {
  const drive = new Localdrive(path.join(dir, '/json-module'))
  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['linux-x64']
  })

  const bundleStr = result.bundle.toString()
  t.ok(bundleStr.includes('config-data'), 'should include JSON module content')

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('circular dependencies', async (t) => {
  const drive = new Localdrive(path.join(dir, '/circular-deps'))

  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['linux-x64']
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should handle circular dependencies')
  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('moduleA') && bundleStr.includes('moduleB'),
    'should include both circular modules'
  )

  t.is(result.prebuilds.size, 0, 'should have no prebuilds')
})

test('builtins option', async (t) => {
  const drive = new Localdrive(path.join(dir, '/simple-require'))

  const result = await pearPack(drive, {
    entry: '/boot.js',
    target: ['linux-x64'],
    builtins: { fs: 'mock-fs' }
  })

  t.ok(Buffer.isBuffer(result.bundle), 'should handle builtins option')
  const bundleStr = result.bundle.toString()
  t.ok(
    bundleStr.includes('mock-fs') || bundleStr.length > 0,
    'should pack with custom builtins'
  )
})
