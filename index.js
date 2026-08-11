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


  // 🎡 wheel configs
const wheels = {
  lowstakes: [10, 20, 30, 40, 50],

  highstakes: [100, 110, 120, 130, 140, 150],

  angel: [111, 222, 333, 444, 555]
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
  { name: 'Angel', value: 'highangel' }
)
    )
].map(command => command.toJSON());

// 🚀 register command
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        '1493034578867261523'
      ),
      { body: commands }
    );

    console.log('✅ /spin registered to the server');
  } catch (error) {
    console.error('❌ Failed to register /spin:', error);
  }
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

    
// 🎲 random amount from selected wheel
const amount = wheel[Math.floor(Math.random() * wheel.length)];

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
        .setTitle("💸 Lucky You!")
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
client.once('ready', () => {
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
