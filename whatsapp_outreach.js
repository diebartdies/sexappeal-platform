const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const connectDB = require('./config/database');
const PotentialProfessional = require('./models/PotentialProfessional');

// The message you want to broadcast to your scraped leads. 
// {alias} will automatically be replaced with their actual name.
const INVITE_MESSAGE = `Hola {alias} 💎!

Te vi en ArgentinaXP y me encantó tu perfil. Somos SexAppeal, un nuevo directorio exclusivo y sin comisiones.
Estamos invitando a algunas chicas seleccionadas a unirse gratis con un mes de prueba. ¿Te interesaría recibir más info?

Muchas gracias.`;

async function startOutreach() {
    console.log('--- Starting WhatsApp Lead Outreach ---');
    
    // Connect to the database
    await connectDB();

    // Find all leads that are pending
    const pendingLeads = await PotentialProfessional.find({ status: 'pending' });

    if (pendingLeads.length === 0) {
        console.log('No pending leads found.');
        process.exit(0);
    }

    console.log(`Found ${pendingLeads.length} pending leads. Initializing WhatsApp Client...`);

    // Initialize the WhatsApp Client
    const client = new Client({
        authStrategy: new LocalAuth(), // Saves session to avoid scanning QR code every time
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // Generate QR Code if session is not authenticated
    client.on('qr', (qr) => {
        console.log('\n📱 Please scan this QR code with your WhatsApp app to log in:');
        qrcode.generate(qr, { small: true });
    });

    // Listen for incoming messages (Replies)
    client.on('message', async (msg) => {
        try {
            const chat = await msg.getChat();
            // We only want to handle direct messages, ignore group chats
            if (chat.isGroup) return;

            console.log(`\n💬 New reply received from ${msg.from.replace('@c.us', '')}:`);
            console.log(`   "${msg.body}"`);
        } catch (err) {
            console.error('Error handling incoming message:', err.message);
        }
    });

    client.on('ready', async () => {
        console.log('\n✅ WhatsApp Client is ready! Starting outreach sequence...\n');

        for (const lead of pendingLeads) {
            try {
                // Clean the phone number (remove spaces, dashes, +, etc.)
                let cleanPhone = lead.phone.replace(/\D/g, '');
                
                // Argentine WhatsApp numbers usually need the country code '54' and the mobile prefix '9'
                if (!cleanPhone.startsWith('54')) {
                    cleanPhone = '549' + cleanPhone.replace(/^0+/, ''); 
                } else if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
                    cleanPhone = cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2);
                }

                const chatId = `${cleanPhone}@c.us`; 

                const alias = lead.alias || 'hermosa'; // Fallback if no alias was scraped
                const messageToSend = INVITE_MESSAGE.replace('{alias}', alias);
                
                console.log(`📤 Sending invite to ${alias} (${cleanPhone})...`);
                await client.sendMessage(chatId, messageToSend);

                // Mark the lead as contacted in the database
                lead.status = 'contacted';
                await lead.save();

                console.log(`   ✅ Message delivered and lead marked as 'contacted'.`);

                // Delay to prevent anti-spam bans (15 to 30 seconds for cold outreach)
                const delay = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
                console.log(`   ⏳ Waiting ${Math.round(delay/1000)} seconds before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (err) {
                console.error(`   ❌ Failed to send message to ${lead.phone}:`, err.message);
            }
        }

        console.log('\n--- Outreach Complete ---');
        console.log('👀 The script is now staying alive to listen for incoming replies... (Press Ctrl+C to exit)');
    });

    client.initialize();
}

startOutreach();