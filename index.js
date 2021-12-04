const { Client } = require("discord.js"),
  client = new Client({
    intents: 32767,
  }),
  tictactoeGames = {};
client.on("ready", () => {
  console.log("ready");
});
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (message.content === "!ttt") {
    if (tictactoeGames[message.author.id])
      return message.channel.send("You already have a game in progress!");
    let buttons = Array.from({ length: 9 }).map((_, i) => ({
        style: 2,
        label: i + 1,
        type: 2,
        custom_id: i + 1,
      })),
      components = Array.from(
        {
          length: Math.ceil(buttons.length / 3),
        },
        (a, r) => buttons.slice(r * 3, r * 3 + 3)
      ).map((x) => ({ type: 1, components: x }));
    let botMessage = await message.channel.send({
      content: "TicTacToe",
      components,
    });
    tictactoeGames[botMessage.id] = {
      player: message.author.id,
      board: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      turn: 1,
    };
  }
});
client.on("interactionCreate", async (interaction) => {
  if (
    interaction.isButton() &&
    tictactoeGames[interaction.message.id] &&
    tictactoeGames[interaction.message.id].player === interaction.user.id
  ) {
    let { board, turn } = tictactoeGames[interaction.message.id];
    let rows = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
      ],
      x = rows.findIndex((x) => x.includes(+interaction.customId - 1)),
      y = rows[x].findIndex((x) => x === +interaction.customId - 1),
      updateBoard = async () => {
        await interaction.update({
          content: `${[, "X", "O"][turn]}\'s turn`,
          components: interaction.message.components.map((x, i) => ({
            type: 1,
            components: x.components.map((y, j) => ({
              disabled: board[i][j] > 0,
              label: [, "X", "O"][board[i][j]] || y.label,
              type: 2,
              style: [, 3, 4][board[i][j]] || 2,
              custom_id: y.customId,
            })),
          })),
        });
      },
      hasWon = (player) => {
        const allPossibleWins = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
            [1, 4, 7],
            [2, 5, 8],
            [3, 6, 9],
            [1, 5, 9],
            [3, 5, 7],
          ],
          flattened = board.flat(),
          winCheck = !!allPossibleWins
            .map(
              (win) =>
                win
                  .map((index) => flattened[index - 1])
                  .filter((e) => e === player).length === 3
            )
            .filter((element) => element).length;

        return winCheck;
      },
      getAvailableStates = () => {
        const availablePoints = [];
        for (let i = 0; i < 3; ++i)
          for (let j = 0; j < 3; ++j)
            if (board[i][j] === 0) availablePoints.push({ x: i, y: j });
        return availablePoints;
      },
      gameOver = () => {
        if (hasWon(1) || hasWon(2)) return true;
        else if (getAvailableStates().length === 0) return true;
        else return false;
      },
      minimax = (depth, isMax) => {
        let currentSpots = getAvailableStates();
        if (hasWon(1)) return -10;
        else if (hasWon(2)) return 10;
        else if (currentSpots.length === 0) return 0;
        if (isMax) {
          let bestScore = -Infinity;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (board[i][j] === 0) {
                board[i][j] = 2;
                let score = minimax(depth + 1, false);
                board[i][j] = 0;
                bestScore = Math.max(score, bestScore);
              }
            }
          }
          return bestScore;
        } else {
          let bestScore = Infinity;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (board[i][j] === 0) {
                board[i][j] = 1;
                let score = minimax(depth + 1, true);
                board[i][j] = 0;
                bestScore = Math.min(score, bestScore);
              }
            }
          }
          return bestScore;
        }
      },
      bestMove = () => {
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (board[i][j] === 0) {
              board[i][j] = 2;
              let score = minimax(0, false);
              board[i][j] = 0;
              if (score > bestScore) {
                bestScore = score;
                move = { i, j };
              }
            }
          }
        }

        return move;
      };

    board[x][y] = turn;
    turn = 2;
    if (!gameOver()) {
      let move = bestMove();
      board[move.i][move.j] = turn;
      turn = 1;
    }
    if (gameOver()) {
      if (hasWon(2) || hasWon(1)) {
        turn = turn === 1 ? 2 : 1;
        interaction.update({
          content: `${[, "X", "O"][turn]} won!`,
          components: interaction.message.components.map((x, i) => ({
            type: 1,
            components: x.components.map((y, j) => ({
              disabled: true,
              label: [, "X", "O"][board[i][j]] || y.label,
              type: 2,
              style: [, 3, 4][board[i][j]] || 2,
              custom_id: y.customId,
            })),
          })),
        });
        delete tictactoeGames[interaction.message.id];
        return;
      } else {
        delete tictactoeGames[interaction.message.id];
        return interaction.update({
          content: `Tie`,
          components: [],
        });
      }
    } else {
      await updateBoard();
    }
  }
});

client.login("TOKEN");
