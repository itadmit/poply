const Queue = require('bull');
const { PrismaClient } = require('@prisma/client');
const campaignService = require('./campaignService');

const prisma = new PrismaClient();

// יצירת תור לקמפיינים
const campaignQueue = new Queue('campaign processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 50, // שמור רק 50 עבודות שהושלמו
    removeOnFail: 100,    // שמור רק 100 עבודות שנכשלו
    attempts: 3,          // נסה שוב עד 3 פעמים
    backoff: {
      type: 'exponential',
      delay: 5000,        // התחל עם 5 שניות
    },
  },
});

// השירותים הקיימים (SMS ואימייל) מטפלים בהגדרות האצוות והעיכובים

// עיבוד עבודות בתור
campaignQueue.process('send-campaign', async (job) => {
  const { campaignId, userId } = job.data;
  
  try {
    console.log(`Starting campaign processing: ${campaignId}`);
    
    // השתמש בשירות הקמפיינים שמשתמש בשירותי השליחה הקיימים
    const result = await campaignService.sendCampaign(campaignId, userId);
    
    // עדכון התקדמות ל-100%
    job.progress(100);
    
    return result;

  } catch (error) {
    console.error(`Campaign processing failed for ${campaignId}:`, error);
    
    // עדכון סטטוס לכישלון
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: 'FAILED',
        completedAt: new Date()
      }
    });
    
    throw error;
  }
});

// השירות הקמפיינים מטפל בכל הלוגיקה של השליחה

// הוספת קמפיין לתור
async function addCampaignToQueue(campaignId, userId, delay = 0) {
  const job = await campaignQueue.add('send-campaign', {
    campaignId,
    userId
  }, {
    delay, // עיכוב בשניות
    priority: 1 // עדיפות רגילה
  });

  console.log(`Campaign ${campaignId} added to queue with job ID: ${job.id}`);
  return job;
}

// הוספת קמפיין מתוזמן לתור
async function scheduleCampaign(campaignId, userId, scheduledAt) {
  const delay = new Date(scheduledAt).getTime() - Date.now();
  
  if (delay <= 0) {
    throw new Error('Scheduled time must be in the future');
  }

  const job = await campaignQueue.add('send-campaign', {
    campaignId,
    userId
  }, {
    delay,
    priority: 2 // עדיפות גבוהה יותר לקמפיינים מתוזמנים
  });

  console.log(`Campaign ${campaignId} scheduled for ${scheduledAt} with job ID: ${job.id}`);
  return job;
}

// ביטול קמפיין
async function cancelCampaign(campaignId) {
  const jobs = await campaignQueue.getJobs(['waiting', 'delayed']);
  
  for (const job of jobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
      console.log(`Cancelled job ${job.id} for campaign ${campaignId}`);
      
      // עדכון סטטוס הקמפיין
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'DRAFT' }
      });
      
      return true;
    }
  }
  
  return false;
}

// קבלת סטטוס תור
async function getQueueStats() {
  const waiting = await campaignQueue.getWaiting();
  const active = await campaignQueue.getActive();
  const completed = await campaignQueue.getCompleted();
  const failed = await campaignQueue.getFailed();
  const delayed = await campaignQueue.getDelayed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length
  };
}

// ניקוי תור (לתחזוקה)
async function cleanQueue() {
  await campaignQueue.clean(24 * 60 * 60 * 1000, 'completed'); // נקה עבודות שהושלמו לפני 24 שעות
  await campaignQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // נקה עבודות שנכשלו לפני שבוע
  console.log('Queue cleaned successfully');
}

// טיפול בשגיאות תור
campaignQueue.on('failed', (job, err) => {
  console.error(`Campaign job ${job.id} failed:`, err);
});

campaignQueue.on('completed', (job, result) => {
  console.log(`Campaign job ${job.id} completed:`, result);
});

campaignQueue.on('stalled', (job) => {
  console.warn(`Campaign job ${job.id} stalled`);
});

module.exports = {
  campaignQueue,
  addCampaignToQueue,
  scheduleCampaign,
  cancelCampaign,
  getQueueStats,
  cleanQueue
}; 