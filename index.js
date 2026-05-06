require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 🎡 wheel configs (no links now, just ranges)
const wheels = {
  lowstakes: {
    min: 10,
    max: 100
  },
  highstakes: {
    min: 100,
    max: 200
  }
};

// 🧠 memory (cooldown + logs)
const userCooldowns = new Map();
const spinLogs = [];

const COOLDOWN = 30 * 1000; // 30 seconds

// 🛠️ slash command setup
const commands = [
  new SlashCommandBuilder()
    .setName('spin')
    .setDescription('Spin the wheel')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Choose your fate')
        .setRequired(true)
        .addChoices(
          { name: 'Low Stakes', value: 'lowstakes' },
          { name: 'High Stakes', value: 'highstakes' },
        )
    )
].map(command => command.toJSON());

// 🚀 register command
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );
})();

// 🎯 interaction logic
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'spin') {
    const userId = interaction.user.id;

    // ⏱️ cooldown check
    const now = Date.now();
    if (userCooldowns.has(userId)) {
      const last = userCooldowns.get(userId);
      if (now - last < COOLDOWN) {
        const remaining = Math.ceil((COOLDOWN - (now - last)) / 1000);
        return interaction.reply({
          content: `⏳ Wait ${remaining}s before spinning again.`,
          ephemeral: true
        });
      }
    }

    userCooldowns.set(userId, now);

    const type = interaction.options.getString('type');
    const wheel = wheels[type];

    // 🎲 random multiple of 10
    const steps = (wheel.max - wheel.min) / 10;
    const randomStep = Math.floor(Math.random() * (steps + 1));
    const amount = wheel.min + (randomStep * 10);

    const result = `$${amount}`;

    await interaction.reply("🎡 Spinning...");

    setTimeout(async () => {

      // 🧾 log it
      spinLogs.push({
        user: interaction.user.username,
        amount: result,
        type: type,
        time: new Date().toLocaleString()
      });

      // 💎 embed (clean + controlled)
      const embed = new EmbedBuilder()
        .setTitle("💸 Payment Selected")
        .setDescription("Yummy! You owe...")
        .addFields(
          { name: "Amount", value: `**${result}**`, inline: true },
          { name: "Tier", value: type, inline: true },
        )
        .setFooter({ text: `Logged • ${interaction.user.username}` })
        .setColor(0xff4d6d);

      await interaction.editReply({
        content: "",
        embeds: [embed]
      });

    }, 2000);
  }
});
// 🔍 shows when bot is ready
client.once('clientready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// 💥 catches errors you’d normally never see
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
});
client.login(process.env.DISCORD_TOKEN);