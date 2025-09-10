# pear-pack

Bundle and prebuild generation for Pear.


## API

### `pearPack(drive, opts) -> { bundle <Buffer>, prebuilds <Map <key, <Buffer>> }`

Creates a bundle buffer and Map of prebuild buffers.

**Options**

* `target` - target host architecture, may be array of architectures
* `builtins` - array of builtins
* `entry` - default `/boot.js`, bundle entrypoint

## License

Apache 2.0