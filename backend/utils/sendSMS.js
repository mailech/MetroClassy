import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (to, body) => {
    // Debug credentials (masked)
    console.log('[SMS Debug] Credentials:', {
        sid: accountSid ? `${accountSid.substring(0, 6)}...` : 'MISSING',
        from: fromPhoneNumber
    });

    if (!to) {
        console.error('[SMS Critical] No recipient "to" number provided!');
        return null;
    }

    try {
        console.log(`[SMS Debug] Attempting to send SMS to: ${to}`);
        const message = await client.messages.create({
            body: body,
            from: fromPhoneNumber,
            to: to,
        });
        console.log(`[SMS SUCCESS] Message Sent!`);
        console.log(`   Detailed Info:`);
        console.log(`   - To: ${to} (Actual Recipient)`);
        console.log(`   - SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`[SMS Debug] FAILED to send SMS to ${to}`);

        if (error.code === 21608) {
            console.error('----------------------------------------------------');
            console.error('[TWILIO TRIAL ERROR] You are using a Twilio Trial Account.');
            console.error(`The number ${to} is NOT verified in your Twilio Console.`);
            console.error('To fix this:');
            console.error('1. Go to Twilio Console > Phone Numbers > Manage > Verified Caller IDs');
            console.error(`2. Verify the number: ${to}`);
            console.error('OR: Upgrade your Twilio account to send to any number.');
            console.error('----------------------------------------------------');
        } else {
            console.error('[SMS Debug] Error Details:', JSON.stringify(error, null, 2));
        }
        return null;
    }
};

export default sendSMS;
