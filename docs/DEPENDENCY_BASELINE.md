# Dependency baseline

Verified on 2026-09-10 against the current first-party Expo SDK 57 release notes and default template:

- Expo `~57.0.9`
- React Native `0.86.2`
- React `19.2.3`
- Expo Router `~57.0.9`
- React Native Screens `4.27.0`
- React Native Safe Area Context `~5.7.0`
- TypeScript `~6.0.3`
- Jest Expo `~57.0.5`

Primary sources:
- https://expo.dev/changelog/sdk-57
- https://github.com/expo/expo/blob/main/templates/expo-template-default/package.json
- https://github.com/expo/expo/issues/47435

This corrects stale ADR-009/status prose that claimed React Native `0.87.1`. Repository package reality is authoritative. Expo SDK 57 targets React Native 0.86; `expo@57.0.9` aligns to 0.86.2.

## Temporary npm resolver workaround

Expo issue #47435 documents an SDK 57 `jest-expo` / `@react-native/jest-preset` peer-range conflict that makes npm 10+ fail before any project command runs. `.npmrc` sets `legacy-peer-deps=true` so CI and EAS can install the otherwise SDK-aligned graph. This is a dependency-resolver workaround, not a runtime security bypass. Remove it when the upstream peer metadata is confirmed fixed and a clean install succeeds without it.
