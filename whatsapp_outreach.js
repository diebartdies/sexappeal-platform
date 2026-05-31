const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');

// Generates a personalized outreach message.
const generateOutreachMessage = (contact) => {
    // Extract the clean domain name from the source URL, or use a fallback.
    const sourceSite = contact.sourceUrl 
        ? new URL(contact.sourceUrl).hostname.replace('www.', '') 
        : 'an online directory';

    return `Hi there! I saw your profile on ${sourceSite} and loved it. 

We are launching an exclusive, private directory for top-tier companions called SexAppeal. We only accept verified professionals and we charge 50% less than legacy platforms. 

We are currently offering a 2-month completely free trial for founding members. Would you be interested in joining or learning more? Let me know!`;
};

async function startOutreach() {
    console.log('--- Starting WhatsApp Outreach ---');
    
    // Connect to the database
    await connectDB();

    // To prevent WhatsApp bans, process contacts in small batches per run
    const BATCH_SIZE = 10;
    const totalPending = await PotentialProfessional.countDocuments({ status: 'pending' });
    const pendingContacts = await PotentialProfessional.find({ status: 'pending' }).limit(BATCH_SIZE);

    if (totalPending === 0) {
        console.log('No pending contacts found to outreach.');
        process.exit(0);
    }

    console.log(`Found ${totalPending} total pending contacts.`);
    console.log(`Processing a safe batch of ${pendingContacts.length} contacts to prevent WhatsApp bans. Initializing WhatsApp Client...`);

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

            console.log(`\n💬 New message received from ${msg.from.replace('@c.us', '')}:`);
            console.log(`   "${msg.body}"`);
            
            // Optional: You can uncomment the line below to send a generic auto-reply acknowledging their message
            // await msg.reply("Thank you for your response! An admin will get back to you shortly to answer any questions.");
        } catch (err) {
            console.error('Error handling incoming message:', err.message);
        }
    });

    client.on('ready', async () => {
        console.log('\n✅ WhatsApp Client is ready! Starting messaging sequence...\n');

        for (const contact of pendingContacts) {
            try {
                // Clean the phone number (remove spaces, dashes, +, etc.)
                let cleanPhone = contact.phone.replace(/\D/g, '');
                
                // Argentine WhatsApp numbers usually need the country code '54' and the mobile prefix '9'
                // If it doesn't start with 54, add it.
                if (!cleanPhone.startsWith('54')) {
                    // Assume it's a local number missing the country code
                    cleanPhone = '549' + cleanPhone.replace(/^0+/, ''); // Remove leading zeros if any
                } else if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
                    // Add the '9' mobile prefix required for ARG WA numbers
                    cleanPhone = cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2);
                }

                const chatId = `${cleanPhone}@c.us`; // WhatsApp format suffix

                const messageToSend = generateOutreachMessage(contact);
                console.log(`📤 Sending message to ${cleanPhone}...`);
                await client.sendMessage(chatId, messageToSend);

                // Mark as contacted in the database
                contact.status = 'contacted';
                await contact.save();

                console.log(`   ✅ Message delivered.`);

                // IMPORTANT: Add a random delay (15 to 45 seconds) to prevent anti-spam bans
                const delay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
                console.log(`   ⏳ Waiting ${Math.round(delay/1000)} seconds before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (err) {
                console.error(`   ❌ Failed to send message to ${contact.phone}:`, err.message);
            }
        }

        console.log('\n--- Outreach Sequence Complete ---');
        console.log('👀 The script is now staying alive to listen for incoming replies... (Press Ctrl+C to exit)');
    });

    client.initialize();
}

startOutreach();