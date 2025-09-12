const express = require('express');
const router = express.Router();
const linkTrackingService = require('../services/linkTrackingService');

// נתיב לקליק על קישור - חייב להיות ציבורי
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // קבלת נתוני הבקשה
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'];
    
    // רישום הקליק
    const result = await linkTrackingService.recordClick(
      token,
      ipAddress,
      userAgent,
      referer
    );
    
    // הגדרת cookie לזיהוי חוזר
    if (result.sessionId) {
      res.cookie('poply_session', result.sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // הפניה לכתובת המקורית
    res.redirect(result.originalUrl);
  } catch (error) {
    console.error('Error handling link click:', error);
    
    // בכל מקרה של שגיאה, נפנה לדף הבית של הלקוח
    if (error.message === 'הקישור פג תוקף') {
      res.status(410).send('הקישור פג תוקף');
    } else if (error.message === 'קישור לא נמצא') {
      res.status(404).send('קישור לא נמצא');
    } else {
      res.status(500).send('שגיאה בעיבוד הקישור');
    }
  }
});

// API לרישום אירועי tracking (מהסקריפט באתר הלקוח)
router.post('/event', async (req, res) => {
  try {
    const { sessionId, eventType, eventData, pageUrl } = req.body;
    
    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'חסרים פרמטרים חובה' });
    }
    
    const event = await linkTrackingService.recordSessionEvent(
      sessionId,
      eventType,
      eventData || {},
      pageUrl
    );
    
    res.json({ success: true, eventId: event?.id });
  } catch (error) {
    console.error('Error recording tracking event:', error);
    res.status(500).json({ error: 'שגיאה ברישום האירוע' });
  }
});

// בדיקת session (לסקריפט הלקוח)
router.get('/session/check', (req, res) => {
  const sessionId = req.cookies.poply_session;
  
  if (sessionId) {
    res.json({ sessionId, hasSession: true });
  } else {
    res.json({ hasSession: false });
  }
});

// יצירת סקריפט tracking דינמי
router.get('/script.js', (req, res) => {
  const script = `
(function() {
  // Poply Tracking Script
  const TRACKING_API = '${process.env.API_URL || 'http://localhost:3001'}/l';
  
  // קבלת או יצירת session ID
  function getSessionId() {
    // בדיקה אם יש cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'poply_session') {
        return value;
      }
    }
    
    // בדיקה ב-localStorage כגיבוי
    return localStorage.getItem('poply_session');
  }
  
  // שמירת session ID
  function saveSessionId(sessionId) {
    localStorage.setItem('poply_session', sessionId);
  }
  
  // שליחת אירוע
  function trackEvent(eventType, eventData = {}) {
    const sessionId = getSessionId();
    if (!sessionId) return;
    
    fetch(TRACKING_API + '/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        eventType,
        eventData,
        pageUrl: window.location.href
      }),
      credentials: 'include'
    }).catch(err => console.error('Poply tracking error:', err));
  }
  
  // בדיקת session בטעינת העמוד
  window.addEventListener('load', function() {
    fetch(TRACKING_API + '/session/check', {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.sessionId) {
        saveSessionId(data.sessionId);
        
        // רישום ביקור בעמוד
        trackEvent('PAGE_VIEW', {
          title: document.title,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        });
      }
    })
    .catch(err => console.error('Poply session check error:', err));
  });
  
  // חשיפת פונקציות למפתח
  window.Poply = window.Poply || {};
  window.Poply.track = trackEvent;
  
  // מעקב אוטומטי אחרי אירועים נפוצים
  
  // קליקים על כפתורים
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      trackEvent('CLICK', {
        element: target.tagName,
        text: target.textContent.substring(0, 50),
        href: target.href,
        id: target.id,
        className: target.className
      });
    }
  });
  
  // שליחת טפסים
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
      trackEvent('FORM_SUBMIT', {
        formId: form.id,
        formName: form.name,
        action: form.action,
        method: form.method
      });
    }
  });
  
  // זמן שהייה בעמוד
  let pageLoadTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
    trackEvent('PAGE_LEAVE', {
      timeOnPage,
      scrollDepth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
    });
  });
  
})();
  `;
  
  res.set('Content-Type', 'application/javascript');
  res.send(script);
});

module.exports = router;
