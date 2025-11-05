import { Router, Request, Response } from 'express';
import { mappingConfigRepository } from '../../repositories/MappingConfigRepository';
import { MappingConfigCreateInput } from '../../models/MappingConfig';
import { apiKeyAuth } from '../middleware/auth';

const router = Router();

/**
 * マッピング設定作成
 * POST /api/v1/mapping-configs
 */
router.post('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const applicationId = (req as any).applicationId;
    const input: MappingConfigCreateInput = {
      appId: applicationId,
      appName: req.body.appName || (req as any).application?.name || 'Unknown',
      messageType: req.body.messageType,
      fieldMappings: req.body.fieldMappings,
      formatType: req.body.formatType || 'json',
    };

    if (!input.messageType || !input.fieldMappings) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'messageType and fieldMappings are required',
      });
      return;
    }

    const config = await mappingConfigRepository.create(input);

    res.status(201).json(config);
  } catch (error: any) {
    console.error('Error creating mapping config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * マッピング設定取得
 * GET /api/v1/mapping-configs/:id
 */
router.get('/:id', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const configId = req.params.id;
    const applicationId = (req as any).applicationId;

    const config = await mappingConfigRepository.findById(configId);

    if (!config) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Mapping config not found',
      });
      return;
    }

    // アプリケーションのマッピング設定のみアクセス可能
    if (config.appId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this mapping config',
      });
      return;
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error getting mapping config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * アプリケーションのマッピング設定一覧取得
 * GET /api/v1/mapping-configs
 */
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const applicationId = (req as any).applicationId;
    const messageType = req.query.messageType as string;

    let configs = await mappingConfigRepository.findByAppId(applicationId);

    if (messageType) {
      configs = configs.filter(config => config.messageType === messageType);
    }

    res.json({
      configs,
      total: configs.length,
    });
  } catch (error: any) {
    console.error('Error listing mapping configs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * マッピング設定更新
 * PUT /api/v1/mapping-configs/:id
 */
router.put('/:id', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const configId = req.params.id;
    const applicationId = (req as any).applicationId;

    const config = await mappingConfigRepository.findById(configId);

    if (!config) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Mapping config not found',
      });
      return;
    }

    // アプリケーションのマッピング設定のみ更新可能
    if (config.appId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this mapping config',
      });
      return;
    }

    await mappingConfigRepository.update(configId, {
      appName: req.body.appName,
      fieldMappings: req.body.fieldMappings,
      formatType: req.body.formatType,
    });

    const updatedConfig = await mappingConfigRepository.findById(configId);
    res.json(updatedConfig);
  } catch (error: any) {
    console.error('Error updating mapping config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * マッピング設定削除
 * DELETE /api/v1/mapping-configs/:id
 */
router.delete('/:id', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const configId = req.params.id;
    const applicationId = (req as any).applicationId;

    const config = await mappingConfigRepository.findById(configId);

    if (!config) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Mapping config not found',
      });
      return;
    }

    // アプリケーションのマッピング設定のみ削除可能
    if (config.appId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this mapping config',
      });
      return;
    }

    await mappingConfigRepository.delete(configId);

    res.json({
      message: 'Mapping config deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting mapping config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;

