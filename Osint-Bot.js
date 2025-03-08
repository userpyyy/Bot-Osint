const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');
const base64 = require('base-64');
const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";

// ------------------------------- IP Info ------------------------------- \\

async function getIpInfo(ip) {
    const url = `http://ipapi.co/${ip}/json/`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

bot.on('messageCreate', async (message) => {
    if (message.content.startsWith('?ipinfo')) {
        const ip = message.content.split(' ')[1];
        const ipData = await getIpInfo(ip);

        if (ipData && !ipData.error) {
            const embed = new MessageEmbed()
                .setTitle("Informations sur l'adresse IP")
                .setColor(0x3498db)
                .addFields(
                    { name: "IP:", value: ipData.ip || "Inconnue", inline: false },
                    { name: "Opérateur:", value: ipData.org || "Inconnu", inline: false },
                    { name: "Pays:", value: ipData.country_name || "Inconnu", inline: false },
                    { name: "Région:", value: ipData.region || "Inconnue", inline: false },
                    { name: "Code postal:", value: ipData.postal || "Inconnu", inline: false },
                    { name: "Ville:", value: ipData.city || "Inconnue", inline: false },
                    { name: "Latitude:", value: ipData.latitude || "Inconnue", inline: false },
                    { name: "Longitude:", value: ipData.longitude || "Inconnue", inline: false }
                );
            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send("Impossible de trouver les informations pour cette IP.");
        }
    }
});

// ------------------------------- User Info ------------------------------- \\

function generateOnePartToken(userId) {
    let onePartToken = base64.encode(userId);
    onePartToken = onePartToken.replace(/=+$/, '');
    return onePartToken;
}

bot.on('messageCreate', async (message) => {
    if (message.content.startsWith('?userinfo')) {
        const userId = message.content.split(' ')[1];
        try {
            const user = await bot.users.fetch(userId);

            if (user) {
                const onePartToken = generateOnePartToken(user.id);

                const embed = new MessageEmbed()
                    .setTitle("Informations de l'utilisateur")
                    .setColor(0x3498db)
                    .addFields(
                        { name: "ID:", value: user.id, inline: false },
                        { name: "Nom d'utilisateur:", value: user.username, inline: false },
                        { name: "Date de création:", value: user.createdAt.toLocaleString(), inline: false },
                        { name: "Token One Part:", value: onePartToken, inline: false }
                    )
                    .setThumbnail(user.avatarURL());

                message.channel.send({ embeds: [embed] });
            } else {
                message.channel.send("Utilisateur non trouvé.");
            }
        } catch (error) {
            message.channel.send("Utilisateur non trouvé.");
        }
    }
});

// ------------------------------- Username Search ------------------------------- \\

async function checkUsernameOnPlatforms(username) {
    const platforms = {
        "Instagram": `https://www.instagram.com/${username}`,
        "Twitter": `https://twitter.com/${username}`,
        "GitHub": `https://github.com/${username}`,
        "Reddit": `https://www.reddit.com/user/${username}`,
        "Facebook": `https://www.facebook.com/${username}`,
        "PayPal": `https://www.paypal.me/${username}`,
        "Spotify": `https://open.spotify.com/user/${username}`
    };

    const results = [];
    for (const [platform, url] of Object.entries(platforms)) {
        try {
            const response = await axios.get(url);
            results.push([platform, true, url]);
        } catch (error) {
            results.push([platform, false, null]);
        }
    }
    return results;
}

bot.on('messageCreate', async (message) => {
    if (message.content.startsWith('?username')) {
        const username = message.content.split(' ')[1];
        message.channel.send(`🔍 Recherche des informations pour l'utilisateur: **${username}**...`);

        const results = await checkUsernameOnPlatforms(username);

        const embed = new MessageEmbed()
            .setTitle(`Résultats de recherche pour: ${username}`)
            .setDescription("Voici les résultats trouvés sur différentes plateformes:")
            .setColor(0x3498db);

        results.forEach(([platform, found, url]) => {
            if (found) {
                embed.addField(platform, `✅ Profil trouvé: [Voir le profil](${url})`, false);
            } else {
                embed.addField(platform, "❌ Aucun profil trouvé", false);
            }
        });

        message.channel.send({ embeds: [embed] });
    }
});

// ------------------------------- Phone Number Info ------------------------------- \\

async function getPhoneNumberInfo(phoneNumber) {
    const phoneUtil = PhoneNumberUtil.getInstance();
    try {
        const number = phoneUtil.parse(phoneNumber, 'FR');
        const country = phoneUtil.getRegionCodeForNumber(number);
        const carrier = phoneUtil.getCarrierNameForNumber(number, 'fr');

        return { country, carrier };
    } catch (error) {
        return null;
    }
}

bot.on('messageCreate', async (message) => {
    if (message.content.startsWith('?numinfo')) {
        const phoneNumber = message.content.split(' ')[1];
        const phoneInfo = await getPhoneNumberInfo(phoneNumber);

        if (phoneInfo) {
            const embed = new MessageEmbed()
                .setTitle(`Informations sur le numéro : ${phoneNumber}`)
                .setDescription("Voici les informations trouvées :")
                .setColor(0x28a745)
                .addFields(
                    { name: "Pays", value: phoneInfo.country || "Inconnu", inline: true },
                    { name: "Opérateur", value: phoneInfo.carrier || "Inconnu", inline: true },
                    { name: "Numéro valide", value: "✅ Oui", inline: false }
                );
            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send(`❌ Le numéro ${phoneNumber} est invalide ou mal formaté.`);
        }
    }
});

// ------------------------------- Bot Login ------------------------------- \\

bot.login('Token_du_Bot');

//Bot Open Source Dev by @userpy, Bot in Node.js V18.