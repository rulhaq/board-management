# Board Governance AI Platform

A comprehensive, secure, and efficient board governance platform designed for modern organizations. Built with SvelteKit and Firebase, this platform provides complete board management capabilities including document management, meeting coordination, voting systems, member management, and AI-powered assistance.

## 🚀 Features

- **Dashboard**: Real-time overview of board activities, upcoming meetings, recent documents, and voting ballots
- **Document Management**: Secure document upload, storage, and retrieval with OCR capabilities
- **Meeting Management**: Schedule, manage, and export meetings to calendar applications
- **Voting System**: Create and manage voting ballots with real-time results tracking
- **Member Management**: Comprehensive board member profiles and role-based access control
- **AI Assistant**: Intelligent chat assistant powered by multiple LLM providers (OpenAI, Groq, Ollama, vLLM)
- **Reports & Analytics**: Generate comprehensive reports on board activities
- **Audit Logging**: Complete activity tracking and audit trails
- **Role-Based Access Control**: Admin, Secretary, and Board Member roles with granular permissions
- **Real-time Chat**: Team communication and collaboration
- **Notifications**: Real-time notifications for important events

## 🏢 Ownership

This software is conceptualized, built, and owned by **Scalovate Systems Solutions**.

- **Website**: [www.scalovate.com](https://www.scalovate.com)
- **Support Email**: support@scalovate.com

## 📋 Prerequisites

- Node.js 20+ (or Docker)
- Firebase project with Firestore, Authentication, and Storage enabled
- Firebase Admin SDK service account credentials
- (Optional) AI API keys (OpenAI, Groq) or self-hosted LLM (Ollama, vLLM)

## 🛠️ Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rulhaq/board-management.git
   cd board-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and add your Firebase configuration and API keys.

4. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Option 2: Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   The application will be available at `http://localhost:3000`

2. **Or build Docker image manually**
   ```bash
   docker build -t board-governance-ai .
   docker run -p 3000:3000 --env-file .env board-governance-ai
   ```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Create a service account and download the private key
6. Update your `.env` file with Firebase credentials

### Environment Variables

See `env.example` for all required environment variables:

- **Firebase Configuration**: API Key, Auth Domain, Project ID, Storage Bucket, etc.
- **AI Integration**: OpenAI API Key, Groq API Key (optional)
- **Firebase Admin SDK**: Private Key and Client Email for server-side operations
- **Email Configuration**: SMTP settings for notifications

### Firestore Security Rules

Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

See `firestore.rules` for the complete security rules configuration.

## 📦 Building for Production

```bash
npm run build
```

The production build will be in the `build` directory.

### Deploy to Firebase Hosting

```bash
npm run deploy
```

Or manually:
```bash
firebase deploy --only hosting
```

## 🐳 Docker Deployment

### Using Docker Compose

1. Update `docker-compose.yml` with your environment variables
2. Run:
   ```bash
   docker-compose up -d
   ```

### Using Dockerfile

1. Build the image:
   ```bash
   docker build -t board-governance-ai .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     --name board-governance \
     board-governance-ai
   ```

### Health Check

The Docker container includes a health check that verifies the application is running on port 3000.

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)**: Complete guide for end users
- **[Product Guide](PRODUCT_GUIDE.md)**: Technical documentation and architecture details

## 🎯 Usage

### Initial Setup

1. **Create Admin User**: Use the Firebase Console or the provided script to create the first admin user
2. **Configure Roles**: Set up user roles (admin, secretary, board_member) in Firestore
3. **Configure AI**: Set up AI providers in the Admin Console (if using AI features)

### Default Admin Credentials

After initial setup, create an admin user with:
- Email: `cto@scalovate.com` (or your preferred admin email)
- Role: `admin`

### Admin Console

Access the Admin Console from the user menu (admin role only) to:
- Manage AI provider settings
- View system statistics
- Manage users
- View audit logs
- Monitor app activity

## 🔒 Security

- All data is encrypted in transit (HTTPS)
- Role-based access control (RBAC)
- Firestore security rules enforce data access
- Firebase Authentication for user management
- Audit logging for all critical operations

## 🧪 Development

### Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── services/       # Business logic services
│   │   ├── stores/         # Svelte stores
│   │   └── firebase.ts     # Firebase client configuration
│   ├── routes/             # SvelteKit routes
│   │   ├── api/            # API endpoints
│   │   └── [pages]/        # Page components
│   └── app.html            # HTML template
├── static/                 # Static assets
├── scripts/                # Utility scripts
├── firestore.rules         # Firestore security rules
└── firebase.json           # Firebase configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check with svelte-check
- `npm run deploy` - Build and deploy to Firebase Hosting

## 🤝 Contributing

This is a proprietary software owned by Scalovate Systems Solutions. For modifications, enhancements, or custom development:

**Contact**: support@scalovate.com

### Custom Development Services

Scalovate Systems Solutions offers custom development services for:

- **Admin Console Enhancements**: Extended functionality and features
- **AI OCR Integration**: Document processing with OCR and LLM integration
- **Custom LLM Fine-tuning**: Fine-tuned models for specific use cases
- **vLLM Integration**: Self-hosted LLM deployment with vLLM
- **OpenShift AI Deployment**: Enterprise deployment on OpenShift AI
- **Cloud Deployment**: AWS, GCP, Azure deployment and infrastructure
- **Feature Development**: Custom features and integrations
- **UI/UX Enhancements**: Custom design and user experience improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Commercial Use**: This software is provided "as is" for commercial use. For custom modifications, enhancements, and professional services, please contact Scalovate Systems Solutions.

## 📞 Support

For support, feature requests, or custom development inquiries:

- **Email**: support@scalovate.com
- **Website**: [www.scalovate.com](https://www.scalovate.com)

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Scalovate Systems Solutions shall not be liable for any damages arising from the use of this software.

## 🔄 Version

Current Version: **1.0.0**

---

**Built with ❤️ by Scalovate Systems Solutions**
