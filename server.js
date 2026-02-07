require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./database/db');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'bdu-chat-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false, // HTTP üçün false, HTTPS üçün true
    httpOnly: true
  }
}));

// Fakultələr və onların korpusları
const FACULTIES = [
  { name: 'Mexanika-riyaziyyat fakültəsi', building: '3' },
  { name: 'Tətbiqi riyaziyyat və kibernetika fakültəsi', building: '3' },
  { name: 'Fizika fakültəsi', building: 'əsas' },
  { name: 'Kimya fakültəsi', building: 'əsas' },
  { name: 'Biologiya fakültəsi', building: 'əsas' },
  { name: 'Ekologiya və torpaqşünaslıq fakültəsi', building: 'əsas' },
  { name: 'Coğrafiya fakültəsi', building: 'əsas' },
  { name: 'Geologiya fakültəsi', building: 'əsas' },
  { name: 'Filologiya fakültəsi', building: '1' },
  { name: 'Tarix fakültəsi', building: '3' },
  { name: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi', building: '1' },
  { name: 'Hüquq fakültəsi', building: '1' },
  { name: 'Jurnalistika fakültəsi', building: '2' },
  { name: 'İnformasiya və sənəd menecmenti fakültəsi', building: '2' },
  { name: 'Şərqşünaslıq fakültəsi', building: '2' },
  { name: 'Sosial elmlər və psixologiya fakültəsi', building: '2' }
];

// ================== API ROUTES ==================

// Ana səhifə
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fakultələri əldə et
app.get('/api/faculties', (req, res) => {
  res.json(FACULTIES);
});

// Qeydiyyat üçün random 3 sual
app.get('/api/verification-questions', (req, res) => {
  const shuffled = [...FACULTIES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  const questions = selected.map((f, idx) => ({
    id: idx,
    question: `${f.name} hansı korpusda yerləşir?`,
    answer: f.building,
    faculty: f.name
  }));
  
  res.json(questions);
});

// Qeydiyyat
app.post('/api/register', async (req, res) => {
  try {
    const { 
      email, 
      phone, 
      password, 
      full_name, 
      faculty, 
      degree, 
      course, 
      avatar,
      verification_answers 
    } = req.body;

    // Email validation
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    // Phone validation
    if (!phone.startsWith('+994') || phone.length !== 13) {
      return res.status(400).json({ error: 'Telefon nömrəsi +994 ilə başlamalı və 9 rəqəm olmalıdır' });
    }

    // Verification check (minimum 2 doğru cavab)
    let correctCount = 0;
    for (let ans of verification_answers) {
      const faculty = FACULTIES.find(f => f.name === ans.faculty);
      if (faculty && faculty.building === ans.answer) {
        correctCount++;
      }
    }

    if (correctCount < 2) {
      return res.status(400).json({ error: 'Minimum 2 sual doğru cavablandırılmalıdır' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Bu email və ya telefon nömrəsi artıq qeydiyyatdan keçib' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password, full_name, faculty, degree, course, avatar) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, full_name, faculty, degree, course, avatar`,
      [email, phone, hashedPassword, full_name, faculty, degree, course, avatar || 1]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Qeydiyyat xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Giriş
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    req.session.userId = user.id;

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Giriş xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Çıxış
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Cari istifadəçi məlumatı
app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, email, phone, full_name, faculty, degree, course, avatar FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('İstifadəçi məlumatı xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Profili yenilə
app.put('/api/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { full_name, faculty, degree, course, avatar } = req.body;

    await pool.query(
      'UPDATE users SET full_name = $1, faculty = $2, degree = $3, course = $4, avatar = $5 WHERE id = $6',
      [full_name, faculty, degree, course, avatar, req.session.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Profil yeniləmə xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Qrup mesajlarını əldə et
app.get('/api/messages/:faculty', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { faculty } = req.params;

    // Get blocked users
    const blockedResult = await pool.query(
      'SELECT blocked_id FROM blocks WHERE blocker_id = $1',
      [req.session.userId]
    );
    const blockedIds = blockedResult.rows.map(r => r.blocked_id);

    // Get messages excluding blocked users
    let query = `
      SELECT m.*, u.full_name, u.faculty, u.degree, u.course, u.avatar 
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE u.faculty = $1
    `;
    
    if (blockedIds.length > 0) {
      query += ` AND m.user_id NOT IN (${blockedIds.join(',')})`;
    }
    
    query += ' ORDER BY m.created_at ASC';

    const result = await pool.query(query, [faculty]);
    res.json(result.rows);
  } catch (error) {
    console.error('Mesajları əldə etmə xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Şəxsi mesajları əldə et
app.get('/api/private-messages/:userId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const otherUserId = parseInt(userId);

    // Check if blocked
    const blockCheck = await pool.query(
      'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [req.session.userId, otherUserId]
    );

    if (blockCheck.rows.length > 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT pm.*, u.full_name, u.avatar 
       FROM private_messages pm
       JOIN users u ON pm.sender_id = u.id
       WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) OR (pm.sender_id = $2 AND pm.receiver_id = $1)
       ORDER BY pm.created_at ASC`,
      [req.session.userId, otherUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Şəxsi mesajları əldə etmə xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// İstifadəçini əngəllə
app.post('/api/block/:userId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const blockedUserId = parseInt(userId);

    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.session.userId, blockedUserId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Əngəlləmə xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// İstifadəçini şikayət et
app.post('/api/report/:userId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const { reason } = req.body;
    const reportedUserId = parseInt(userId);

    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
      [req.session.userId, reportedUserId, reason || '']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Şikayət xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin giriş
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    req.session.adminId = admin.id;
    req.session.isSuper = admin.is_super;

    res.json({ 
      success: true, 
      admin: {
        id: admin.id,
        username: admin.username,
        is_super: admin.is_super
      }
    });
  } catch (error) {
    console.error('Admin giriş xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - istifadəçilər
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, email, phone, full_name, faculty, degree, course, avatar, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('İstifadəçilər xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - istifadəçini deaktiv/aktiv et
app.put('/api/admin/users/:userId/toggle', async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;

    await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('İstifadəçi toggle xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - şübhəli hesablar (8+ şikayət)
app.get('/api/admin/suspicious', async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(`
      SELECT u.id, u.email, u.phone, u.full_name, u.faculty, u.degree, u.course, u.avatar, u.is_active, u.created_at, COUNT(r.id) as report_count
      FROM users u
      LEFT JOIN reports r ON u.id = r.reported_id
      GROUP BY u.id
      HAVING COUNT(r.id) >= 8
      ORDER BY report_count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Şübhəli hesablar xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - parametrləri əldə et
app.get('/api/admin/settings', async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query('SELECT * FROM admin_settings');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Parametrlər xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - parametrləri yenilə
app.put('/api/admin/settings', async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = req.body;

    for (let key in settings) {
      await pool.query(
        'UPDATE admin_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
        [settings[key], key]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Parametrlər yeniləmə xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - alt admin yarat
app.post('/api/admin/create-sub-admin', async (req, res) => {
  try {
    if (!req.session.adminId || !req.session.isSuper) {
      return res.status(403).json({ error: 'Yalnız super admin alt admin yarada bilər' });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO admins (username, password, is_super) VALUES ($1, $2, false)',
      [username, hashedPassword]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Alt admin yaratma xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - günün mövzusu
app.get('/api/topic-of-day', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT setting_value FROM admin_settings WHERE setting_key = 'topic_of_day'"
    );

    res.json({ topic: result.rows[0]?.setting_value || '' });
  } catch (error) {
    console.error('Günün mövzusu xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - qaydalar
app.get('/api/rules', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT setting_value FROM admin_settings WHERE setting_key = 'rules'"
    );

    res.json({ rules: result.rows[0]?.setting_value || '' });
  } catch (error) {
    console.error('Qaydalar xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// Admin panel - haqqında
app.get('/api/about', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT setting_value FROM admin_settings WHERE setting_key = 'about'"
    );

    res.json({ about: result.rows[0]?.setting_value || '' });
  } catch (error) {
    console.error('Haqqında xətası:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// ================== SOCKET.IO ==================

io.on('connection', (socket) => {
  console.log('✅ İstifadəçi qoşuldu:', socket.id);

  // Join faculty room
  socket.on('join-faculty', async (faculty) => {
    socket.join(faculty);
    console.log(`İstifadəçi ${socket.id} ${faculty} otağına qoşuldu`);
  });

  // Send group message
  socket.on('send-message', async (data) => {
    try {
      const { faculty, message, userId } = data;

      // Get filter words
      const filterResult = await pool.query(
        "SELECT setting_value FROM admin_settings WHERE setting_key = 'filter_words'"
      );
      let filteredMessage = message;
      
      if (filterResult.rows[0]?.setting_value) {
        const filterWords = filterResult.rows[0].setting_value.split(',').map(w => w.trim());
        filterWords.forEach(word => {
          const regex = new RegExp(word, 'gi');
          filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
        });
      }

      // Get user info
      const userResult = await pool.query(
        'SELECT id, full_name, faculty, degree, course, avatar FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) return;

      const user = userResult.rows[0];

      // Insert message
      const result = await pool.query(
        'INSERT INTO messages (user_id, message) VALUES ($1, $2) RETURNING id, created_at',
        [userId, filteredMessage]
      );

      const messageData = {
        id: result.rows[0].id,
        user_id: user.id,
        message: filteredMessage,
        created_at: result.rows[0].created_at,
        full_name: user.full_name,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course,
        avatar: user.avatar
      };

      // Emit to all users in faculty room except blocked users
      io.to(faculty).emit('new-message', messageData);

    } catch (error) {
      console.error('Mesaj göndərmə xətası:', error);
    }
  });

  // Send private message
  socket.on('send-private-message', async (data) => {
    try {
      const { senderId, receiverId, message } = data;

      // Check if blocked
      const blockCheck = await pool.query(
        'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
        [senderId, receiverId]
      );

      if (blockCheck.rows.length > 0) return;

      // Get filter words
      const filterResult = await pool.query(
        "SELECT setting_value FROM admin_settings WHERE setting_key = 'filter_words'"
      );
      let filteredMessage = message;
      
      if (filterResult.rows[0]?.setting_value) {
        const filterWords = filterResult.rows[0].setting_value.split(',').map(w => w.trim());
        filterWords.forEach(word => {
          const regex = new RegExp(word, 'gi');
          filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
        });
      }

      // Insert message
      const result = await pool.query(
        'INSERT INTO private_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING id, created_at',
        [senderId, receiverId, filteredMessage]
      );

      // Get sender info
      const userResult = await pool.query(
        'SELECT full_name, avatar FROM users WHERE id = $1',
        [senderId]
      );

      const messageData = {
        id: result.rows[0].id,
        sender_id: senderId,
        receiver_id: receiverId,
        message: filteredMessage,
        created_at: result.rows[0].created_at,
        full_name: userResult.rows[0].full_name,
        avatar: userResult.rows[0].avatar
      };

      // Emit to both users
      io.to(`user-${senderId}`).emit('new-private-message', messageData);
      io.to(`user-${receiverId}`).emit('new-private-message', messageData);

    } catch (error) {
      console.error('Şəxsi mesaj göndərmə xətası:', error);
    }
  });

  // Join private chat
  socket.on('join-private', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`İstifadəçi ${userId} şəxsi otağa qoşuldu`);
  });

  socket.on('disconnect', () => {
    console.log('❌ İstifadəçi ayrıldı:', socket.id);
  });
});

// Mesajları avtomatik sil (cron job)
setInterval(async () => {
  try {
    // Get expiry settings
    const settings = await pool.query(
      "SELECT setting_key, setting_value FROM admin_settings WHERE setting_key IN ('group_message_expiry_minutes', 'private_message_expiry_minutes')"
    );

    const expirySettings = {};
    settings.rows.forEach(row => {
      expirySettings[row.setting_key] = parseInt(row.setting_value) || 0;
    });

    // Delete old group messages
    if (expirySettings.group_message_expiry_minutes > 0) {
      await pool.query(
        `DELETE FROM messages WHERE created_at < NOW() - INTERVAL '${expirySettings.group_message_expiry_minutes} minutes'`
      );
    }

    // Delete old private messages
    if (expirySettings.private_message_expiry_minutes > 0) {
      await pool.query(
        `DELETE FROM private_messages WHERE created_at < NOW() - INTERVAL '${expirySettings.private_message_expiry_minutes} minutes'`
      );
    }

  } catch (error) {
    console.error('Mesaj silmə xətası:', error);
  }
}, 60000); // Hər dəqiqə

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server xətası:', err);
  res.status(500).json({ error: 'Server xətası baş verdi' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Səhifə tapılmadı' });
});

// PORT konfiqurasiyası (Render.com üçün)
const PORT = process.env.PORT || 3000;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database bağlantı xətası:', err);
    console.log('⚠️  Server database olmadan işləyir (bəzi funksiyalar işləməyəcək)');
  } else {
    console.log('✅ Database bağlantısı uğurlu');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ${PORT} portunda işləyir`);
  console.log(`📍 http://localhost:${PORT}`);
});
