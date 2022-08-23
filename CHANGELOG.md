# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.2.0

### Use isomorphic Argon2

- Use [isomorphic Argon2](https://github.com/Sphereon-Opensource/isomorphic-argon2) for hashing, so that it can be run
  in the browser, node and react-native.
- Add support for not having to use challange/response on non MS ION nodes.

# 0.1.0

### Initial release

**Note:** Initial Release

- Based on https://github.com/isaacJChen/ion-pow-sdk
- Typescript implementation
- No console.log lines all over the place. We use the debug package to turn it selectively on or off
- Proper error propagation
- Using uint8array instead of Buffer (React-Native compatibility)
- Tested


