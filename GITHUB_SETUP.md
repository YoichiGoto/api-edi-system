# GitHubリポジトリセットアップガイド

## リポジトリの作成とプッシュ

ローカルリポジトリは既に初期化され、初回コミットが完了しています。
以下の手順でGitHubにリポジトリを作成してプッシュしてください。

## 方法1: GitHub CLIを使用（推奨）

### 1. GitHub CLIのインストール（未インストールの場合）

```bash
# macOS
brew install gh

# または公式サイトから
# https://cli.github.com/
```

### 2. GitHub CLIでログイン

```bash
gh auth login
```

### 3. リポジトリを作成してプッシュ

```bash
cd "/Users/yoichigoto/Documents/SME Standard Electronic Data Interchange/api-edi-system"

# リポジトリを作成（プライベートリポジトリの場合）
gh repo create api-edi-system --private --source=. --remote=origin --push

# またはパブリックリポジトリの場合
gh repo create api-edi-system --public --source=. --remote=origin --push
```

## 方法2: GitHub Web UIを使用

### 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」をクリック > 「New repository」を選択
3. リポジトリ名を入力（例: `api-edi-system`）
4. 説明を追加（オプション）:
   ```
   API-based EDI system compliant with SME Common EDI Standard ver.4.2
   ```
5. プライベートまたはパブリックを選択
6. **「Initialize this repository with a README」はチェックしない**（既にローカルにコミットがあるため）
7. 「Create repository」をクリック

### 2. リモートリポジトリを追加してプッシュ

```bash
cd "/Users/yoichigoto/Documents/SME Standard Electronic Data Interchange/api-edi-system"

# リモートリポジトリを追加（YOUR_USERNAMEを実際のユーザー名に置き換え）
git remote add origin https://github.com/YOUR_USERNAME/api-edi-system.git

# またはSSHを使用する場合
git remote add origin git@github.com:YOUR_USERNAME/api-edi-system.git

# ブランチ名を確認（必要に応じてmainに変更）
git branch -M main

# プッシュ
git push -u origin main
```

## リポジトリ設定の推奨事項

### リポジトリの説明

GitHubリポジトリの「Settings」>「General」で以下を設定：

- **Description**: `API-based EDI system compliant with SME Common EDI Standard ver.4.2`
- **Topics**: `edi`, `api`, `sme`, `typescript`, `express`, `postgresql`, `supabase`

### ブランチ保護ルール（オプション）

「Settings」>「Branches」でmainブランチの保護ルールを設定：

- Require pull request reviews before merging
- Require status checks to pass before merging

### GitHub Actions（将来的に）

`.github/workflows/`ディレクトリにCI/CDワークフローを追加できます。

## 確認

プッシュ後、GitHubリポジトリのページで以下を確認：

- README.mdが正しく表示されているか
- すべてのファイルがアップロードされているか
- .gitignoreが正しく機能しているか（node_modulesやdistが含まれていないか）

## トラブルシューティング

### 認証エラー

```bash
# GitHub CLIで再ログイン
gh auth login

# またはHTTPSの認証情報を設定
git config --global credential.helper osxkeychain
```

### リモートリポジトリの変更

```bash
# 現在のリモートを確認
git remote -v

# リモートを削除
git remote remove origin

# 新しいリモートを追加
git remote add origin https://github.com/YOUR_USERNAME/api-edi-system.git
```

