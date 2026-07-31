# TradeGuard AI - Node.js Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update `.env` file with your MongoDB Atlas URI:
```
MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster0.xxxxx.mongodb.net/tradeguard?retryWrites=true&w=majority
```

3. Start the development server:
```bash
npm run dev
```

4. The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Shipments
- `GET /api/shipments` - Get user's shipments (supports sorting)
- `GET /api/shipments/stats` - Get dashboard statistics
- `GET /api/shipments/:id` - Get single shipment
- `DELETE /api/shipments/:id` - Delete a shipment

### Prediction
- `POST /api/predict` - Get ML prediction for a shipment

### Health
- `GET /api/health` - Check if the server is running
