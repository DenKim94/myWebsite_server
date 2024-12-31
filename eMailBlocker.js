import fs from "fs";
import path from "path";

// Pfad zur .log-Datei
const logFilePath = path.resolve("blocked_emails.log");

// Funktion zum Hinzufügen einer E-Mail-Adresse zur Log-Datei
export function blockEmail(email) {

    // Prüfen, ob die Log-Datei existiert und ggf. erstellen
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '', 'utf8'); 
        console.log(">> Log-Datei wurde erstellt:", logFilePath);
    }

    if (!isValidEmail(email)) {
        console.error(">> Ungültige E-Mail-Adresse:", email);
        return;
    }

    const currentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 12 Monate hinzufügen

    const newEntry = {
        email,
        blockedAt: formatDate(currentDate),
        expiresAt: formatDate(expiryDate),
    };

    // Log-Datei laden
    const fileData = fs.existsSync(logFilePath) ? fs.readFileSync(logFilePath, 'utf8') : '';
    const entries = fileData
        .split('\n')
        .filter(Boolean) // Leere Zeilen entfernen
        .map((line) => JSON.parse(line));

    // Prüfen, ob die E-Mail bereits existiert
    const emailExists = entries.some((entry) => entry.email === email);

    if (emailExists) {
        return;
    }

    // Neue E-Mail hinzufügen
    entries.push(newEntry);
    const updatedData = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
    fs.writeFileSync(logFilePath, updatedData, 'utf8');
}

// Funktion zur Überprüfung und Bereinigung abgelaufener Einträge
export function updateLogFile() {
    const now = new Date();

    if (!fs.existsSync(logFilePath)) {
        console.log(">> Die Log-Datei wurde nicht gefunden.");
        return;
    }

    const fileData = fs.readFileSync(logFilePath, 'utf8');
    const lines = fileData.split('\n').filter(Boolean); // Leere Zeilen entfernen

    const uniqueEntries = new Map(); // Zur Vermeidung von Duplikaten

    lines.filter((line) => {
        try {
            const entry = JSON.parse(line);

            // Ablaufdatum prüfen
            const expiryDate = parseDate(entry.expiresAt);

            if (expiryDate <= now) {
                return false; // Abgelaufene Einträge entfernen/ignoeiren
            }

            // Eindeutige Einträge basierend auf der E-Mail
            if (!uniqueEntries.has(entry.email)) {
                uniqueEntries.set(entry.email, entry);
                return true;
            }

            return false; // Duplikat ignorieren
        } catch (error) {
            console.error("Ungültiger Log-Eintrag:", line);
            return false;
        }
    });

    const updatedData = Array.from(uniqueEntries.values()).map((entry) => JSON.stringify(entry)).join('\n') + '\n';

    fs.writeFileSync(logFilePath, updatedData, 'utf8');
    console.log(">> Die Log-Datei ist aktualisiert.");
}

// Hilfsfunktion zum Validieren von E-Mail-Adressen
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Hilfsfunktion zum Formatieren des Datums
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Hilfsfunktion: Konvertiere Datum von dd.mm.yyyy in ein gültiges Datumsobjekt
function parseDate(dateString) {
    const [day, month, year] = dateString.split('.').map(Number); // Zerlegen in Tag, Monat, Jahr
    return new Date(year, month - 1, day); // Erzeuge ein Date-Objekt (Monat 0-basiert)
}