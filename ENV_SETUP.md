## Environment variables

Create a `.env.local` file in `bolchodemo/` with:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/demobolcho

# Admin login (for /admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_JWT_SECRET=change-me-long-random

# Demo page password sessions (cookie signing)
DEMO_JWT_SECRET=change-me-long-random

# Debug logging
DEBUG_CALLS=1
```


