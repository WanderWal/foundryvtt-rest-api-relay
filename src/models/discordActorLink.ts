import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../sequelize';
import { log } from '../utils/logger';

// Check if we're using the memory store
const isMemoryStore = process.env.DB_TYPE === 'memory';

export class DiscordActorLink extends Model {
  // Declare types for TypeScript without public fields to avoid Sequelize conflicts
  declare id: number;
  declare userId: number;
  declare discordUserId: string;
  declare actorUuid: string;
  declare actorName: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Memory store methods
  static async findOne(options: any): Promise<any> {
    if (isMemoryStore) {
      const memoryStore = sequelize as any;
      if (!memoryStore.discordActorLinks) {
        memoryStore.discordActorLinks = new Map();
      }

      const links = Array.from(memoryStore.discordActorLinks.values()) as DiscordActorLink[];
      
      if (options.where) {
        const { userId, discordUserId, actorUuid } = options.where;
        return links.find((link) => {
          let matches = true;
          if (userId !== undefined) matches = matches && link.userId === userId;
          if (discordUserId !== undefined) matches = matches && link.discordUserId === discordUserId;
          if (actorUuid !== undefined) matches = matches && link.actorUuid === actorUuid;
          return matches;
        }) || null;
      }
      
      return null;
    }
    return super.findOne(options);
  }

  static async create(data: any): Promise<any> {
    if (isMemoryStore) {
      const memoryStore = sequelize as any;
      if (!memoryStore.discordActorLinks) {
        memoryStore.discordActorLinks = new Map();
      }
      
      const link: any = {
        id: memoryStore.discordActorLinks.size + 1,
        userId: data.userId,
        discordUserId: data.discordUserId,
        actorUuid: data.actorUuid,
        actorName: data.actorName || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        getDataValue: function(key: string): any { 
          return (this as any)[key]; 
        },
        setDataValue: function(key: string, value: any): void { 
          (this as any)[key] = value; 
        },
        save: async function() {
          this.updatedAt = new Date();
          memoryStore.discordActorLinks.set(this.id, this);
          return this;
        },
        destroy: async function() {
          memoryStore.discordActorLinks.delete(this.id);
          return this;
        }
      };
      
      memoryStore.discordActorLinks.set(link.id, link);
      
      return link;
    }
    
    return super.create(data);
  }

  static async findAll(options: any = {}): Promise<any[]> {
    if (isMemoryStore) {
      const memoryStore = sequelize as any;
      if (!memoryStore.discordActorLinks) {
        memoryStore.discordActorLinks = new Map();
      }

      let links = Array.from(memoryStore.discordActorLinks.values()) as DiscordActorLink[];

      if (options.where) {
        const { userId, discordUserId } = options.where;
        links = links.filter((link) => {
          let matches = true;
          if (userId !== undefined) matches = matches && link.userId === userId;
          if (discordUserId !== undefined) matches = matches && link.discordUserId === discordUserId;
          return matches;
        });
      }

      return links;
    }
    return super.findAll(options);
  }

  static async destroy(options: any): Promise<number> {
    if (isMemoryStore) {
      const memoryStore = sequelize as any;
      if (!memoryStore.discordActorLinks) {
        memoryStore.discordActorLinks = new Map();
        return 0;
      }

      const links = Array.from(memoryStore.discordActorLinks.entries()) as [number, DiscordActorLink][];
      let deletedCount = 0;

      if (options.where) {
        const { id, userId, discordUserId, actorUuid } = options.where;
        
        for (const [linkId, link] of links) {
          let matches = true;
          if (id !== undefined) matches = matches && link.id === id;
          if (userId !== undefined) matches = matches && link.userId === userId;
          if (discordUserId !== undefined) matches = matches && link.discordUserId === discordUserId;
          if (actorUuid !== undefined) matches = matches && link.actorUuid === actorUuid;
          
          if (matches) {
            memoryStore.discordActorLinks.delete(linkId);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    }
    return super.destroy(options);
  }
}

// Initialize with Sequelize if not using memory store
if (!isMemoryStore) {
  DiscordActorLink.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    discordUserId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Discord user ID (snowflake)'
    },
    actorUuid: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Foundry VTT actor UUID'
    },
    actorName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Actor name for convenience'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize: sequelize as Sequelize,
    tableName: 'DiscordActorLinks',
    modelName: 'DiscordActorLink',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'discordUserId']
      },
      {
        fields: ['discordUserId']
      },
      {
        fields: ['userId']
      }
    ]
  });
}
