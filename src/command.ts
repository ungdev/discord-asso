// Load the .env file
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { config } from "dotenv";

config();

// List Commands
const commands = [
  new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Effectue la synchronisation des rôles sur le serveur")
    .setDMPermission(false)
    .setDefaultMemberPermissions(0x8),
  new SlashCommandBuilder()
    .setName("update-command")
    .setDescription(
      "Met à jour/Crée le message pour voir les channels des assos"
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(0x8),
  new SlashCommandBuilder()
    .setName("adepte")
    .setDescription(
      "Crée le message pour avoir le rôle Adepte de la salle asso"
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(0x8),
].map((command) => command.toJSON());

// Register Commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

rest
  .put(Routes.applicationCommands(process.env.BOT_ID), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
