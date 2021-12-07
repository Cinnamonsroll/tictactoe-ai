const { Client } = require("discord.js"),
  client = new Client({
    intents: 32767,
  }),
  tictactoeGames = {}, tictactoeGame = require("./tictactoe.js");
client.on("ready", () => {
  console.log("ready");
});
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  let [command, difficulty] = message.content.split(" ");
  if (command === `!ttt`) {
    await tictactoeGame.message(message, tictactoeGames, difficulty);
  }
});
client.on("interactionCreate", async (interaction) => {
  await tictactoeGame.interaction(interaction, tictactoeGames)
});
client.login("TOKEN");
