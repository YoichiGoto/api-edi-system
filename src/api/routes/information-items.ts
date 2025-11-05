import { Router, Request, Response } from 'express';
import { dataLoader } from '../../utils/dataLoader';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * 情報項目一覧取得
 * GET /api/v1/information-items
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const messageType = req.query.messageType as string;
    const tableType = req.query.tableType as string;

    let items;

    if (messageType) {
      items = dataLoader.getInformationItemsByMessageType(messageType);
      
      // tableTypeでフィルタ
      if (tableType) {
        items = items.filter(item => item.tableType === tableType);
      }
    } else {
      items = dataLoader.getAllInformationItems();
      
      // tableTypeでフィルタ
      if (tableType) {
        items = items.filter(item => item.tableType === tableType);
      }
    }

    res.json({
      items,
      total: items.length,
      messageType: messageType || 'all',
      tableType: tableType || 'all',
    });
  } catch (error: any) {
    console.error('Error listing information items:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * 情報項目取得（メッセージタイプ指定）
 * GET /api/v1/information-items/:messageType
 */
router.get('/:messageType', optionalAuth, async (req: Request, res: Response) => {
  try {
    const messageType = req.params.messageType;
    const tableType = req.query.tableType as string;

    const itemTable = dataLoader.getInformationItems(messageType, tableType);

    if (!itemTable) {
      res.status(404).json({
        error: 'Not Found',
        message: `Information items not found for message type: ${messageType}`,
      });
      return;
    }

    res.json(itemTable);
  } catch (error: any) {
    console.error('Error getting information items:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * 情報項目検索
 * GET /api/v1/information-items/search?q=検索キーワード
 */
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const messageType = req.query.messageType as string;

    if (!query) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "q" is required',
      });
      return;
    }

    let items = messageType
      ? dataLoader.getInformationItemsByMessageType(messageType)
      : dataLoader.getAllInformationItems();

    // 検索（項目名、項目定義、CL/IDで検索）
    const searchResults = items.flatMap(table => {
      return table.items
        .filter(item => {
          const searchText = `${item.itemName} ${item.itemDefinition} ${item.clId}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        })
        .map(item => ({
          ...item,
          messageType: table.messageType,
          tableType: table.tableType,
          sheetName: table.sheetName,
        }));
    });

    res.json({
      query,
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error: any) {
    console.error('Error searching information items:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;

