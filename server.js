import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';


// Laden und prüfen der Umgebungsvariablen
dotenv.config();
const { PORT, URL_CLIENT, CAPTCHA_SECRET_KEY, EMAIL_BLACKLIST } = process.env;

if (!CAPTCHA_SECRET_KEY || !URL_CLIENT) {
  throw new Error('Fehlende Umgebungsvariablen: Bitte setze CAPTCHA_SECRET_KEY und URL_CLIENT.');
}

// Blacklist aus der .env-Datei in ein Array umwandeln
const emailBlacklist = EMAIL_BLACKLIST ? EMAIL_BLACKLIST.split(',').map(email => email.trim().toLowerCase()) : [];
console.log('Blacklist: ', emailBlacklist);

const app = express();

// Middleware: CORS-Konfiguration
app.use(express.json()); 
app.use(cors({
  origin: process.env.URL_CLIENT,
  methods: ['GET', 'POST'],
}));


app.post('/api/validate-captcha', async (req, res) => {

    // Captcha-Token und E-Mail vom Client erhalten
    const { captchaToken, userEmail } = req.body;
    if (!captchaToken) {
      return res.status(400).json({ error: 'Ungültiger Captcha-Token.' });
    }

    // Überprüfen, ob die erhaltene E-Mail-Adresse auf der Blacklist steht
    const isBlockedUser = emailBlacklist.includes(userEmail.toLowerCase());

    if (isBlockedUser) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist blockiert.' });
    }

    try {
      // Validierung des Captcha-Tokens: Anfrage an die GOOGLE-API
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET_KEY}&response=${captchaToken}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: CAPTCHA_SECRET_KEY, response: captchaToken }),
      });
  
      const verifyResult = await verifyResponse.json();

      // Rückmeldung an den CLient  
      if (!verifyResult.success) {
        return res.status(400).json({ error: 'Captcha-Validierung ist fehlgeschlagen.' });
      }
      res.status(200).json({ message: 'Captcha ist erfolgreich validiert.' });

    } catch (error) {
      console.error('Serverfehler bei der Captcha-Validierung: ', error);
      res.status(500).json({ error: 'Serverfehler bei der Validierung.' });
    }
  });

  app.listen(PORT || 3001, () => {
    console.log(`Server läuft auf Port ${PORT || 3001}`);
  });