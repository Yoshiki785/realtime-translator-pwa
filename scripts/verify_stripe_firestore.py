#!/usr/bin/env python3
"""
Stripe-Firestore 連携検証スクリプト

使用方法:
  # stripeCustomerId で検索
  python scripts/verify_stripe_firestore.py --customer-id cus_xxxxx

  # 全ユーザーの Stripe 紐付け状況を確認
  python scripts/verify_stripe_firestore.py --list-all

  # 特定uidのドキュメントを確認
  python scripts/verify_stripe_firestore.py --uid <uid>

環境変数:
  GOOGLE_APPLICATION_CREDENTIALS: Firebase Admin SDK サービスアカウントキーのパス
"""

import argparse
import json
import os
import sys

def get_firestore_client():
    """Firebase Admin SDK 経由で Firestore クライアントを取得"""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("ERROR: firebase-admin がインストールされていません", file=sys.stderr)
        print("  pip install firebase-admin", file=sys.stderr)
        sys.exit(1)

    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # デフォルト認証を試行
            firebase_admin.initialize_app()

    return firestore.client()


def find_by_customer_id(db, customer_id: str):
    """stripeCustomerId でユーザーを検索"""
    print(f"[検索] stripeCustomerId = {customer_id}")
    users_ref = db.collection("users")
    query = users_ref.where("stripeCustomerId", "==", customer_id).limit(10)

    results = list(query.stream())
    if not results:
        print(f"  => 該当なし")
        return None

    for doc in results:
        data = doc.to_dict()
        print(f"  => uid: {doc.id}")
        print(f"     stripeCustomerId: {data.get('stripeCustomerId')}")
        print(f"     stripeSubscriptionId: {data.get('stripeSubscriptionId')}")
        print(f"     updatedAt: {data.get('updatedAt')}")
        print(f"     plan: {data.get('plan')}")

    return results


def find_by_uid(db, uid: str):
    """uid でユーザードキュメントを取得"""
    print(f"[検索] uid = {uid}")
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()

    if not doc.exists:
        print(f"  => ドキュメントが存在しません")
        return None

    data = doc.to_dict()
    print(f"  => stripeCustomerId: {data.get('stripeCustomerId')}")
    print(f"     stripeSubscriptionId: {data.get('stripeSubscriptionId')}")
    print(f"     updatedAt: {data.get('updatedAt')}")
    print(f"     plan: {data.get('plan')}")
    print(f"     email: {data.get('email')}")

    return data


def list_all_stripe_users(db):
    """Stripe連携済みの全ユーザーをリスト"""
    print("[一覧] Stripe連携済みユーザー")
    users_ref = db.collection("users")

    # stripeCustomerId が存在するユーザーを検索
    # Firestore では != null クエリが制限されるため、全件取得してフィルタ
    all_users = users_ref.limit(500).stream()

    stripe_users = []
    for doc in all_users:
        data = doc.to_dict()
        if data.get("stripeCustomerId"):
            stripe_users.append({
                "uid": doc.id,
                "stripeCustomerId": data.get("stripeCustomerId"),
                "stripeSubscriptionId": data.get("stripeSubscriptionId"),
                "plan": data.get("plan"),
                "updatedAt": str(data.get("updatedAt")),
            })

    if not stripe_users:
        print("  => Stripe連携済みユーザーなし")
        return []

    print(f"  => {len(stripe_users)} 件")
    for u in stripe_users:
        print(f"     uid={u['uid']} customer={u['stripeCustomerId']} sub={u['stripeSubscriptionId']} plan={u['plan']}")

    return stripe_users


def main():
    parser = argparse.ArgumentParser(description="Stripe-Firestore 連携検証")
    parser.add_argument("--customer-id", help="stripeCustomerId で検索")
    parser.add_argument("--uid", help="uid でドキュメントを取得")
    parser.add_argument("--list-all", action="store_true", help="Stripe連携済み全ユーザーを表示")
    parser.add_argument("--json", action="store_true", help="JSON形式で出力")

    args = parser.parse_args()

    if not any([args.customer_id, args.uid, args.list_all]):
        parser.print_help()
        sys.exit(1)

    db = get_firestore_client()

    if args.customer_id:
        result = find_by_customer_id(db, args.customer_id)
        if args.json and result:
            print(json.dumps([{"uid": d.id, **d.to_dict()} for d in result], default=str))

    if args.uid:
        result = find_by_uid(db, args.uid)
        if args.json and result:
            print(json.dumps(result, default=str))

    if args.list_all:
        result = list_all_stripe_users(db)
        if args.json:
            print(json.dumps(result, default=str))


if __name__ == "__main__":
    main()
