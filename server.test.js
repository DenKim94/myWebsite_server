import request from 'supertest';
import dotenv from 'dotenv';
import server from './server'; // Importiere die Express-App aus der server.js-Datei

dotenv.config();

describe("Tests for Captcha and E-Mail Validation", () => {
  const postURL = "/api/validate-captcha";  
  const mockCaptchaToken = "mock-captcha-token";
  const mockUserEmail = "test@example.com";
  const blockedEmail = "blocked@example.com"; // Gleich wie in der .env-Datei (ggf. anpassen)
  
  console.log(">> Blacklist @Test: ", process.env.EMAIL_BLACKLIST);

  afterAll(() => {
    // Schließen Sie hier alle offenen Verbindungen oder Timer
    server.close();
  });

  test("should return 400 if captchaToken is missing", async () => {
    const response = await request(server)
      .post(postURL)
      .send({ captchaToken: undefined, userEmail: mockUserEmail });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Ungültiger Captcha-Token." });
  });

  test("should return 400 if 'userEmail' is on the blacklist", async () => {
    const response = await request(server)
      .post(postURL)
      .send({ captchaToken: mockCaptchaToken, userEmail: blockedEmail });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "E-Mail-Adresse ist blockiert." });
  });

  test("should return 400 if captcha validation fails", async () => {
    // Mock Fetch API Response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false }),
      })
    );

    const response = await request(server)
      .post(postURL)
      .send({ captchaToken: mockCaptchaToken, userEmail: mockUserEmail });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Captcha-Validierung ist fehlgeschlagen. Bitte erneut versuchen." });
  });

  test("should return 200 if captcha validation succeeds", async () => {
    // Mock Fetch API Response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    );

    const response = await request(server)
      .post(postURL)
      .send({ captchaToken: mockCaptchaToken, userEmail: mockUserEmail });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Captcha ist erfolgreich validiert." });
  });

  test("should return 500 if server encounters an error", async () => {
    // Mock Fetch API to throw an error
    global.fetch = jest.fn(() => Promise.reject(new Error("Fetch failed")));

    const response = await request(server)
      .post(postURL)
      .send({ captchaToken: mockCaptchaToken, userEmail: mockUserEmail });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Serverfehler bei der Validierung." });
  });
});