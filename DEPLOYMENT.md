# Deployment Guide

## Live Demo
- **Application**: https://heygov-crm-frontend.onrender.com
- **API**: https://heygov-crm-api.onrender.com

## Test the Application
1. Visit the application URL
2. The OpenAI API key is pre-configured on the backend
3. Try the AI assistant:
   - "Add John Doe from Acme Corp at john@acme.com"
   - "What's John's email?"
   - "Update John's phone to 555-1234"

## Deployment on Render (Full-Stack)

This application is deployed on Render using their free tier, hosting both backend and frontend.

### Steps to Deploy

1. **Create Render Account**
   - Go to https://render.com and sign up/login
   - Connect your GitHub account

2. **Deploy via Blueprint (Recommended)**
   - Click "New +" → "Blueprint"
   - Connect repository: `emekoba/heyGov-crm`
   - Render will detect `render.yaml` and create both services automatically
   - Set the `OPENAI_API_KEY` environment variable for the API service
   - Click "Apply" to deploy

3. **Manual Deploy (Alternative)**
   
   **Backend API:**
   - New → Web Service
   - Connect GitHub repo: `emekoba/heyGov-crm`
   - Name: `heygov-crm-api`
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Environment Variables:
     - `OPENAI_API_KEY`: your_openai_key
     - `PORT`: 4001
     - `NODE_ENV`: production
   
   **Frontend:**
   - New → Static Site
   - Connect same GitHub repo
   - Name: `heygov-crm-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add Rewrite Rule: `/api/*` → `https://heygov-crm-api.onrender.com/api/:splat`

### Local Testing
```bash
# Clone repository
git clone git@github.com:emekoba/heyGov-crm.git
cd heyGov-crm

# Install dependencies
npm install

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env
echo "PORT=4001" >> .env

# Run application
npm run dev

# Visit http://localhost:4000
```

## Environment Variables

### Backend (.env)
```bash
OPENAI_API_KEY=sk-...          # Required: Your OpenAI API key
PORT=4001                       # Optional: Default 4001
NODE_ENV=production             # Optional: production/development
```

### Frontend
No environment variables needed - API calls are proxied through Vite dev server or configured in deployment platform.

## Configuration Notes

### CORS
Backend is configured to accept requests from any origin in production. For stricter security, update `server/index.ts`:
```typescript
const allowedOrigins = ['https://your-frontend.netlify.app'];
```

### API Proxy
- **Development**: Vite proxy (`vite.config.js`) forwards `/api/*` to `localhost:4001`
- **Production**: Netlify/Vercel rewrites forward `/api/*` to Render backend URL

### Rate Limiting
Consider adding rate limiting for production:
```bash
npm install express-rate-limit
```

## Troubleshooting

### Backend Won't Start on Render
- Check logs in Render dashboard
- Verify `OPENAI_API_KEY` is set
- Ensure `npm run server` works locally

### Frontend Can't Reach Backend
- Check Network tab in browser DevTools
- Verify backend URL in `netlify.toml` or `vercel.json`
- Ensure CORS is enabled on backend

### OpenAI API Errors
- Verify API key is valid and has credits
- Check OpenAI status page
- Review server logs for specific error messages

## Performance Notes

- **Render Free Tier**: Services spin down after 15 minutes of inactivity
- **First Request**: Takes ~30-60 seconds to wake up the service
- **Subsequent Requests**: Fast response times while active
- **Upgrade**: For production use, upgrade to paid tier ($7/month per service) for always-on instances

## Cost Estimate

- **Render Free Tier**: $0/month (both services)
- **OpenAI API**: ~$0.01 per 100 queries (gpt-4o-mini)

**Total for assessment**: Free

## Support

For issues or questions:
- GitHub Issues: https://github.com/emekoba/heyGov-crm/issues
- Email: Check repository owner profile
