
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper: Lecture sécurisée de la DB avec gestion des erreurs de parsing
const readDb = async () => {
    const defaultDb = { 
        users: [{ username: 'admin', password: 'admin', role: 'DOS' }],
        data: null, 
        activeCrisis: null 
    };

    try {
        await fs.access(DB_FILE);
        const content = await fs.readFile(DB_FILE, 'utf-8');
        
        if (!content.trim()) {
            return defaultDb;
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("JSON Parse Error in DB file. Resetting/Ignoring corrupted file.", parseError);
            // Optionnel : sauvegarder le fichier corrompu .bak ?
            return defaultDb;
        }
    } catch (error) {
        console.warn("DB file not found. Creating new one.");
        await writeDb(defaultDb);
        return defaultDb;
    }
};

// Helper: Écriture sécurisée
const writeDb = async (data) => {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed to write DB:", e);
        throw e;
    }
};

// Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await readDb();
        
        const user = (db.users || []).find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ success: true, user: { username: user.username, role: user.role } });
        } else {
            res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Erreur interne serveur lors du login' });
    }
});

// GET Users
app.get('/api/users', async (req, res) => {
    try {
        const db = await readDb();
        const usersSafe = (db.users || []).map(u => ({ username: u.username, role: u.role }));
        res.json(usersSafe);
    } catch (error) {
        console.error("Get Users error:", error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// CREATE User
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({error: "Tous les champs (username, password, role) sont requis"});
        }

        const db = await readDb();
        if (!db.users) db.users = [];

        if (db.users.find(u => u.username === username)) {
            return res.status(409).json({error: `L'utilisateur '${username}' existe déjà`});
        }

        db.users.push({ username, password, role });
        await writeDb(db);
        
        console.log(`User ${username} created.`);
        res.json({ success: true });
    } catch (error) {
        console.error("Create User error:", error);
        res.status(500).json({ error: 'Erreur serveur lors de la création' });
    }
});

// DELETE User
app.delete('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const db = await readDb();

        if (!db.users) db.users = [];
        
        const initialLength = db.users.length;
        db.users = db.users.filter(u => u.username !== username);

        if (db.users.length === initialLength) {
             return res.status(404).json({error: "Utilisateur introuvable"});
        }

        await writeDb(db);
        console.log(`User ${username} deleted.`);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete User error:", error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
    }
});

// State Endpoints
app.get('/api/state', async (req, res) => {
    try {
        const db = await readDb();
        res.json({ data: db.data, activeCrisis: db.activeCrisis });
    } catch (error) {
        console.error("Get State error:", error);
        res.status(500).json({ error: 'Erreur de lecture de l\'état' });
    }
});

app.post('/api/state', async (req, res) => {
    try {
        const db = await readDb();
        db.data = req.body.data;
        db.activeCrisis = req.body.activeCrisis;
        await writeDb(db);
        res.json({ success: true });
    } catch (error) {
        console.error("Save State error:", error);
        res.status(500).json({ error: 'Erreur de sauvegarde' });
    }
});

// Catch-all 404 for API routes to force JSON response instead of HTML
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint API '${req.originalUrl}' inconnu.` });
});

// Init
readDb().then(() => {
    app.listen(PORT, () => {
        console.log(`PCS Command Server running on http://localhost:${PORT}`);
    });
});
