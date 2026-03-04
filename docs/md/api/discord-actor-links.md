# Discord Actor Links API

The Discord Actor Links API allows you to link Discord users to Foundry VTT actors, making it easy to track which Discord user is associated with which character in your game.

## Authentication

All endpoints require authentication using an API key in the `x-api-key` header.

## Endpoints

### Get All Links

Get all Discord actor links for the authenticated user.

**Endpoint:** `GET /api/discord/links`

**Headers:**
- `x-api-key`: Your API key

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "discordUserId": "123456789012345678",
      "actorUuid": "Actor.abc123def456",
      "actorName": "Gandalf the Grey",
      "createdAt": "2024-03-01T12:00:00.000Z",
      "updatedAt": "2024-03-01T12:00:00.000Z"
    }
  ]
}
```

### Get Link by Discord User ID

Get the actor link for a specific Discord user.

**Endpoint:** `GET /api/discord/links/:discordUserId`

**Headers:**
- `x-api-key`: Your API key

**Parameters:**
- `discordUserId`: Discord user ID (snowflake)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "discordUserId": "123456789012345678",
    "actorUuid": "Actor.abc123def456",
    "actorName": "Gandalf the Grey",
    "createdAt": "2024-03-01T12:00:00.000Z",
    "updatedAt": "2024-03-01T12:00:00.000Z"
  }
}
```

### Create or Update Link

Create a new Discord actor link or update an existing one.

**Endpoint:** `POST /api/discord/links`

**Headers:**
- `x-api-key`: Your API key
- `Content-Type`: application/json

**Body:**
```json
{
  "discordUserId": "123456789012345678",
  "actorUuid": "Actor.abc123def456",
  "actorName": "Gandalf the Grey"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "discordUserId": "123456789012345678",
    "actorUuid": "Actor.abc123def456",
    "actorName": "Gandalf the Grey",
    "createdAt": "2024-03-01T12:00:00.000Z",
    "updatedAt": "2024-03-01T12:00:00.000Z"
  }
}
```

### Delete Link

Delete a Discord actor link.

**Endpoint:** `DELETE /api/discord/links/:discordUserId`

**Headers:**
- `x-api-key`: Your API key

**Parameters:**
- `discordUserId`: Discord user ID (snowflake)

**Response:**
```json
{
  "success": true,
  "message": "Discord actor link deleted successfully"
}
```

### Find Discord Users by Actor

Find all Discord users linked to a specific actor.

**Endpoint:** `GET /api/discord/actor/:actorUuid`

**Headers:**
- `x-api-key`: Your API key

**Parameters:**
- `actorUuid`: Foundry VTT actor UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "discordUserId": "123456789012345678",
      "actorUuid": "Actor.abc123def456",
      "actorName": "Gandalf the Grey",
      "createdAt": "2024-03-01T12:00:00.000Z",
      "updatedAt": "2024-03-01T12:00:00.000Z"
    }
  ]
}
```

## Example Usage

### Node.js / TypeScript

```typescript
const FOUNDRY_API_KEY = 'your-api-key-here';
const RELAY_URL = 'https://foundryvtt-rest-api-relay.fly.dev';

// Create a link
async function linkDiscordUserToActor(discordUserId: string, actorUuid: string, actorName?: string) {
  const response = await fetch(`${RELAY_URL}/api/discord/links`, {
    method: 'POST',
    headers: {
      'x-api-key': FOUNDRY_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      discordUserId,
      actorUuid,
      actorName
    })
  });
  
  const data = await response.json();
  return data;
}

// Get a link
async function getActorForDiscordUser(discordUserId: string) {
  const response = await fetch(`${RELAY_URL}/api/discord/links/${discordUserId}`, {
    headers: {
      'x-api-key': FOUNDRY_API_KEY
    }
  });
  
  const data = await response.json();
  return data;
}

// Get all links
async function getAllLinks() {
  const response = await fetch(`${RELAY_URL}/api/discord/links`, {
    headers: {
      'x-api-key': FOUNDRY_API_KEY
    }
  });
  
  const data = await response.json();
  return data;
}

// Delete a link
async function unlinkDiscordUser(discordUserId: string) {
  const response = await fetch(`${RELAY_URL}/api/discord/links/${discordUserId}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': FOUNDRY_API_KEY
    }
  });
  
  const data = await response.json();
  return data;
}
```

### Discord.js Integration Example

```typescript
import { Client, GatewayIntentBits, ChatInputCommandInteraction } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Command to link a Discord user to an actor
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'link-character') {
    const actorUuid = interaction.options.getString('actor-uuid', true);
    const actorName = interaction.options.getString('actor-name', false);
    
    try {
      const result = await linkDiscordUserToActor(
        interaction.user.id,
        actorUuid,
        actorName || undefined
      );
      
      if (result.success) {
        await interaction.reply({
          content: `✅ Successfully linked your Discord account to ${result.data.actorName || 'the actor'}!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ Failed to link character: ${result.error}`,
          ephemeral: true
        });
      }
    } catch (error) {
      await interaction.reply({
        content: '❌ An error occurred while linking your character.',
        ephemeral: true
      });
    }
  }
});
```

## Use Cases

1. **Character Sheet Integration**: Display a Discord user's linked Foundry character in Discord channels
2. **Roll Tracking**: Automatically attribute dice rolls to the correct character based on Discord user
3. **Initiative Tracking**: Sync initiative order between Foundry and Discord
4. **Character Status**: Display character HP, conditions, etc. in Discord based on the link
5. **Voice Channel Management**: Automatically move users to different voice channels based on their character's location in the game
