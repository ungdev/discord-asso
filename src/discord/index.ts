import {
  ActivityType,
  Client,
  GuildMember,
  GuildMemberRoleManager,
  TextChannel,
} from "discord.js";
import { syncRoles } from "./sync";
import { generateErrorMessage, generateFatalErrorMessage } from "./error";
import { buildModal, toggleView } from "./access";
import {
  updateToggleMessage,
  updateAdepteMessage,
  createRoleMessage,
} from "./messages";
import logger from "../logger";

export const bot = new Client({
  intents: ["Guilds", "GuildMembers"],
  presence: {
    status: "online",
    activities: [
      {
        name: "EtuUTT",
        type: ActivityType.Listening,
      },
    ],
  },
});

bot.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.channel instanceof TextChannel && interaction.inGuild()) {
      try {
        switch (interaction.commandName) {
          case "sync":
            await interaction.deferReply({
              ephemeral: true,
            });
            await syncRoles();
            interaction.editReply({
              content: "Synchronisation effectuée.",
            });
            break;
          case "update-command":
            await interaction.deferReply({
              ephemeral: true,
            });
            await updateToggleMessage(interaction.channel);
            interaction.editReply("Message envoyé");
            break;
          case "adepte":
            await interaction.deferReply({
              ephemeral: true,
            });
            await updateAdepteMessage(interaction.channel);
            interaction.editReply("Message envoyé");
            break;
          case "enroll":
            await interaction.deferReply({
              ephemeral: true,
            });
            await createRoleMessage({
              channel: interaction.channel,
              role: interaction.options.getRole("role")?.id,
              title: interaction.options.getString("title"),
              descriptionString: interaction.options.getString("description"),
            });
            interaction.editReply("Message envoyé");
            break;
          default:
            await interaction.deferReply({
              ephemeral: true,
            });
            interaction.editReply(
              generateErrorMessage(
                "Commande inconnue",
                "La commande n'existe pas."
              )
            );
        }
      } catch (error) {
        interaction.editReply(generateFatalErrorMessage());
        logger.error(error);
      }
    } else {
      await interaction.deferReply({
        ephemeral: true,
      });
      interaction.editReply(
        generateErrorMessage(
          "Erreur",
          "Tu ne peux pas effectuer cette commande dans tes DM"
        )
      );
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "toggle-asso-popup") {
      interaction.showModal(buildModal());
    } else if (interaction.customId === "toggle-role-adepte") {
      await interaction.deferReply({
        ephemeral: true,
      });
      if (
        (interaction.member.roles as GuildMemberRoleManager).cache.has(
          process.env.ADEPTE_ROLE
        )
      ) {
        await (interaction.member.roles as GuildMemberRoleManager).remove(
          process.env.ADEPTE_ROLE
        );
        interaction.editReply("Rôle enlevé");
      } else {
        (interaction.member.roles as GuildMemberRoleManager).add(
          process.env.ADEPTE_ROLE
        );
        interaction.editReply("Rôle ajouté");
      }
    } else if (interaction.customId.startsWith("toggle-role-")) {
      await interaction.deferReply({
        ephemeral: true,
      });
      const roleId = interaction.customId.slice(12);
      const role = await interaction.guild.roles.fetch(roleId);
      if (role != null) {
        if (
          (interaction.member.roles as GuildMemberRoleManager).cache.has(
            role.id
          )
        ) {
          await (interaction.member.roles as GuildMemberRoleManager).remove(
            role
          );
          interaction.editReply("Rôle enlevé");
        } else {
          (interaction.member.roles as GuildMemberRoleManager).add(role);
          interaction.editReply("Rôle ajouté");
        }
      } else {
        interaction.editReply("Impossible de t'assigner le rôle !");
      }
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "toggle-asso") {
      await interaction.deferReply({
        ephemeral: true,
      });
      const asso = interaction.fields.getTextInputValue("asso-name");
      const executed = await toggleView(
        interaction.member as GuildMember,
        asso
      );
      await interaction.editReply(
        executed
          ? `Tu viens de ${
              executed.event === "joined" ? "rejoindre" : "quitter"
            } les channels de *${executed.asso.name}*`
          : `L'asso *${asso}* n'existe pas !`
      );
    }
  }
});

bot.on("error", async (error) => {
  /* Disables spam error messages like websockets errors or connection resets from Discord API */
  if (
    !error.message.match(/Invalid WebSocket frame/i) &&
    !error.message.match(/ECONNRESET/i)
  )
    logger.error(error);
});

bot.login();

export { syncRoles } from "./sync";
