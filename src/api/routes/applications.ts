import { Router, Request, Response } from 'express';
import { applicationRepository } from '../../repositories/ApplicationRepository';
import { jwtAuth } from '../middleware/auth';

const router = Router();

/**
 * アプリケーション作成
 * POST /api/v1/applications
 */
router.post('/', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Application name is required',
      });
      return;
    }

    const result = await applicationRepository.create(userId, name, description);

    // APIキーはこの時点でのみ返す
    res.status(201).json({
      application: {
        id: result.application.id,
        userId: result.application.userId,
        name: result.application.name,
        description: result.application.description,
        isActive: result.application.isActive,
        createdAt: result.application.createdAt,
      },
      apiKey: result.apiKey, // 初回のみ表示
      message: 'Save this API key securely. It will not be shown again.',
    });
  } catch (error: any) {
    console.error('Error creating application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * アプリケーション一覧取得
 * GET /api/v1/applications
 */
router.get('/', jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const applications = await applicationRepository.findByUserId(userId);

    res.json({
      applications: applications.map(app => ({
        id: app.id,
        userId: app.userId,
        name: app.name,
        description: app.description,
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        lastUsedAt: app.lastUsedAt,
      })),
    });
  } catch (error: any) {
    console.error('Error listing applications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * アプリケーション取得
 * GET /api/v1/applications/:id
 */
router.get('/:id', jwtAuth, async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.id;
    const userId = (req as any).userId;

    const application = await applicationRepository.findById(applicationId);

    if (!application) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Application not found',
      });
      return;
    }

    // ユーザーのアプリケーションのみアクセス可能
    if (application.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this application',
      });
      return;
    }

    res.json({
      id: application.id,
      userId: application.userId,
      name: application.name,
      description: application.description,
      isActive: application.isActive,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      lastUsedAt: application.lastUsedAt,
    });
  } catch (error: any) {
    console.error('Error getting application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * アプリケーション無効化
 * DELETE /api/v1/applications/:id
 */
router.delete('/:id', jwtAuth, async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.id;
    const userId = (req as any).userId;

    const application = await applicationRepository.findById(applicationId);

    if (!application) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Application not found',
      });
      return;
    }

    // ユーザーのアプリケーションのみ無効化可能
    if (application.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to deactivate this application',
      });
      return;
    }

    await applicationRepository.deactivate(applicationId);

    res.json({
      message: 'Application deactivated successfully',
    });
  } catch (error: any) {
    console.error('Error deactivating application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;

