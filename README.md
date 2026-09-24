# 開発

```bash
devenv shell
npm run dev
npx expo start --tunnel
```

# デプロイ

```bash
# easにログイン
npx eas-cli login
# ビルドの設定(初回のみ)
npx eas-cli build:configure
# ipaを作る
npx eas-cli build --platform ios --profile production
# 作成したipaをstoreに上げる
npx eas-cli submit --platform ios --latest
# development build
npx eas-cli build --platform ios --profile development
```