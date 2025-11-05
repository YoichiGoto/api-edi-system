import { Message } from '../models/Message';
import { applicationRepository } from '../repositories/ApplicationRepository';

/**
 * メッセージルーターサービス（送信先振り分け）
 */
class MessageRouter {
  /**
   * 送信先を決定
   */
  determineReceiver(message: Message): string | null {
    // 受信者IDが指定されている場合はそれを使用
    if (message.receiverId) {
      return message.receiverId;
    }

    // その他のルーティングロジック
    // TODO: 共通EDIプロバイダ間連携のためのルーティング
    // TODO: ESP間連携プロトコルの実装

    return null;
  }

  /**
   * 共通EDIプロバイダ間連携のための送信先を決定
   */
  determineProviderRoute(receiverId: string): {
    providerId: string;
    receiverAddress: string;
    protocol?: 'local' | 'api' | 'esp';
  } | null {
    // 受信者IDから共通EDIプロバイダとアドレスを取得
    // 形式: receiverId@providerId または receiverId
    const parts = receiverId.split('@');
    
    if (parts.length === 2) {
      // 外部プロバイダの場合
      const [receiver, provider] = parts;
      
      // プロバイダIDからプロトコルを判定
      // 'local' で始まる場合はローカルプロバイダ
      // 'esp' で始まる場合はESP間連携
      // それ以外はAPI連携
      let protocol: 'local' | 'api' | 'esp' = 'api';
      if (provider.startsWith('local')) {
        protocol = 'local';
      } else if (provider.startsWith('esp')) {
        protocol = 'esp';
      }
      
      return {
        providerId: provider,
        receiverAddress: receiver,
        protocol,
      };
    }

    // デフォルトプロバイダ（自社）の場合
    return {
      providerId: 'local',
      receiverAddress: receiverId,
      protocol: 'local',
    };
  }

  /**
   * メッセージを送信
   */
  async routeMessage(message: Message): Promise<{ success: boolean; error?: string }> {
    try {
      const receiver = this.determineReceiver(message);
      
      if (!receiver) {
        return {
          success: false,
          error: 'Receiver not found',
        };
      }

      const route = this.determineProviderRoute(receiver);

      if (!route) {
        return {
          success: false,
          error: 'Route not found',
        };
      }

      // プロトコルに応じた送信処理
      switch (route.protocol) {
        case 'local':
          return await this.sendToLocal(receiver, message);
        
        case 'api':
          return await this.sendViaAPI(route, message);
        
        case 'esp':
          return await this.sendViaESP(route, message);
        
        default:
          return {
            success: false,
            error: `Unknown protocol: ${route.protocol}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ローカルプロバイダへの送信
   */
  private async sendToLocal(receiverId: string, _message: Message): Promise<{ success: boolean; error?: string }> {
    try {
      // 受信者アプリケーションの存在確認
      const receiverApp = await applicationRepository.findById(receiverId);
      
      if (!receiverApp) {
        return {
          success: false,
          error: `Receiver application not found: ${receiverId}`,
        };
      }

      if (!receiverApp.isActive) {
        return {
          success: false,
          error: `Receiver application is inactive: ${receiverId}`,
        };
      }

      // ローカルデータベースに保存（受信者IDで検索できるように）
      // 実際の実装では、受信者アプリケーションへの通知処理を追加
      // 例: Webhook、メッセージキューなど
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Local delivery failed: ${error.message}`,
      };
    }
  }

  /**
   * API連携による送信
   */
  private async sendViaAPI(
    route: { providerId: string; receiverAddress: string },
    _message: Message
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: 共通EDIプロバイダ間連携プロトコルの実装
      // 1. プロバイダ設定からエンドポイントを取得
      // 2. 認証情報を取得
      // 3. HTTPリクエストでメッセージを送信
      // 4. レスポンスを確認
      
      console.log(`[TODO] Sending message via API to ${route.providerId}:${route.receiverAddress}`);
      
      // 現在は簡易実装として成功を返す
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `API delivery failed: ${error.message}`,
      };
    }
  }

  /**
   * ESP間連携プロトコルによる送信
   */
  private async sendViaESP(
    route: { providerId: string; receiverAddress: string },
    _message: Message
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: ESP間連携プロトコルの実装
      // 1. ESPプロバイダ設定からエンドポイントを取得
      // 2. ESP間連携プロトコルに準拠したメッセージ形式に変換
      // 3. 認証情報を取得
      // 4. HTTPリクエストでメッセージを送信
      // 5. レスポンスを確認
      
      console.log(`[TODO] Sending message via ESP to ${route.providerId}:${route.receiverAddress}`);
      
      // 現在は簡易実装として成功を返す
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `ESP delivery failed: ${error.message}`,
      };
    }
  }
}

// シングルトンインスタンス
export const messageRouter = new MessageRouter();
