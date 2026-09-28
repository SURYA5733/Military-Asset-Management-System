import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { auditLog } from './middleware/audit.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import purchasesRoutes from './routes/purchases.routes.js';
import transfersRoutes from './routes/transfers.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import expendituresRoutes from './routes/expenditures.routes.js';
import metaRoutes from './routes/meta.routes.js';
import auditRoutes from './routes/audit.routes.js';
import usersRoutes from './routes/users.routes.js';   // <-- new

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());
app.use(morgan('dev'));
app.use(auditLog);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/expenditures', expendituresRoutes);
app.use('/api/users', usersRoutes);                   // <-- new
app.use('/api', metaRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
connectDB().then(() => app.listen(port, () => console.log(`🚀 API on http://localhost:${port}`)));