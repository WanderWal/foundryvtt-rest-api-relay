import express, { Request, Response } from 'express';
import { DiscordActorLink } from '../models/discordActorLink';
import { User } from '../models/user';
import { log } from '../utils/logger';
import { authMiddleware, trackApiUsage } from '../middleware/auth';

export const discordRouter = express.Router();

/**
 * @route GET /api/discord/links
 * @desc Get all Discord actor links for the authenticated user
 * @access Private (requires API key)
 */
discordRouter.get('/links', authMiddleware, trackApiUsage, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const links = await DiscordActorLink.findAll({
      where: { userId }
    });

    return res.json({
      success: true,
      data: links.map(link => ({
        id: link.getDataValue('id'),
        discordUserId: link.getDataValue('discordUserId'),
        actorUuid: link.getDataValue('actorUuid'),
        actorName: link.getDataValue('actorName'),
        createdAt: link.getDataValue('createdAt'),
        updatedAt: link.getDataValue('updatedAt')
      }))
    });
  } catch (error) {
    log.error('Error fetching Discord actor links', { error });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Discord actor links' 
    });
  }
});

/**
 * @route GET /api/discord/links/:discordUserId
 * @desc Get Discord actor link for a specific Discord user
 * @access Private (requires API key)
 */
discordRouter.get('/links/:discordUserId', authMiddleware, trackApiUsage, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { discordUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    if (!discordUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discord user ID is required' 
      });
    }

    const link = await DiscordActorLink.findOne({
      where: { userId, discordUserId }
    });

    if (!link) {
      return res.status(404).json({ 
        success: false, 
        error: 'Link not found' 
      });
    }

    return res.json({
      success: true,
      data: {
        id: link.getDataValue('id'),
        discordUserId: link.getDataValue('discordUserId'),
        actorUuid: link.getDataValue('actorUuid'),
        actorName: link.getDataValue('actorName'),
        createdAt: link.getDataValue('createdAt'),
        updatedAt: link.getDataValue('updatedAt')
      }
    });
  } catch (error) {
    log.error('Error fetching Discord actor link', { error });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Discord actor link' 
    });
  }
});

/**
 * @route POST /api/discord/links
 * @desc Create or update a Discord actor link
 * @access Private (requires API key)
 * @body {
 *   discordUserId: string,
 *   actorUuid: string,
 *   actorName?: string
 * }
 */
discordRouter.post('/links', authMiddleware, trackApiUsage, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { discordUserId, actorUuid, actorName } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    if (!discordUserId || !actorUuid) {
      return res.status(400).json({ 
        success: false, 
        error: 'discordUserId and actorUuid are required' 
      });
    }

    // Check if a link already exists for this Discord user
    let link = await DiscordActorLink.findOne({
      where: { userId, discordUserId }
    });

    if (link) {
      // Update existing link
      link.setDataValue('actorUuid', actorUuid);
      if (actorName) {
        link.setDataValue('actorName', actorName);
      }
      await link.save();
      
      log.info('Updated Discord actor link', { 
        userId, 
        discordUserId, 
        actorUuid 
      });
    } else {
      // Create new link
      link = await DiscordActorLink.create({
        userId,
        discordUserId,
        actorUuid,
        actorName: actorName || ''
      });
      
      log.info('Created Discord actor link', { 
        userId, 
        discordUserId, 
        actorUuid 
      });
    }

    return res.status(link ? 200 : 201).json({
      success: true,
      data: {
        id: link.getDataValue('id'),
        discordUserId: link.getDataValue('discordUserId'),
        actorUuid: link.getDataValue('actorUuid'),
        actorName: link.getDataValue('actorName'),
        createdAt: link.getDataValue('createdAt'),
        updatedAt: link.getDataValue('updatedAt')
      }
    });
  } catch (error) {
    log.error('Error creating/updating Discord actor link', { error });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create/update Discord actor link' 
    });
  }
});

/**
 * @route DELETE /api/discord/links/:discordUserId
 * @desc Delete a Discord actor link
 * @access Private (requires API key)
 */
discordRouter.delete('/links/:discordUserId', authMiddleware, trackApiUsage, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { discordUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    if (!discordUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discord user ID is required' 
      });
    }

    const deletedCount = await DiscordActorLink.destroy({
      where: { userId, discordUserId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Link not found' 
      });
    }

    log.info('Deleted Discord actor link', { 
      userId, 
      discordUserId 
    });

    return res.json({
      success: true,
      message: 'Discord actor link deleted successfully'
    });
  } catch (error) {
    log.error('Error deleting Discord actor link', { error });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete Discord actor link' 
    });
  }
});

/**
 * @route GET /api/discord/actor/:actorUuid
 * @desc Find Discord user(s) linked to a specific actor
 * @access Private (requires API key)
 */
discordRouter.get('/actor/:actorUuid', authMiddleware, trackApiUsage, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { actorUuid } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    if (!actorUuid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Actor UUID is required' 
      });
    }

    const links = await DiscordActorLink.findAll({
      where: { userId, actorUuid }
    });

    return res.json({
      success: true,
      data: links.map(link => ({
        id: link.getDataValue('id'),
        discordUserId: link.getDataValue('discordUserId'),
        actorUuid: link.getDataValue('actorUuid'),
        actorName: link.getDataValue('actorName'),
        createdAt: link.getDataValue('createdAt'),
        updatedAt: link.getDataValue('updatedAt')
      }))
    });
  } catch (error) {
    log.error('Error fetching Discord users for actor', { error });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Discord users for actor' 
    });
  }
});
