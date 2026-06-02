require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

// Helper: Add Business Days (skips weekends)
function addBusinessDays(date, days) {
    let result = new Date(date);
    let added = 0;
    while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
            added++;
        }
    }
    return result;
}

async function runBillingCycle() {
    console.log('--- Starting Daily Billing & Subscription Cycle ---');
    await connectDB();
    
    // Fetch dynamic rates from admin user
    const adminUser = await User.findOne({ role: 'admin' });
    let MONTHLY_RATES = {
        'Elite': 50000, 'Premium': 40000, 'Gold': 30000, 'Silver': 20000, 'Standard': 15000, 'Uncategorized': 15000
    };
    
    if (adminUser && adminUser.adminSettings && adminUser.adminSettings.pricing) {
        MONTHLY_RATES = {
            'Elite': adminUser.adminSettings.pricing.Elite || 50000,
            'Premium': adminUser.adminSettings.pricing.Premium || 40000,
            'Gold': adminUser.adminSettings.pricing.Gold || 30000,
            'Silver': adminUser.adminSettings.pricing.Silver || 20000,
            'Standard': adminUser.adminSettings.pricing.Standard || 15000,
            'Uncategorized': adminUser.adminSettings.pricing.Standard || 15000
        };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const professionals = await User.find({ 
        role: 'professional', 
        isVerified: true, 
        'professionalProfile.paysMonthlyCharges': true 
    });

    for (const prof of professionals) {
        const profile = prof.professionalProfile;
        if (!profile) continue;

        const quality = profile.quality || 'Standard';
        const baseRate = MONTHLY_RATES[quality] || 15000;
        let updated = false;

        // 1. Check Trial Expiration (1 month free trial ending)
        if (profile.subscriptionStatus === 'trial' && profile.trialEndDate <= now) {
            const daysRemaining = daysInMonth - now.getDate();
            
            // Calculate prorated amount: (Monthly Value / Days in Month) * Remaining Days
            const proratedAmount = Math.round((baseRate / daysInMonth) * daysRemaining);

            if (proratedAmount > 0) {
                profile.invoices.push({
                    billingMonth: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')} (Pro-rated)`,
                    amount: proratedAmount,
                    dueDate: addBusinessDays(now, 5),
                    status: 'pending'
                });
                console.log(`[TRIAL ENDED] Generated pro-rated invoice of ${proratedAmount} ARS for ${profile.alias}`);
            }
            
            profile.subscriptionStatus = 'active';
            updated = true;
        }

        // 2. Regular Monthly Billing (Runs on the 1st of the month)
        if (profile.subscriptionStatus === 'active' && now.getDate() === 1) {
            const billingMonth = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
            
            const alreadyInvoiced = profile.invoices.some(inv => inv.billingMonth === billingMonth);
            if (!alreadyInvoiced) {
                profile.invoices.push({
                    billingMonth: billingMonth,
                    amount: baseRate,
                    dueDate: addBusinessDays(now, 5),
                    status: 'pending'
                });
                updated = true;
                console.log(`[MONTHLY BILLING] Generated invoice of ${baseRate} ARS for ${profile.alias}`);
            }
        }

        // 3. Check Overdue Invoices (Suspension & Late Fee)
        let hasOverdue = false;

        for (const invoice of profile.invoices) {
            if ((invoice.status === 'pending' || invoice.status === 'late') && invoice.dueDate < now) {
                hasOverdue = true;
                
                // Apply 2% interest if not already applied
                if (!invoice.lateFeeApplied) {
                    invoice.amount = Math.round(invoice.amount * 1.02);
                    invoice.lateFeeApplied = true;
                    invoice.status = 'late';
                    updated = true;
                    console.log(`[OVERDUE] Applied 2% late fee for ${profile.alias}. New amount: ${invoice.amount} ARS`);
                }
            }
        }

        // Suspend account if they have overdue invoices
        if (hasOverdue && profile.subscriptionStatus !== 'suspended') {
            profile.subscriptionStatus = 'suspended';
            updated = true;
            console.log(`[SUSPENDED] Account ${profile.alias} suspended from grid due to unpaid invoices.`);
        } else if (!hasOverdue && profile.subscriptionStatus === 'suspended') {
            // If admin marks all invoices as paid, reactivate
            profile.subscriptionStatus = 'active';
            updated = true;
            console.log(`[REACTIVATED] Account ${profile.alias} restored to active grid.`);
        }

        if (updated) {
            await prof.save();
        }
    }

    console.log('--- Billing Cycle Complete ---');
    process.exit(0);
}

runBillingCycle();