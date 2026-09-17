# Expo スタックひな形

Expo SDK 57 の出発点です。GitHub の **Use this template** から新しいリポジトリを作って使います。

## 入っているもの

- Expo Router（`src/app`）
- NativeWind / Zen Maru Gothic
- Zustand / Immer / AsyncStorage
- expo-audio / expo-haptics / expo-image
- Biome
- TypeScript
- devenv（Node.js 24）
- grilling skill（`.agents/skills`）

## 始める

```bash
devenv shell
npm install
npm run dev
```

## 最初に変えるもの

- `package.json` の `name`
- `app.json` の `name` / `slug` / `scheme`
- `assets/images/` のアイコン
